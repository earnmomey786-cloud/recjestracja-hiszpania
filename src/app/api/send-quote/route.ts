import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Para archivos temporales
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando procesamiento de solicitud send-quote');
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Cambiar de JSON a FormData para recibir archivos
    const formData = await request.formData();
    console.log('FormData recibido');
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const fileCount = parseInt(formData.get('fileCount') as string || '0');

    // Procesar archivos del FormData
    const files = [];
    const fileAttachments = [];

    for (let [key, value] of formData.entries()) {
      if (key.startsWith('files[') && value && typeof value === 'object' && 'name' in value && 'size' in value) {
        const file = value as any;
        files.push(file);

        // Procesar archivo de manera segura
        let buffer: Buffer;
        let contentType: string;

        if (typeof file.arrayBuffer === 'function') {
          buffer = Buffer.from(await file.arrayBuffer());
          contentType = file.type || 'application/octet-stream';
        } else if (file instanceof Buffer) {
          buffer = file;
          contentType = 'application/octet-stream';
        } else {
          // Si no es un archivo válido, saltar
          continue;
        }

        fileAttachments.push({
          filename: file.name || 'archivo',
          content: buffer,
          contentType: contentType
        });
      }
    }

    // ENVIAR EMAILS REALES
    const shouldSimulate = false;

    if (shouldSimulate) {
      console.log('🚀 === EMAIL SIMULADO (DESARROLLO) ===');

      console.log('\n📧 EMAIL AL CLIENTE:');
      console.log('='.repeat(50));
      console.log(`De: ${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@rejestracjahiszpania.com'}`);
      console.log(`Para: ${email}`);
      console.log(`Asunto: Potwierdzenie - Wniosek o wycenę - RejestracjaHiszpania.com`);
      console.log('\n📋 Contenido resumido:');
      console.log(`- Cliente: ${fullName}`);
      console.log(`- Mensaje: Confirmación automática con datos y siguientes pasos`);

      console.log('\n📧 EMAIL AL ADMINISTRADOR:');
      console.log('='.repeat(50));
      console.log(`De: ${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@rejestracjahiszpania.com'}`);
      console.log(`Para: ${process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@local'}`);
      console.log(`Asunto: 🆕 Nueva solicitud de presupuesto - ${fullName}`);
      console.log(`- Cliente: ${fullName}`);
      console.log(`- Email: ${email}`);
      console.log(`- Teléfono: ${phone}`);
      console.log(`- Archivos: ${files.length}`);

      if (files.length > 0) {
        console.log('\n📄 Archivos preparados para adjunto:');
        files.forEach((file, index) => {
          console.log(`${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        });
      }

      console.log('\n✅ === SIMULACIÓN COMPLETADA ===\n');
      console.log('En producción se enviarían emails reales con archivos adjuntos.\n');

      return NextResponse.json({
        success: true,
        message: `✅ Email SIMULADO - ${files.length} archivos preparados para adjunto`,
        mode: 'development'
      });
    }

    // PRODUCCIÓN: Envía emails reales automáticamente
    // Configurar el transporte de email usando tu servidor
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.pgkhiszpania.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Configuración mejorada para Docker
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      debug: true,
      logger: true
    });

    // Preparar información de archivos para el email
    let filesInfo = 'No se subieron archivos';
    if (files && files.length > 0) {
      filesInfo = files.map((file: any, index: number) =>
        `${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      ).join('\n');
    }

    // Email al cliente (confirmación en polaco)
    const userMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Potwierdzenie - Wniosek o wycenę - RejestracjaHiszpania.com',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Dziękujemy za Twoje zgłoszenie!</h2>

          <p>Witaj <strong>${fullName}</strong>,</p>

          <p>Otrzymaliśmy prawidłowo Twoją prośbę o wycenę rejestracji pojazdu w Hiszpanii.</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Tus datos recibidos:</h3>
            <p><strong>Nombre:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Teléfono:</strong> ${phone}</p>
            <p><strong>Archivos enviados:</strong> ${files ? files.length : 0}</p>
            <p><strong>Fecha de recepción:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Información enviada:</strong></p>
            ${filesInfo.split('\n').map(file => `<p style="margin: 3px 0;">📄 ${file}</p>`).join('')}
          </div>

          <p><strong>¿Qué sucede ahora?</strong></p>
          <ul>
            <li>Revisaremos tu documentación</li>
            <li>Calcularemos el presupuesto personalizado</li>
            <li>Te enviaremos un presupuesto detallado por email</li>
            <li>Si tienes dudas: +34 684 793 797</li>
          </ul>

          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📞 Kontakt bezpośredni:</strong> +34 684 793 797</p>
            <p style="margin: 5px 0 0 0;"><strong>✉️ Email:</strong> info@rejestracjahiszpania.com</p>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Pozdrowienia serdeczne,<br>
            Zespół RejestracjaHiszpania.com
          </p>
        </div>
      `
    };

    // Email al administrador (notificación interna)
    const adminMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `🆕 Nueva solicitud de presupuesto - ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🆕 Nueva Solicitud de Presupuesto</h2>

          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #991b1b;">Datos del cliente:</h3>
            <p><strong>Nombre:</strong> ${fullName}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Teléfono:</strong> <a href="tel:${phone}">${phone}</a></p>
            <p><strong>Archivos enviados:</strong> ${files ? files.length : 0}</p>
            <p><strong>Fecha/Hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>

          ${filesInfo !== 'No se subieron archivos' ?
            `<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0;">📄 Archivos enviados:</h4>
              <pre style="white-space: pre-wrap;">${filesInfo}</pre>
            </div>` : ''
          }

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">📋 Próximos pasos:</h4>
            <ol>
              <li>Contactar al cliente para confirmar recepción</li>
              <li>Revisar documentación si se envió</li>
              <li>Calcular presupuesto personalizado</li>
              <li>Enviar presupuesto por email en 24-48 horas</li>
            </ol>
          </div>

          <p style="color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Este es un email automático generado por RejestracjaHiszpania.com<br>
            Sistema de gestión de solicitudes: 100% automático
          </p>
        </div>
      `
    };

    // Enviar ambos emails automáticamente
    try {
      await Promise.all([
        transporter.sendMail(userMailOptions),
        transporter.sendMail(adminMailOptions)
      ]);

      console.log(`✅ Emails enviados correctamente a:
      - Cliente: ${email}
      - Administrador: ${process.env.ADMIN_EMAIL || process.env.SMTP_USER}`);

      return NextResponse.json({
        success: true,
        message: '✅ Emails enviados correctamente - Sistema funcionando al 100%'
      });

    } catch (emailError) {
      console.error('Error enviando emails:', emailError);
      return NextResponse.json({
        success: false,
        error: 'Error enviando emails - Revisar configuración SMTP'
      }, { status: 500 });
    }

  } catch (error) {
   console.error('Error procesando solicitud:', error);
   console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
   return NextResponse.json({
     success: false,
     error: `Error procesando solicitud: ${error instanceof Error ? error.message : 'Unknown error'}`
   }, { status: 500 });
 }
}