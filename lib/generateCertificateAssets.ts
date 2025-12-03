/**
 * Genera certificado en múltiples formatos: PDF y PNG
 * Para compartir en redes sociales
 */

import { generatePDF } from './pdfGenerator';
import type { CertificateData } from './types';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

export interface CertificateAssets {
  pdfBuffer: Buffer;
  pngBuffer: Buffer;
  pngBase64: string;
}

/**
 * Genera el certificado en PDF y PNG
 * PNG optimizado para redes sociales (1200x849px para mantener ratio A4)
 */
export async function generateCertificateAssets(
  certificateData: CertificateData
): Promise<CertificateAssets> {
  console.log('📸 Generando certificado en PDF y PNG...');
  
  try {
    // 1. Generar PDF
    const pdfBuffer = await generatePDF(certificateData);
    console.log('✅ PDF generado:', pdfBuffer.length, 'bytes');

    // 2. Convertir PDF a PNG usando pdf-lib + sharp
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Obtener dimensiones del PDF (A4 landscape: 842x595 pts)
    const { width, height } = firstPage.getSize();
    console.log('📐 Dimensiones PDF:', width, 'x', height, 'pts');

    // Renderizar PDF a imagen con mayor calidad
    // Usando escala 2x para mejor calidad (1684x1190px)
    const scale = 2;
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    // Crear imagen PNG del certificado
    // Nota: Como pdf-lib no tiene renderizado nativo, usamos una estrategia diferente
    // Exportamos el PDF nuevamente y lo procesamos
    
    // Para simplificar, vamos a usar Canvas para renderizar
    // En producción, considera usar Puppeteer o similar para mejor calidad
    const { createCanvas, loadImage } = await import('canvas');
    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Renderizar el contenido del certificado
    // Esto es una simplificación - en producción usa Puppeteer o similar
    // Por ahora, exportamos el PDF y confiamos en que el usuario comparta el PDF
    
    // Alternativa: generar PNG directamente sin PDF
    // Vamos a crear el PNG usando los mismos datos
    const pngBuffer = await generateCertificatePNG(certificateData, targetWidth, targetHeight);
    
    const pngBase64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    
    console.log('✅ PNG generado:', pngBuffer.length, 'bytes');

    return {
      pdfBuffer,
      pngBuffer,
      pngBase64,
    };
  } catch (error) {
    console.error('❌ Error generando assets del certificado:', error);
    throw error;
  }
}

/**
 * Genera PNG del certificado usando el PDF generado como base
 * Convierte el PDF completo a PNG de alta calidad
 */
async function generateCertificatePNG(
  certificateData: CertificateData,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer> {
  try {
    console.log('🎨 Generando PNG desde PDF...');

    // 1. Generar el PDF completo con el template
    const pdfBuffer = await generatePDF(certificateData);
    console.log('✅ PDF generado:', pdfBuffer.length, 'bytes');

    // 2. Convertir PDF a PNG usando pdf-to-png-converter
    const { pdfToPng } = await import('pdf-to-png-converter');
    
    console.log('🔄 Convirtiendo PDF a PNG...');
    
    // Convertir el PDF buffer a PNG
    const pngPages = await pdfToPng(pdfBuffer, {
      disableFontFace: false,
      useSystemFonts: false,
      viewportScale: 2.0, // 2x para mejor calidad
      outputFolder: undefined, // No guardar en disco, solo buffer
      strictPagesToProcess: false,
      verbosityLevel: 0
    });

    if (!pngPages || pngPages.length === 0) {
      throw new Error('No se pudo convertir el PDF a PNG');
    }

    // Tomar la primera página (los certificados son de una sola página)
    const firstPage = pngPages[0];
    let pngBuffer = firstPage.content;

    console.log('✅ PNG convertido desde PDF:', pngBuffer.length, 'bytes');

    // 3. Redimensionar si es necesario usando sharp
    const image = sharp(pngBuffer);
    const metadata = await image.metadata();
    
    console.log('📐 Dimensiones originales:', metadata.width, 'x', metadata.height);
    
    // Si las dimensiones no coinciden con el target, redimensionar
    if (metadata.width !== targetWidth || metadata.height !== targetHeight) {
      console.log('🔧 Redimensionando a:', targetWidth, 'x', targetHeight);
      pngBuffer = await image
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality: 95, compressionLevel: 6 })
        .toBuffer();
      
      console.log('✅ PNG redimensionado:', pngBuffer.length, 'bytes');
    }

    return pngBuffer;
  } catch (error) {
    console.error('❌ Error en generateCertificatePNG:', error);
    throw error;
  }
}

/**
 * Genera solo el PNG (función auxiliar para el endpoint de compartir)
 */
export async function generateSharePNG(
  certificateData: CertificateData
): Promise<Buffer> {
  // Dimensiones optimizadas para LinkedIn (1200x849px mantiene ratio A4)
  const targetWidth = 1200;
  const targetHeight = 849;
  
  return generateCertificatePNG(certificateData, targetWidth, targetHeight);
}
