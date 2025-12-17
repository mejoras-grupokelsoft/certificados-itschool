import { NextRequest, NextResponse } from 'next/server';
import { saveCertificate, generateCertificateToken, getCertificate } from '@/lib/certificateStorage';
import { saveCertificateToSheet } from '@/lib/sheetsConfig';
import { sendCertificateEmail, isEmailServiceEnabled } from '@/lib/emailService';
import type { CertificateData, CertificateResponse } from '@/lib/types';

/**
 * Detectar la URL base correcta según el entorno
 * Netlify NO provee DEPLOY_URL/CONTEXT para Next.js Functions
 * Solución: extraer el host del header de la request
 */
const getBaseUrl = (request: NextRequest): string => {
  const host = request.headers.get('host');
  
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    console.log('✅ Using BASE_URL from host header:', baseUrl);
    return baseUrl;
  }
  
  // Fallback para desarrollo local
  const fallback = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  console.log('⚠️ No host header found, using fallback:', fallback);
  return fallback;
};

const BUILD_VERSION = 'v5.0-host-header-fix-2025-12-01';
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
    
    // Obtener BASE_URL del host header
    const BASE_URL = getBaseUrl(request);
    
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
          validationUrl: `${BASE_URL}/validar/${token}`,
          existing: true,
          hasBeenDownloaded: existingCertificate.hasBeenDownloaded || false,
          hasAcceptedCommitment: existingCertificate.hasAcceptedCommitment || false,
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

    // Guardar en Google Sheets (nueva hoja "Certificados")
    try {
      await saveCertificateToSheet({
        hash: token,
        studentName,
        studentEmail,
        courseName,
      });
    } catch (sheetError) {
      console.error('⚠️ Error guardando en Sheets (no crítico):', sheetError);
      // No fallar si Sheets falla, el certificado ya está en Redis
    }

    // Enviar email con certificado (async, no bloquea respuesta)
    const certificateUrl = `${BASE_URL}/api/certificate/${token}`;
    if (isEmailServiceEnabled()) {
      // Ejecutar en background sin await para no bloquear
      sendCertificateEmail({
        to: studentEmail,
        studentName,
        courseName,
        certificatePdfUrl: certificateUrl,
        validationUrl: certificateData.validationUrl,
      }).then(sent => {
        if (sent) {
          console.log('📧 Email enviado exitosamente a:', studentEmail);
        }
      }).catch(emailError => {
        console.error('⚠️ Error enviando email (no crítico):', emailError);
      });
    }

    // Retornar URLs
    return NextResponse.json(
      {
        success: true,
        message: 'Certificado generado exitosamente',
        certificateUrl,
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
