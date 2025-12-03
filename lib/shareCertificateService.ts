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
