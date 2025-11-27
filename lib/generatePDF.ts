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
    
    // COORDENADAS BASADAS EN TU DISEÑO DE FIGMA (A4 landscape = 842 x 595 pts)
    // Conversión: Figma usa píxeles, pdf-lib usa puntos (1:1 en web)
    // Origen en pdf-lib: esquina inferior izquierda
    
    // Color azul corporativo: #4285F4
    const blueColor = rgb(0.259, 0.522, 0.957); // #4285F4
    
    // 1. TÍTULO DEL CURSO
    // Posición Figma: x=45, y=377 (desde arriba)
    // Convertir y desde arriba: 595 - 377 = 218
    const courseFontSize = 14; // Tamaño según especificación
    const courseText = certificateData.courseName;
    firstPage.drawText(courseText, {
      x: 45,
      y: 218,
      size: courseFontSize,
      font: fontBold,
      color: blueColor,
      maxWidth: 750, // Permitir títulos largos
    });
    
    // 2. Texto "Desde ITSCHOOL certificamos que [NOMBRE] ha finalizado y aprobado el curso."
    // Posición: x=1.06cm (30pts), y=13.25cm desde arriba
    // Convertir: 1.06cm = 30pts, 13.25cm = 375pts desde arriba → 595 - 375 = 220pts
    const textFontSize = 14;
    const xText = 30; // 1.06cm ≈ 30pts
    const line1Y = 220; // 13.25cm desde arriba
    
    const beforeName = "Desde ITSCHOOL certificamos que ";
    const studentName = certificateData.studentName;
    const afterName = " ha finalizado y aprobado el curso.";
    
    // Dibujar primera parte
    firstPage.drawText(beforeName, {
      x: xText,
      y: line1Y,
      size: textFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    // Calcular posición del nombre (después del texto anterior)
    const beforeNameWidth = fontRegular.widthOfTextAtSize(beforeName, textFontSize);
    firstPage.drawText(studentName, {
      x: xText + beforeNameWidth,
      y: line1Y,
      size: textFontSize,
      font: fontBold, // Nombre en negrita
      color: blueColor,
    });
    
    // Calcular posición del texto final
    const studentNameWidth = fontBold.widthOfTextAtSize(studentName, textFontSize);
    firstPage.drawText(afterName, {
      x: xText + beforeNameWidth + studentNameWidth,
      y: line1Y,
      size: textFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    // 3. Texto "Cumpliendo todos los requisitos exigidos."
    // Posición: x=1.06cm (30pts), y=14.41cm desde arriba
    // Convertir: 14.41cm = 408pts desde arriba → 595 - 408 = 187pts
    const line2Y = 187; // 14.41cm desde arriba
    firstPage.drawText("Cumpliendo todos los requisitos exigidos.", {
      x: xText,
      y: line2Y,
      size: textFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    // 4. Nombre del DOCENTE
    // Posición: x=12.93cm (366pts), y=18.9cm desde arriba
    // Convertir: 12.93cm = 366pts, 18.9cm = 535pts desde arriba → 595 - 535 = 60pts
    const instructorFontSize = 14;
    const instructorText = certificateData.instructorName;
    firstPage.drawText(instructorText, {
      x: 366, // 12.93cm
      y: 60, // 18.9cm desde arriba
      size: instructorFontSize,
      font: fontRegular,
      color: blueColor,
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
