const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const multer = require('multer');

const createTransporter = () => {
  console.log('SMTP Config:', {
    host: functions.config().smtp.host,
    port: functions.config().smtp.port,
    user: functions.config().smtp.user,
    from: functions.config().smtp.from
  });

  return nodemailer.createTransport({
    host: functions.config().smtp.host,
    port: parseInt(functions.config().smtp.port),
    secure: false, // STARTTLS
    auth: {
      user: functions.config().smtp.user,
      pass: functions.config().smtp.pass
    },
    tls: {
      ciphers: 'SSLv3'
    },
    debug: true
  });
};

// Configurar multer para archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por archivo
    files: 10 // máximo 10 archivos
  }
});

exports.sendEmail = functions.https.onRequest(upload.array('files'), async (req, res) => {
  // Habilitar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Asegurarse de que es una petición POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fullName, email, phone } = req.body;
    const files = req.files || [];
    const config = functions.config().smtp;
    const transporter = createTransporter();

    // Email al cliente
    await transporter.sendMail({
      from: config.from,
      to: email,
      subject: 'Potwierdzenie - Wniosek o wycenę - RejestracjaHiszpania.com',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Dziękujemy za Twoje zgłoszenie!</h2>
          <p>Witaj <strong>${fullName}</strong>,</p>
          <p>Otrzymaliśmy prawidłowo Twoją prośbę o wycenę rejestracji pojazdu w Hiszpanii.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Twoje dane:</h3>
            <p><strong>Imię i nazwisko:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Telefon:</strong> ${phone}</p>
            <p><strong>Data otrzymania:</strong> ${new Date().toLocaleString('pl-PL')}</p>
          </div>
          <p><strong>Co dalej?</strong></p>
          <ul>
            <li>Przeanalizujemy Twoją dokumentację</li>
            <li>Przygotujemy spersonalizowaną wycenę</li>
            <li>Skontaktujemy się z Tobą mailowo lub telefonicznie</li>
          </ul>
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📞 Kontakt bezpośredni:</strong> +34 684 793 797</p>
            <p style="margin: 5px 0 0 0;"><strong>✉️ Email:</strong> info@rejestracjahiszpania.com</p>
          </div>
        </div>
      `
    });

    // Preparar adjuntos
    const attachments = files.map((file, index) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype
    }));

    // Email al administrador
    await transporter.sendMail({
      from: config.from,
      to: config.user,
      subject: `🆕 Nueva solicitud de presupuesto - ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🆕 Nueva Solicitud de Presupuesto</h2>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #991b1b;">Datos del cliente:</h3>
            <p><strong>Nombre:</strong> ${fullName}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Teléfono:</strong> <a href="tel:${phone}">${phone}</a></p>
            <p><strong>Fecha/Hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
            <p><strong>Archivos adjuntos:</strong> ${files.length} archivo(s)</p>
          </div>
        </div>
      `,
      attachments: attachments
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
