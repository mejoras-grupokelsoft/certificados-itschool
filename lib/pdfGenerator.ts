import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { CertificateData } from './types';

const BUILD_ID = `pdfGenerator-${new Date().toISOString()}-${Date.now()}`;
const BUILD_TIMESTAMP = Date.now();

export async function generatePDF(certificateData: CertificateData): Promise<Buffer> {
  try {
    const DEPLOY_VERSION = 'v3.0-logs-2025-11-28';
    console.log(`🚀🚀🚀 [${DEPLOY_VERSION}] [BUILD_ID: ${BUILD_ID}] [TIMESTAMP: ${BUILD_TIMESTAMP}] Iniciando generación de PDF (pdfGenerator)...`);
    console.log('📄 [DETAILS] Certificate data summary:', JSON.stringify({
      token: certificateData.token?.slice(0,10) + '...',
      studentName: certificateData.studentName,
      courseName: certificateData.courseName,
    }));

    // Leer el PDF template
    console.log('📄 [NUEVO] Leyendo certificateTemplateV2.pdf...');
    const templatePath = join(process.cwd(), 'lib', 'certificateTemplateV2.pdf');
    console.log('📄 [NUEVO] Template path:', templatePath);
    const existingPdfBytes = readFileSync(templatePath);
    console.log('📄 Template V2 size:', existingPdfBytes.length, 'bytes');
    
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
    console.log('📄 Generando QR code...');
    const qrOptions = { width: 300, margin: 1, color: { dark: '#4285F4', light: '#FFFFFF' } };
    console.log('📄 QR options:', JSON.stringify(qrOptions));
    const qrCodeDataUrl = await QRCode.toDataURL(certificateData.validationUrl, qrOptions);

    // Convertir QR de data URL a PNG bytes
    const qrBase64 = qrCodeDataUrl.split(',')[1];
    const qrBytes = Buffer.from(qrBase64, 'base64');
    console.log('📄 QR bytes length:', qrBytes.length);
    const qrImage = await pdfDoc.embedPng(qrBytes);
    console.log('✅ QR code generado');
    
    // Cargar ícono de cohete
    console.log('📄 Cargando ícono de cohete...');
    const rocketPath = join(process.cwd(), 'lib', 'rocket-icon.png');
    console.log('📄 Rocket icon path:', rocketPath);
    const rocketBytes = readFileSync(rocketPath);
    console.log('📄 Rocket bytes length:', rocketBytes.length);
    const rocketIcon = await pdfDoc.embedPng(rocketBytes);
    console.log('✅ Ícono de cohete cargado');
    
    // COORDENADAS BASADAS EN DISEÑO - MEDIDAS EN CM (convertidas a puntos)
    // Conversión: 1cm = 28.35 puntos
    // Origen en pdf-lib: esquina inferior izquierda
    // Template real: width x height en puntos
    
    // Color azul corporativo: #4285F4
    const blueColor = rgb(0.259, 0.522, 0.957); // #4285F4
    
    // Función helper para convertir CM a puntos
    const cmToPts = (cm: number) => cm * 28.35;
    
    // 1. TÍTULO DEL CURSO
    // Posición: x=1.07cm, y=9.64cm (desde arriba)
    // Tamaño máximo: ancho 20.78cm
    const courseFontSize = 39;
    const courseText = certificateData.courseName;
    const courseX = cmToPts(1.07);
    const courseY = height - cmToPts(9.64);
    const courseMaxWidth = cmToPts(20.78);
    const courseLineHeight = courseFontSize * 1.2;
    console.log('📐 Course layout metrics:', { courseX, courseY, courseMaxWidth, courseFontSize, courseLineHeight });
    
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
    
    // Posicionar nave dinámicamente
    let maxLineWidth = 0;
    for (const line of lines) {
      const lineWidth = fontBold.widthOfTextAtSize(line, courseFontSize);
      if (lineWidth > maxLineWidth) {
        maxLineWidth = lineWidth;
      }
    }
    
    const rocketSize = 35;
    const rocketX = courseX + maxLineWidth + cmToPts(1);
    console.log('🚀 Calculated rocket position:', { rocketX, maxLineWidth, rocketSize, linesCount: lines.length });

    if (lines.length === 1) {
      const rocketY = courseY;
      console.log('🚀 Rocket will be drawn at single-line Y:', rocketY);
      firstPage.drawImage(rocketIcon, {
        x: rocketX,
        y: rocketY,
        width: rocketSize,
        height: rocketSize,
      });
    } else {
      const totalHeight = (lines.length - 1) * courseLineHeight;
      const rocketY = courseY - (totalHeight / 2);
      console.log('🚀 Rocket will be drawn at multi-line Y:', rocketY, 'totalHeight:', totalHeight);
      firstPage.drawImage(rocketIcon, {
        x: rocketX,
        y: rocketY,
        width: rocketSize,
        height: rocketSize,
      });
    }
    
    // 2. Texto "Desde ITSCHOOL certificamos que [NOMBRE] ha finalizado y aprobado el curso."
    const textFontSize = 14;
    const xText = cmToPts(1.07);
    const line1Y = height - cmToPts(12.5);
    
    const beforeName = "Desde ITSCHOOL certificamos que ";
    const studentName = certificateData.studentName;
    const afterName = " ha finalizado y aprobado el curso.";
    
    firstPage.drawText(beforeName, {
      x: xText,
      y: line1Y,
      size: textFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    const beforeNameWidth = fontRegular.widthOfTextAtSize(beforeName, textFontSize);
    firstPage.drawText(studentName, {
      x: xText + beforeNameWidth,
      y: line1Y,
      size: textFontSize,
      font: fontBold,
      color: blueColor,
    });
    
    const studentNameWidth = fontBold.widthOfTextAtSize(studentName, textFontSize);
    firstPage.drawText(afterName, {
      x: xText + beforeNameWidth + studentNameWidth,
      y: line1Y,
      size: textFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    // 3. Texto "Cumpliendo todos los requisitos exigidos."
    const line2Y = height - cmToPts(13.59);
    firstPage.drawText("Cumpliendo todos los requisitos exigidos.", {
      x: xText,
      y: line2Y,
      size: textFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    // 4. Nombre del DOCENTE (dos líneas: "Docente" + nombre)
    const instructorFontSize = 11;
    
    const docenteText = "Docente";
    const docenteWidth = fontRegular.widthOfTextAtSize(docenteText, instructorFontSize);
    const docenteXCenter = cmToPts(14.06);
    const docenteX = docenteXCenter - (docenteWidth / 2);
    const docenteY = height - cmToPts(18.65);
    
    firstPage.drawText(docenteText, {
      x: docenteX,
      y: docenteY,
      size: instructorFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    const instructorText = certificateData.instructorName;
    const instructorTextWidth = fontRegular.widthOfTextAtSize(instructorText, instructorFontSize);
    const instructorXCenter = cmToPts(14.06);
    const instructorX = instructorXCenter - (instructorTextWidth / 2);
    const instructorY = height - cmToPts(19.25);
    
    firstPage.drawText(instructorText, {
      x: instructorX,
      y: instructorY,
      size: instructorFontSize,
      font: fontRegular,
      color: blueColor,
    });
    
    // 5. Insertar QR Code (abajo derecha)
    const qrSize = 80;
    const qrX = width - qrSize - 80;
    const qrY = 70;
    console.log('📐 QR position:', { qrX, qrY, qrSize });
    firstPage.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
    
    console.log(' Texto y QR agregados al PDF');
    
    // Serializar PDF
    const pdfBytes = await pdfDoc.save();
    console.log(' PDF generado, tamaño:', pdfBytes.length, 'bytes');
    console.log(`🚀🚀🚀 [${DEPLOY_VERSION}] PDF generado para token: ${certificateData.token?.slice(0,10)}...`);

    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error(' Error en generatePDF:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
    throw error;
  }
}
