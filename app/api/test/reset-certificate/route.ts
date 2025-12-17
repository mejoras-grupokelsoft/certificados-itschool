import { NextRequest, NextResponse } from 'next/server';
import { getCertificate, updateCertificate, generateCertificateToken } from '@/lib/certificateStorage';

/**
 * POST /api/test/reset-certificate
 * 
 * SOLO PARA TESTING - Resetea los flags de un certificado para probar el flujo completo
 * 
 * Body: { email: string, courseId: string }
 * 
 * Resetea: hasAcceptedCommitment, hasBeenDownloaded
 */
export async function POST(request: NextRequest) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, message: 'Este endpoint solo está disponible en desarrollo' },
      { status: 403 }
    );
  }

  try {
    const { email, courseId } = await request.json();

    if (!email || !courseId) {
      return NextResponse.json(
        { success: false, message: 'Se requiere email y courseId' },
        { status: 400 }
      );
    }

    // Generar token para buscar el certificado
    const token = generateCertificateToken(email, courseId);
    
    // Verificar que existe
    const certificate = await getCertificate(token);
    if (!certificate) {
      return NextResponse.json(
        { success: false, message: 'Certificado no encontrado', token: token.substring(0, 16) + '...' },
        { status: 404 }
      );
    }

    // Estado anterior
    const previousState = {
      hasAcceptedCommitment: certificate.hasAcceptedCommitment,
      hasBeenDownloaded: certificate.hasBeenDownloaded,
      commitmentAcceptedAt: certificate.commitmentAcceptedAt,
      firstDownloadAt: certificate.firstDownloadAt,
    };

    // Resetear flags
    const success = await updateCertificate(token, {
      hasAcceptedCommitment: false,
      hasBeenDownloaded: false,
      commitmentAcceptedAt: undefined,
      firstDownloadAt: undefined,
    });

    if (success) {
      console.log(`🔄 Certificado reseteado para testing: ${email} - curso ${courseId}`);
      return NextResponse.json({
        success: true,
        message: 'Certificado reseteado para testing',
        token: token.substring(0, 16) + '...',
        previousState,
        newState: {
          hasAcceptedCommitment: false,
          hasBeenDownloaded: false,
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Error al resetear certificado' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error en reset-certificate:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
