import { google } from 'googleapis';

/**
 * Servicio de envío de emails para certificados usando Gmail API
 * 
 * Usa el mismo Service Account de Google Sheets con Domain-Wide Delegation
 * 
 * Variables de entorno necesarias:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Email del Service Account
 * - GOOGLE_PRIVATE_KEY: Private key del Service Account
 * - GMAIL_SEND_AS: Email desde el cual enviar (ej: certificados@itschool.com.ar)
 * - CARTA_COMPROMISO_URL: (opcional) URL al PDF de la carta compromiso
 */

const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GMAIL_SEND_AS = process.env.GMAIL_SEND_AS;
const CARTA_COMPROMISO_URL = process.env.CARTA_COMPROMISO_URL || '';

interface SendCertificateEmailOptions {
  to: string;
  studentName: string;
  courseName: string;
  certificatePdfUrl: string;
  validationUrl: string;
}

/**
 * Crea cliente de Gmail API con Domain-Wide Delegation
 */
function createGmailClient() {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GMAIL_SEND_AS) {
    console.warn('⚠️ Variables de Gmail API no configuradas. El envío de emails está deshabilitado.');
    return null;
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: GMAIL_SEND_AS, // Impersonar este usuario
  });

  return google.gmail({ version: 'v1', auth });
}

/**
 * Genera el HTML del email de certificado
 */
function generateEmailHtml(options: SendCertificateEmailOptions): string {
  const { courseName, validationUrl } = options;
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu certificado de ITSCHOOL</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #4285F4 0%, #393185 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚀 ITSCHOOL</h1>
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
          Adjunto encontrarás una <strong>carta de compromiso de ITSCHOOL</strong> 🎓, donde te invitamos a participar 
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
          <strong style="color: #4285F4;">ITSCHOOL</strong>
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
        <p style="margin: 10px 0 0 0;">
          <a href="https://www.instagram.com/itschool_laposta" style="color: #aaa; margin: 0 10px; text-decoration: none;">Instagram</a>
          <a href="https://www.tiktok.com/@itschool.laposta" style="color: #aaa; margin: 0 10px; text-decoration: none;">TikTok</a>
          <a href="https://www.linkedin.com/company/itschool-educacion-it" style="color: #aaa; margin: 0 10px; text-decoration: none;">LinkedIn</a>
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
 * Convierte contenido a base64 URL-safe para Gmail API
 */
function encodeBase64Url(data: string | Buffer): string {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Crea un email MIME con adjuntos
 */
function createMimeMessage(
  to: string,
  from: string,
  subject: string,
  htmlBody: string,
  attachments: { filename: string; content: Buffer; contentType: string }[]
): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2)}`;
  
  let message = '';
  message += `From: "ITSCHOOL" <${from}>\r\n`;
  message += `To: ${to}\r\n`;
  message += `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=\r\n`;
  message += 'MIME-Version: 1.0\r\n';
  message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
  
  // HTML body
  message += `--${boundary}\r\n`;
  message += 'Content-Type: text/html; charset=UTF-8\r\n';
  message += 'Content-Transfer-Encoding: base64\r\n\r\n';
  message += Buffer.from(htmlBody).toString('base64') + '\r\n\r\n';
  
  // Attachments
  for (const attachment of attachments) {
    message += `--${boundary}\r\n`;
    message += `Content-Type: ${attachment.contentType}; name="${attachment.filename}"\r\n`;
    message += 'Content-Transfer-Encoding: base64\r\n';
    message += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`;
    message += attachment.content.toString('base64') + '\r\n\r\n';
  }
  
  message += `--${boundary}--`;
  
  return message;
}

/**
 * Envía el email de certificado al estudiante usando Gmail API
 * 
 * @returns true si se envió correctamente, false si hubo error
 */
export async function sendCertificateEmail(options: SendCertificateEmailOptions): Promise<boolean> {
  const gmail = createGmailClient();
  
  if (!gmail) {
    console.log('📧 Envío de email deshabilitado (Gmail API no configurado)');
    return false;
  }

  try {
    console.log('📧 Preparando email para:', options.to);

    // Descargar el PDF del certificado
    const certificatePdf = await downloadFile(options.certificatePdfUrl);
    console.log('📄 Certificado PDF descargado:', certificatePdf.length, 'bytes');

    // Preparar adjuntos
    const attachments: { filename: string; content: Buffer; contentType: string }[] = [
      {
        filename: `Certificado-${options.courseName.replace(/[^a-zA-Z0-9]/g, '-')}-${options.studentName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
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

    // Crear mensaje MIME
    const mimeMessage = createMimeMessage(
      options.to,
      GMAIL_SEND_AS!,
      `🎓 Tu certificado de ${options.courseName} - ITSCHOOL`,
      generateEmailHtml(options),
      attachments
    );

    // Enviar email usando Gmail API
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodeBase64Url(mimeMessage),
      },
    });

    console.log('✅ Email enviado via Gmail API:', result.data.id);
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
  return !!(GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY && GMAIL_SEND_AS);
}
