import { NextRequest, NextResponse } from 'next/server';
import { getCertificate } from '@/lib/certificateStorage';

/**
 * API Route: GET /api/certificate/validate/[token]
 * 
 * Valida un certificado y retorna su información (sin generar PDF)
 * Usado por la página de validación pública
 */
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const params = await context.params;
    const { token } = params;

    // Recuperar datos del certificado
    const certificateData = await getCertificate(token);

    if (!certificateData) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    // Retornar información del certificado (sin datos sensibles extras)
    return NextResponse.json(
      {
        studentName: certificateData.studentName,
        studentEmail: certificateData.studentEmail,
        courseName: certificateData.courseName,
        completionDate: certificateData.completionDate,
        instructorName: certificateData.instructorName,
        duration: certificateData.duration,
        score: certificateData.score,
        generatedAt: certificateData.generatedAt,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        },
      }
    );
  } catch (error) {
    console.error('Error validando certificado:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
