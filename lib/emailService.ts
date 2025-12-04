import nodemailer from 'nodemailer';

/**
 * Servicio de envío de emails para certificados
 * 
 * Configura las siguientes variables de entorno:
 * - SMTP_HOST: Servidor SMTP (ej: smtp.gmail.com)
 * - SMTP_PORT: Puerto (ej: 587)
 * - SMTP_USER: Usuario/email de IT School
 * - SMTP_PASSWORD: Contraseña o App Password
 * - SMTP_FROM_NAME: Nombre del remitente (ej: "IT School")
 * - SMTP_FROM_EMAIL: Email del remitente
 */

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'IT School';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER;

// URL de la carta compromiso (PDF estático)
const CARTA_COMPROMISO_URL = process.env.CARTA_COMPROMISO_URL || '';

interface SendCertificateEmailOptions {
  to: string;
  studentName: string;
  courseName: string;
  certificatePdfUrl: string;
  validationUrl: string;
}

/**
 * Crea el transporter de Nodemailer
 */
function createTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn('⚠️ Variables de entorno SMTP no configuradas. El envío de emails está deshabilitado.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true para 465, false para otros puertos
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

/**
 * Genera el HTML del email de certificado
 */
function generateEmailHtml(options: SendCertificateEmailOptions): string {
  const { studentName, courseName, validationUrl } = options;
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu certificado de IT School</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #4285F4 0%, #393185 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚀 IT SCHOOL</h1>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
          ¡Hola! 👋
        </p>
        
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
          Espero que este mensaje te encuentre muy bien. Nos alegra mucho contactarte para enviarte el 
          <strong>certificado de aprobación del curso de ${courseName}</strong>.
        </p>
        
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
          Adjunto encontrarás una <strong>carta de compromiso de IT School</strong> 🎓, donde te invitamos a participar 
          en diversas actividades para ayudar a promover nuestra propuesta educativa y contribuir al éxito de nuestros estudiantes.
        </p>
        
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
          Por favor, revisa el documento adjunto para obtener más detalles sobre las actividades propuestas y cómo puedes 
          participar. Tu colaboración es voluntaria y apreciamos enormemente tu compromiso con nuestra comunidad educativa.
        </p>
        
        <!-- CTA Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f7ff; border-radius: 10px; margin: 30px 0;">
          <tr>
            <td style="padding: 25px; text-align: center;">
              <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
                <strong>📣 Nos gustaría invitarte a compartir tu testimonio</strong>
              </p>
              <p style="font-size: 14px; color: #555; margin-bottom: 0;">
                Si estás de acuerdo, por favor responde a este correo con tu testimonio, el cual utilizaremos para 
                dar a conocer nuestra institución y motivar a otros a unirse a nuestros cursos.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Job Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3e0; border-radius: 10px; margin: 30px 0;">
          <tr>
            <td style="padding: 25px; text-align: center;">
              <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
                <strong>💼 ¿Estás buscando trabajo?</strong>
              </p>
              <p style="font-size: 14px; color: #555; margin-bottom: 20px;">
                Adjuntanos tu CV en el siguiente link:
              </p>
              <a href="https://hiringroom.com/jobs/get_vacancy/6055fe1bfccb5440c113f280/candidates/new" 
                 style="display: inline-block; background-color: #4285F4; color: #ffffff; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                Subir CV a Hiring Room
              </a>
            </td>
          </tr>
        </table>
        
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
          Si tienes alguna pregunta o necesitas más información, no dudes en ponerte en contacto con nosotros. 
          Estamos aquí para ayudarte en todo lo que necesites.
        </p>
        
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
          ¡Esperamos contar con tu participación y colaboración! 💪
        </p>
        
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-top: 30px;">
          Atentamente,<br>
          <strong style="color: #4285F4;">IT School</strong>
        </p>
      </td>
    </tr>
    
    <!-- Validation Link -->
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
        <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
          Podés validar tu certificado en cualquier momento:
        </p>
        <a href="${validationUrl}" style="color: #4285F4; font-size: 14px; word-break: break-all;">
          ${validationUrl}
        </a>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 25px 30px; background-color: #333; text-align: center;">
        <p style="color: #aaa; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} IT School - Instituto de Tecnología y Desarrollo de Software
        </p>
        <p style="margin: 10px 0 0 0;">
          <a href="https://www.instagram.com/itlovers" style="color: #aaa; margin: 0 10px; text-decoration: none;">Instagram</a>
          <a href="https://www.tiktok.com/@itlovers" style="color: #aaa; margin: 0 10px; text-decoration: none;">TikTok</a>
          <a href="https://www.itschool.com.ar" style="color: #aaa; margin: 0 10px; text-decoration: none;">Web</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Descarga un archivo desde una URL y lo devuelve como Buffer
 */
async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error descargando archivo: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Envía el email de certificado al estudiante
 * 
 * @returns true si se envió correctamente, false si hubo error o SMTP no configurado
 */
export async function sendCertificateEmail(options: SendCertificateEmailOptions): Promise<boolean> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('📧 Envío de email deshabilitado (SMTP no configurado)');
    return false;
  }

  try {
    console.log('📧 Preparando email para:', options.to);

    // Descargar el PDF del certificado
    const certificatePdf = await downloadFile(options.certificatePdfUrl);
    console.log('📄 Certificado PDF descargado:', certificatePdf.length, 'bytes');

    // Preparar adjuntos
    const attachments: nodemailer.Attachment[] = [
      {
        filename: `Certificado-${options.courseName.replace(/\s+/g, '-')}-${options.studentName.replace(/\s+/g, '-')}.pdf`,
        content: certificatePdf,
        contentType: 'application/pdf',
      },
    ];

    // Descargar carta compromiso si está configurada
    if (CARTA_COMPROMISO_URL) {
      try {
        const cartaCompromiso = await downloadFile(CARTA_COMPROMISO_URL);
        attachments.push({
          filename: 'Carta-Compromiso-ITSchool.pdf',
          content: cartaCompromiso,
          contentType: 'application/pdf',
        });
        console.log('📄 Carta compromiso descargada:', cartaCompromiso.length, 'bytes');
      } catch (error) {
        console.warn('⚠️ No se pudo descargar la carta compromiso:', error);
      }
    }

    // Enviar email
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to: options.to,
      subject: `🎓 Tu certificado de ${options.courseName} - IT School`,
      html: generateEmailHtml(options),
      attachments,
    });

    console.log('✅ Email enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return false;
  }
}

/**
 * Verifica si el servicio de email está configurado
 */
export function isEmailServiceEnabled(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);
}
