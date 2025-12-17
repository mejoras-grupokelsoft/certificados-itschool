import { NextRequest, NextResponse } from 'next/server';
import { markCommitmentAccepted, getCertificate } from '@/lib/certificateStorage';

/**
 * POST /api/certificate/accept-commitment
 * Marca que el estudiante aceptó la carta de compromiso de ITSCHOOL
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

    // Marcar como aceptado
    const success = await markCommitmentAccepted(token);

    if (success) {
      console.log(`✅ Carta de compromiso aceptada para certificado: ${token.substring(0, 16)}...`);
      return NextResponse.json({
        success: true,
        message: 'Carta de compromiso aceptada exitosamente',
        commitmentAcceptedAt: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Error al registrar aceptación' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error en accept-commitment:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
