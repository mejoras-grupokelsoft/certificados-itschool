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
      color: { dark: '#4285F4', light: '#FFFFFF' },
    });
    
    // Convertir QR de data URL a PNG bytes
    const qrBase64 = qrCodeDataUrl.split(',')[1];
    const qrBytes = Buffer.from(qrBase64, 'base64');
    const qrImage = await pdfDoc.embedPng(qrBytes);
    console.log(' QR code generado');
    
    // Cargar ícono de cohete
    console.log(' Cargando ícono de cohete...');
    const rocketPath = join(process.cwd(), 'lib', 'rocket-icon.png');
    const rocketBytes = readFileSync(rocketPath);
    const rocketIcon = await pdfDoc.embedPng(rocketBytes);
    console.log(' Ícono de cohete cargado');
    
    // COORDENADAS BASADAS EN DISEÑO - MEDIDAS EN CM (convertidas a puntos)
    // Conversión: 1cm = 28.35 puntos
    // Origen en pdf-lib: esquina inferior izquierda
    // Template real: width x height en puntos
    
    // Color azul corporativo: #4285F4
    const blueColor = rgb(0.259, 0.522, 0.957); // #4285F4
    
    // Función helper para convertir CM a puntos
    const cmToPts = (cm: number) => cm * 28.35;
    
    // 1. TÍTULO DEL CURSO
    // Posición: x=2cm, y=6cm (desde arriba)
    // Tamaño máximo: ancho 18cm
    // Convertir y desde arriba a coordenadas de PDF: height - y_cm_en_pts
    const courseFontSize = 32;
    const courseText = certificateData.courseName;
    const courseX = cmToPts(2);
    const courseY = height - cmToPts(6);
    const courseMaxWidth = cmToPts(18);
    const courseLineHeight = courseFontSize * 1.2;
    
    // Calcular líneas del título para posicionar la nave dinámicamente
    const words = courseText.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = fontBold.widthOfTextAtSize(testLine, courseFontSize);
      
      if (testWidth > courseMaxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    // Dibujar título
    firstPage.drawText(courseText, {
      x: courseX,
      y: courseY,
      size: courseFontSize,
      font: fontBold,
      color: blueColor,
      maxWidth: courseMaxWidth,
      lineHeight: courseLineHeight,
    });
    
    // Posicionar nave 🚀 dinámicamente basándose en el ancho máximo del título
    // Calcular el ancho más largo entre todas las líneas del título
    let maxLineWidth = 0;
    for (const line of lines) {
      const lineWidth = fontBold.widthOfTextAtSize(line, courseFontSize);
      if (lineWidth > maxLineWidth) {
        maxLineWidth = lineWidth;
      }
    }
    
    // Posicionar nave 1cm después del borde derecho del "rectángulo" del título
    const rocketSize = 30; // Tamaño del ícono en puntos
    const rocketX = courseX + maxLineWidth + cmToPts(0.5); // 0.5cm después de la línea más larga
    
    if (lines.length === 1) {
      // Una sola línea: nave alineada con la línea
      const rocketY = courseY;
      
      firstPage.drawImage(rocketIcon, {
        x: rocketX,
        y: rocketY,
        width: rocketSize,
        height: rocketSize,
      });
    } else {
      // Múltiples líneas: nave centrada verticalmente en el medio del interlineado
      const totalHeight = (lines.length - 1) * courseLineHeight;
      const rocketY = courseY - (totalHeight / 2);
      
      firstPage.drawImage(rocketIcon, {
        x: rocketX,
        y: rocketY,
        width: rocketSize,
        height: rocketSize,
      });
    }
    
    // 2. Texto "Desde ITSCHOOL certificamos que [NOMBRE] ha finalizado y aprobado el curso."
    // Posición: x=2cm, y=9.5cm desde arriba
    const textFontSize = 12;
    const xText = cmToPts(2);
    const line1Y = height - cmToPts(9.5);
    
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
    // Posición: x=2cm, y=10.5cm desde arriba
    const line2Y = height - cmToPts(10.5);
    firstPage.drawText("Cumpliendo todos los requisitos exigidos.", {
      x: xText,
      y: line2Y,
      size: textFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    // 4. Nombre del DOCENTE (dos líneas: "Docente" + nombre)
    // "Docente" centrado en x=14.85cm (mitad de 29.7cm), y=16cm desde arriba
    // Nombre del docente centrado igual, y=16.8cm desde arriba
    // Tamaño de letra: 10
    const instructorFontSize = 10;
    
    // Línea 1: "Docente" - centrado en la mitad del certificado
    const docenteText = "Docente";
    const docenteWidth = fontRegular.widthOfTextAtSize(docenteText, instructorFontSize);
    const docenteXCenter = cmToPts(14.85); // Mitad del certificado A4 landscape
    const docenteX = docenteXCenter - (docenteWidth / 2); // Centrar el texto
    const docenteY = height - cmToPts(16);
    
    firstPage.drawText(docenteText, {
      x: docenteX,
      y: docenteY,
      size: instructorFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    // Línea 2: Nombre del docente - centrado igual que "Docente"
    const instructorText = certificateData.instructorName;
    const instructorTextWidth = fontRegular.widthOfTextAtSize(instructorText, instructorFontSize);
    const instructorXCenter = cmToPts(14.85); // Mismo centro que "Docente"
    const instructorX = instructorXCenter - (instructorTextWidth / 2); // Centrar el texto
    const instructorY = height - cmToPts(16.8);
    
    firstPage.drawText(instructorText, {
      x: instructorX,
      y: instructorY,
      size: instructorFontSize,
      font: fontRegular,
      color: blueColor,
    });
    // 5. Insertar QR Code (abajo derecha)
    const qrSize = 70;
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
