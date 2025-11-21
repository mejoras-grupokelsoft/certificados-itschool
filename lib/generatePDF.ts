import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { CertificateData } from './types';

export async function generatePDF(certificateData: CertificateData): Promise<Buffer> {
  const qrCodeDataUrl = await QRCode.toDataURL(certificateData.validationUrl, {
    width: 300,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  const templatePath = join(process.cwd(), 'lib', 'certificateTemplate.html');
  let htmlTemplate = readFileSync(templatePath, 'utf-8');

  htmlTemplate = htmlTemplate
    .replace(/{{COURSE_NAME}}/g, certificateData.courseName)
    .replace(/{{STUDENT_NAME}}/g, certificateData.studentName)
    .replace(/{{INSTRUCTOR_NAME}}/g, certificateData.instructorName)
    .replace(/{{QR_CODE_URL}}/g, qrCodeDataUrl);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}
