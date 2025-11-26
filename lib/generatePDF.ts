import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { CertificateData } from './types';

export async function generatePDF(certificateData: CertificateData): Promise<Buffer> {
  try {
    console.log(' Iniciando generación de PDF con pdf-lib...');
    
    // Leer el PDF template (lo crearemos después)
    console.log(' Leyendo template PDF...');
    const templatePath = join(process.cwd(), 'lib', 'certificateTemplate.pdf');
    const existingPdfBytes = readFileSync(templatePath);
    
    // Cargar el PDF
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    console.log(' PDF cargado:', firstPage.getWidth(), 'x', firstPage.getHeight());
    
    // Cargar fuentes
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Generar QR Code
    console.log(' Generando QR code...');
    const qrCodeDataUrl = await QRCode.toDataURL(certificateData.validationUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
    
    // Convertir QR de data URL a PNG bytes
    const qrBase64 = qrCodeDataUrl.split(',')[1];
    const qrBytes = Buffer.from(qrBase64, 'base64');
    const qrImage = await pdfDoc.embedPng(qrBytes);
    console.log(' QR code generado');
    
    // Obtener dimensiones de la página (A4 landscape = 842 x 595 pts)
    const { width, height } = firstPage.getSize();
    
    // Escribir nombre del curso (centrado, arriba)
    const courseFontSize = 24;
    const courseText = certificateData.courseName.toUpperCase();
    const courseWidth = fontBold.widthOfTextAtSize(courseText, courseFontSize);
    firstPage.drawText(courseText, {
      x: (width - courseWidth) / 2,
      y: height - 200, // Ajustar según tu diseño
      size: courseFontSize,
      font: fontBold,
      color: rgb(0.23, 0.51, 0.96), // Azul #3B82F6
    });
    
    // Escribir nombre del estudiante (centrado, medio)
    const studentFontSize = 32;
    const studentText = certificateData.studentName.toUpperCase();
    const studentWidth = fontBold.widthOfTextAtSize(studentText, studentFontSize);
    firstPage.drawText(studentText, {
      x: (width - studentWidth) / 2,
      y: height / 2 + 20,
      size: studentFontSize,
      font: fontBold,
      color: rgb(0.23, 0.51, 0.96),
    });
    
    // Escribir nombre del instructor (abajo)
    const instructorFontSize = 16;
    const instructorText = Docente: ;
    const instructorWidth = fontRegular.widthOfTextAtSize(instructorText, instructorFontSize);
    firstPage.drawText(instructorText, {
      x: (width - instructorWidth) / 2,
      y: 150,
      size: instructorFontSize,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Insertar QR Code (esquina inferior derecha)
    const qrSize = 100;
    firstPage.drawImage(qrImage, {
      x: width - qrSize - 50,
      y: 50,
      width: qrSize,
      height: qrSize,
    });
    
    console.log(' Texto y QR agregados al PDF');
    
    // Serializar PDF
    const pdfBytes = await pdfDoc.save();
    console.log(' PDF generado, tamaño:', pdfBytes.length, 'bytes');
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error(' Error en generatePDF:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
    throw error;
  }
}
