/**
 * Endpoint para generar PNG del certificado para compartir en redes sociales
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCertificate } from '@/lib/certificateStorage';
import { generateSharePNG } from '@/lib/generateCertificateAssets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    // Obtener datos del certificado
    const certificate = await getCertificate(token);
    
    if (!certificate) {
      return new NextResponse('Certificado no encontrado', { status: 404 });
    }

    console.log('📸 Generando PNG para compartir:', certificate.studentName);

    // Generar PNG optimizado para redes sociales
    const pngBuffer = await generateSharePNG(certificate);

    console.log('✅ PNG generado:', pngBuffer.length, 'bytes');

    // Normalizar nombre para el archivo
    const normalizeFilename = (text: string): string => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    };

    const filename = `Certificado-${normalizeFilename(certificate.studentName)}-ITSchool.png`;

    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': pngBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('❌ Error generando PNG para compartir:', error);
    return new NextResponse('Error generando imagen', { status: 500 });
  }
}
