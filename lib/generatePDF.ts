import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import QRCode from 'qrcode';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { CertificateData } from './types';

export async function generatePDF(certificateData: CertificateData): Promise<Buffer> {
  try {
    console.log(' Iniciando generación de PDF...');
    
    // Generar QR Code
    console.log(' Generando QR code...');
    const qrCodeDataUrl = await QRCode.toDataURL(certificateData.validationUrl, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
    console.log(' QR code generado');

    // Leer template HTML
    console.log(' Leyendo template HTML...');
    const templatePath = join(process.cwd(), 'lib', 'certificateTemplate.html');
    let htmlTemplate = readFileSync(templatePath, 'utf-8');
    console.log(' Template leído');

    // Reemplazar variables
    htmlTemplate = htmlTemplate
      .replace(/{{COURSE_NAME}}/g, certificateData.courseName)
      .replace(/{{STUDENT_NAME}}/g, certificateData.studentName)
      .replace(/{{INSTRUCTOR_NAME}}/g, certificateData.instructorName)
      .replace(/{{QR_CODE_URL}}/g, qrCodeDataUrl);

    // Verificar si estamos en Netlify
    const isNetlify = process.env.NETLIFY === 'true';
    console.log(' Entorno:', isNetlify ? 'Netlify (serverless)' : 'Local');

    // Configurar Puppeteer
    console.log(' Lanzando navegador...');
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: null,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    console.log(' Navegador lanzado');

    const page = await browser.newPage();
    console.log(' Cargando contenido HTML...');
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
    console.log(' Contenido cargado');

    console.log(' Generando PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log(' PDF generado, tamaño:', pdfBuffer.length, 'bytes');

    await browser.close();
    console.log(' Navegador cerrado');
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error(' Error en generatePDF:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
    throw error;
  }
}
