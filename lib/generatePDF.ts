import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { CertificateData } from './types';

export async function generatePDF(certificateData: CertificateData): Promise<Buffer> {
  try {
    console.log(' Iniciando generación de PDF con pdf-lib...');
    
    // Leer el PDF template
    console.log(' Leyendo template PDF...');
    const templatePath = join(process.cwd(), 'lib', 'certificateTemplate.pdf');
    const existingPdfBytes = readFileSync(templatePath);
    
    // Cargar el PDF
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    const { width, height } = firstPage.getSize();
    console.log(' PDF cargado:', width, 'x', height, 'pts');
    
    // Cargar fuentes (usaremos Helvetica Bold como aproximación a Poppins)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Generar QR Code
    console.log(' Generando QR code...');
    const qrCodeDataUrl = await QRCode.toDataURL(certificateData.validationUrl, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
    
    // Convertir QR de data URL a PNG bytes
    const qrBase64 = qrCodeDataUrl.split(',')[1];
    const qrBytes = Buffer.from(qrBase64, 'base64');
    const qrImage = await pdfDoc.embedPng(qrBytes);
    console.log(' QR code generado');
    
    // COORDENADAS BASADAS EN TU DISEÑO (A4 landscape = 842 x 595 pts)
    // El cohete está en el centro-izquierda, el texto va a la derecha
    
    // 1. Nombre del CURSO (al lado del cohete, tamaño 48 aprox en PDF = 36 pts)
    const courseFontSize = 36;
    const courseText = certificateData.courseName;
    firstPage.drawText(courseText, {
      x: 450, // Derecha del cohete
      y: 330, // Centro vertical
      size: courseFontSize,
      font: fontBold,
      color: rgb(0.23, 0.51, 0.96), // Azul #3B82F6
      maxWidth: 350, // No sobrepasar el borde derecho
    });
    
    // 2. Nombre del ESTUDIANTE (centro, debajo del curso)
    const studentFontSize = 28;
    const studentText = certificateData.studentName.toUpperCase();
    const studentWidth = fontBold.widthOfTextAtSize(studentText, studentFontSize);
    firstPage.drawText(studentText, {
      x: (width - studentWidth) / 2,
      y: 250, // Debajo del curso
      size: studentFontSize,
      font: fontBold,
      color: rgb(0.23, 0.51, 0.96),
    });
    
    // 3. Nombre del DOCENTE (abajo izquierda, donde dice "Docente")
    const instructorFontSize = 18;
    const instructorText = certificateData.instructorName;
    firstPage.drawText(instructorText, {
      x: 575, // Alineado con "Docente" que ya está en el template
      y: 105, // Justo debajo de "Docente"
      size: instructorFontSize,
      font: fontRegular,
      color: rgb(0.23, 0.51, 0.96), // Azul para mantener consistencia
    });
    
    // 4. Insertar QR Code (abajo derecha, donde ya está marcado)
    const qrSize = 80;
    firstPage.drawImage(qrImage, {
      x: width - qrSize - 120, // Esquina inferior derecha
      y: 70,
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
