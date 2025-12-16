/**
 * Servicio para compartir certificados en PDF
 * Similar a compartir comprobantes bancarios
 */

export interface ShareOptions {
  certificateUrl: string;
  studentName: string;
  courseName: string;
  validationUrl: string;
}

export interface ShareCapabilities {
  canShareFiles: boolean;
  canShareNative: boolean;
}

/**
 * Detecta las capacidades de compartir del navegador
 */
export function detectShareCapabilities(): ShareCapabilities {
  const canShareNative = typeof navigator !== 'undefined' && !!navigator.share;
  
  let canShareFiles = false;
  if (canShareNative && navigator.canShare) {
    // Crear un File de prueba para verificar soporte
    try {
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      canShareFiles = navigator.canShare({ files: [testFile] });
    } catch (e) {
      canShareFiles = false;
    }
  }

  return {
    canShareNative,
    canShareFiles,
  };
}

/**
 * Descarga el PDF desde la URL y lo convierte a File
 */
export async function fetchPdfAsFile(
  certificateUrl: string,
  fileName: string
): Promise<File> {
  const response = await fetch(certificateUrl);
  
  if (!response.ok) {
    throw new Error('Error al descargar el certificado');
  }

  const blob = await response.blob();
  const file = new File([blob], fileName, { type: 'application/pdf' });
  
  return file;
}

/**
 * Comparte el certificado usando Web Share API (si soporta archivos)
 */
export async function shareWithNativeAPI(options: ShareOptions): Promise<boolean> {
  const capabilities = detectShareCapabilities();
  
  if (!capabilities.canShareNative) {
    return false;
  }

  try {
    const fileName = `Certificado-${options.courseName.replace(/\s+/g, '-')}-${options.studentName.replace(/\s+/g, '-')}.pdf`;
    
    // Descargar PDF como File
    const pdfFile = await fetchPdfAsFile(options.certificateUrl, fileName);
    
    const shareData: ShareData = {
      title: `Certificado de ${options.courseName} - IT School`,
      text: `¡Completé exitosamente el curso de ${options.courseName} en IT School! 🚀🎓\n\nValidá mi certificado: ${options.validationUrl}`,
    };

    // Intentar compartir con archivo si está soportado
    if (capabilities.canShareFiles) {
      shareData.files = [pdfFile];
    } else {
      // Solo compartir texto/URL si no soporta archivos
      shareData.url = options.validationUrl;
    }

    await navigator.share(shareData);
    return true;
  } catch (error) {
    // Usuario canceló o error
    if ((error as Error).name === 'AbortError') {
      return true; // El usuario canceló, no es un error
    }
    console.error('Error sharing:', error);
    return false;
  }
}

/**
 * Genera link para compartir por WhatsApp
 */
export function getWhatsAppShareLink(options: ShareOptions): string {
  const text = `¡Completé exitosamente el curso de *${options.courseName}* en *IT School*! 🚀🎓\n\nValidá mi certificado: ${options.validationUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Genera link para compartir por email
 */
export function getEmailShareLink(options: ShareOptions): string {
  const subject = `Certificado de ${options.courseName} - IT School`;
  const body = `Hola,\n\nTe comparto mi certificado del curso "${options.courseName}" completado en IT School.\n\nPodés validar la autenticidad del certificado en:\n${options.validationUrl}\n\n¡Saludos!\n${options.studentName}`;
  
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Genera link para compartir en LinkedIn
 * LinkedIn solo permite compartir URL, el texto se genera desde los meta tags OG de la página
 */
export function getLinkedInShareLink(options: ShareOptions): string {
  // LinkedIn usa los meta tags Open Graph de la URL compartida
  // Asegurarse de que validationUrl tenga buenos meta tags OG
  const url = encodeURIComponent(options.validationUrl);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
}

/**
 * Opciones para agregar certificación a LinkedIn
 */
export interface LinkedInCertificationOptions {
  certificateName: string;      // Nombre del curso/certificación
  organizationName: string;     // "IT School" o "ITSCHOOL"
  issueMonth: number;           // Mes de emisión (1-12)
  issueYear: number;            // Año de emisión
  expirationMonth?: number;     // Mes de expiración (opcional, certificados permanentes)
  expirationYear?: number;      // Año de expiración (opcional)
  certificationUrl: string;     // URL de validación del certificado
  certificationId: string;      // Token/ID del certificado (últimos 16 caracteres)
}

/**
 * Genera link para agregar certificación directamente al perfil de LinkedIn
 * Esto abre LinkedIn en la sección de agregar certificación con los campos pre-llenados
 * 
 * @see https://www.linkedin.com/help/linkedin/answer/a704787
 */
export function getLinkedInAddCertificationLink(options: LinkedInCertificationOptions): string {
  const params = new URLSearchParams();
  
  // Parámetros requeridos
  params.append('startTask', 'CERTIFICATION_NAME');
  params.append('name', options.certificateName);
  params.append('organizationName', options.organizationName);
  params.append('issueYear', options.issueYear.toString());
  params.append('issueMonth', options.issueMonth.toString());
  params.append('certUrl', options.certificationUrl);
  params.append('certId', options.certificationId);
  
  // Parámetros opcionales (expiración)
  if (options.expirationYear && options.expirationMonth) {
    params.append('expirationYear', options.expirationYear.toString());
    params.append('expirationMonth', options.expirationMonth.toString());
  }
  
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

/**
 * Genera las opciones de LinkedIn desde los datos de ShareOptions
 */
export function buildLinkedInCertificationOptions(
  options: ShareOptions,
  generatedAt: string,
  token: string
): LinkedInCertificationOptions {
  const issueDate = new Date(generatedAt);
  
  return {
    certificateName: options.courseName,
    organizationName: 'ITSCHOOL',
    issueMonth: issueDate.getMonth() + 1, // getMonth() es 0-indexed
    issueYear: issueDate.getFullYear(),
    certificationUrl: options.validationUrl,
    certificationId: token.substring(0, 16).toUpperCase(),
    // Sin expiración = certificado permanente
  };
}

/**
 * Genera link para compartir en X (Twitter)
 */
export function getXShareLink(options: ShareOptions): string {
  const text = encodeURIComponent(`¡Completé el curso de ${options.courseName} en @ITSchool_laPosta 🚀🎓\n\nValidá mi certificado: ${options.validationUrl}`);
  return `https://twitter.com/intent/tweet?text=${text}`;
}

/**
 * Descarga el PDF localmente
 */
export async function downloadPdfLocally(
  certificateUrl: string,
  studentName: string,
  courseName: string
): Promise<void> {
  const response = await fetch(certificateUrl);
  
  if (!response.ok) {
    throw new Error('Error al descargar el certificado');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `Certificado-${courseName.replace(/\s+/g, '-')}-${studentName.replace(/\s+/g, '-')}.pdf`;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}
