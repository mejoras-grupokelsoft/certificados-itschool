import { NextRequest, NextResponse } from 'next/server';
import { saveCertificate } from '@/lib/certificateStorage';
import type { CertificateData, CertificateResponse } from '@/lib/types';
import crypto from 'crypto';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * API Route: POST /api/certificate
 * 
 * Genera y guarda un nuevo certificado después de validar al estudiante
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      studentName, 
      studentEmail, 
      courseName, 
      courseId, 
      instructorName, 
      score 
    } = body;

    console.log('📜 Generando certificado para:', { studentName, courseId });

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');

    // Crear datos del certificado
    const certificateData: CertificateData = {
      token,
      studentName,
      studentEmail,
      courseName,
      courseId,
      completionDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      instructorName,
      duration: 'Curso completado', // Genérico
      score,
      validationUrl: `${BASE_URL}/validar/${token}`,
      generatedAt: new Date().toISOString(),
    };

    // Guardar en Upstash Redis
    await saveCertificate(token, certificateData);

    console.log('✅ Certificado guardado con token:', token);

    // Retornar URLs
    return NextResponse.json(
      {
        success: true,
        message: 'Certificado generado exitosamente',
        certificateUrl: `${BASE_URL}/api/certificate/${token}`,
        token,
        validationUrl: certificateData.validationUrl,
      } as CertificateResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generando certificado:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al generar el certificado',
      } as CertificateResponse,
      { status: 500 }
    );
  }
}

// Permitir solo POST
export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST.' },
    { status: 405 }
  );
}
