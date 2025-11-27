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
    
    // COORDENADAS BASADAS EN DISEÑO - MEDIDAS EN CM (convertidas a puntos)
    // Conversión: 1cm = 28.35 puntos
    // Origen en pdf-lib: esquina inferior izquierda
    // Template real: width x height en puntos
    
    // Color azul corporativo: #4285F4
    const blueColor = rgb(0.259, 0.522, 0.957); // #4285F4
    
    // Función helper para convertir CM a puntos
    const cmToPts = (cm: number) => cm * 28.35;
    
    // 1. TÍTULO DEL CURSO
    // Posición: x=1.06cm, y=8.54cm (desde arriba)
    // Tamaño máximo: ancho 15.78cm, alto 3.93cm
    // Convertir y desde arriba a coordenadas de PDF: height - y_cm_en_pts
    const courseFontSize = 14;
    const courseText = certificateData.courseName;
    const courseX = cmToPts(1.06);
    const courseY = height - cmToPts(8.54);
    const courseMaxWidth = cmToPts(15.78); // Ancho máximo 15.78cm
    
    firstPage.drawText(courseText, {
      x: courseX,
      y: courseY,
      size: courseFontSize,
      font: fontBold,
      color: blueColor,
      maxWidth: courseMaxWidth,
    });
    
    // 2. Texto "Desde ITSCHOOL certificamos que [NOMBRE] ha finalizado y aprobado el curso."
    // Posición: x=1.06cm, y=13.25cm desde arriba
    const textFontSize = 14;
    const xText = cmToPts(1.06);
    const line1Y = height - cmToPts(13.25);
    
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
    // 3. Texto "Cumpliendo todos los requisitos exigidos."
    // Posición: x=1.06cm, y=14.41cm desde arriba
    const line2Y = height - cmToPts(14.41);quisitos exigidos.", {
      x: xText,
      y: line2Y,
      size: textFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    // 4. Nombre del DOCENTE
    // 4. Nombre del DOCENTE
    // Posición: x=11.72cm, y=18.67cm desde arriba
    // Tamaño de letra: 11
    const instructorFontSize = 11;
    const instructorText = certificateData.instructorName;
    const instructorX = cmToPts(11.72);
    const instructorY = height - cmToPts(18.67);
    
    firstPage.drawText(instructorText, {
      x: instructorX,
      y: instructorY,
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
