import { NextRequest, NextResponse } from 'next/server';
import { saveCertificate, generateCertificateToken, getCertificate } from '@/lib/certificateStorage';
import type { CertificateData, CertificateResponse } from '@/lib/types';

// Detectar la URL base correcta según el entorno
const getBaseUrl = () => {
  // En Netlify, usar DEPLOY_URL (incluye testing--, branch deploys, etc)
  if (process.env.DEPLOY_URL) {
    return process.env.DEPLOY_URL;
  }
  // Fallback a NEXT_PUBLIC_BASE_URL o localhost
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
};

const BASE_URL = getBaseUrl();
const BUILD_VERSION = 'v4.0-force-rebuild-2025-12-01';
const BUILD_ID = `certificate-route-${new Date().toISOString()}-${Date.now()}`;
const BUILD_TIMESTAMP = Date.now();

/**
 * API Route: POST /api/certificate
 * 
 * Genera y guarda un nuevo certificado después de validar al estudiante
 * El token es determinístico: mismo estudiante + curso = mismo token (idempotente)
 */
export async function POST(request: NextRequest) {
  try {
    console.log(`🚀🚀🚀 [${BUILD_VERSION}] [BUILD_ID: ${BUILD_ID}] [TIMESTAMP: ${BUILD_TIMESTAMP}] Certificate creation endpoint called`);
    console.log(`📍 Environment: NODE_ENV=${process.env.NODE_ENV}, CONTEXT=${process.env.CONTEXT}, CWD=${process.cwd()}`);
    const body = await request.json();
    const { 
      studentName, 
      studentEmail, 
      courseName, 
      courseId, 
      instructorName, 
      score 
    } = body;

    console.log('📜 Generando certificado para:', { studentName, studentEmail, courseId });

    // Generar token determinístico basado en email + courseId
    const token = generateCertificateToken(studentEmail, courseId);
    console.log('🔑 Token generado:', token);
    
    // Verificar si ya existe un certificado para este estudiante + curso
    const existingCertificate = await getCertificate(token);
    if (existingCertificate) {
      console.log('✅ Certificado ya existe, reutilizando token:', token);
      return NextResponse.json(
        {
          success: true,
          message: 'Certificado ya generado previamente',
          certificateUrl: `${BASE_URL}/api/certificate/${token}`,
          token,
          validationUrl: existingCertificate.validationUrl,
          existing: true,
        } as CertificateResponse,
        { status: 200 }
      );
    }

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
