import { NextRequest, NextResponse } from 'next/server';
import { markCertificateAsDownloaded, getCertificate } from '@/lib/certificateStorage';

/**
 * API Route: POST /api/certificate/mark-downloaded
 * 
 * Marca un certificado como descargado por primera vez.
 * Esto desbloquea descargas futuras sin necesidad de compartir.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token requerido' },
        { status: 400 }
      );
    }

    // Verificar que el certificado existe
    const certificate = await getCertificate(token);
    if (!certificate) {
      return NextResponse.json(
        { success: false, message: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    // Si ya fue marcado como descargado, no hacer nada
    if (certificate.hasBeenDownloaded) {
      return NextResponse.json({
        success: true,
        message: 'El certificado ya estaba marcado como descargado',
        alreadyDownloaded: true
      });
    }

    // Marcar como descargado
    const updated = await markCertificateAsDownloaded(token);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Error al actualizar el certificado' },
        { status: 500 }
      );
    }

    console.log(`✅ Certificado marcado como descargado: ${token.substring(0, 10)}...`);

    return NextResponse.json({
      success: true,
      message: 'Certificado marcado como descargado',
      firstDownload: true
    });
  } catch (error) {
    console.error('❌ Error en POST /api/certificate/mark-downloaded:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
