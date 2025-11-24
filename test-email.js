const nodemailer = require('nodemailer');
require('dotenv').config();

(async () => {
  try {
    console.log('Iniciando prueba SMTP con las siguientes variables (no se muestra la contraseña):');
    console.log('SMTP_HOST=', process.env.SMTP_HOST);
    console.log('SMTP_PORT=', process.env.SMTP_PORT);
    console.log('SMTP_USER=', process.env.SMTP_USER);
    console.log('SMTP_FROM=', process.env.SMTP_FROM);
    console.log('ADMIN_EMAIL=', process.env.ADMIN_EMAIL);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: (process.env.SMTP_PORT || '465') === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        // Nota: si tu servidor tiene certificado válido, cambia a true
        rejectUnauthorized: false
      }
    });

    // Verificar conexión
    const ok = await transporter.verify();
    console.log('Verificación de transporter:', ok);

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: 'Prueba SMTP — RejestracjaHiszpania',
      text: `Mensaje de prueba enviado desde test-email.js - ${new Date().toISOString()}`
    });

    console.log('Mensaje enviado, id:', info && info.messageId ? info.messageId : info);
    process.exit(0);
  } catch (err) {
    console.error('Error enviando email de prueba:', err && err.message ? err.message : err);
    if (err && err.response) console.error('Response:', err.response);
    process.exit(1);
  }
})();
