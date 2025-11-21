import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { CertificadoPDF } from './CertificadoPDF';
import type { CertificateData } from './types';

/**
 * Genera el PDF del certificado
 */
export async function generateCertificatePDF(
  certificateData: CertificateData
): Promise<Buffer> {
  // Generar QR code como Data URL
  const qrCodeDataUrl = await QRCode.toDataURL(certificateData.validationUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // Generar PDF usando React PDF
  const pdfBuffer = await renderToBuffer(
    <CertificadoPDF data={certificateData} qrCodeDataUrl={qrCodeDataUrl} />
  );

  return pdfBuffer;
}
