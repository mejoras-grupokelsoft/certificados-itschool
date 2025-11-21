import { NextRequest, NextResponse } from 'next/server';
import { validateStudentCompletion } from '@/lib/canvasAPI';
import { getCourseConfig } from '@/lib/sheetsConfig';
import { generateCertificateToken, saveCertificate, getCertificate } from '@/lib/certificateStorage';
import { generateCertificatePDF } from '@/lib/generatePDF';
import type { CertificateData, CertificateResponse } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * API Route: POST /api/certificate
 * 
 * Genera un certificado PDF para un estudiante que completó un curso
 * 
 * Body esperado:
 * {
 *   "courseId": "123456",
 *   "studentEmail": "estudiante@example.com"
 * }
 * 
 * Respuesta:
 * {
 *   "success": true,
 *   "message": "Certificado generado exitosamente",
 *   "certificateUrl": "https://certificados.itschool.com.ar/api/certificate/abc123",
 *   "token": "abc123...",
 *   "validationUrl": "https://certificados.itschool.com.ar/validar/abc123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parsear el body
    const body = await request.json();
    const { courseId, studentEmail } = body;

    // Validar parámetros requeridos
    if (!courseId || !studentEmail) {
      return NextResponse.json(
        {
          success: false,
          message: 'Faltan parámetros requeridos: courseId y studentEmail',
        } as CertificateResponse,
        { status: 400 }
      );
    }

    // Obtener configuración del curso
    const courseConfig = await getCourseConfig(courseId);
    
    if (!courseConfig) {
      return NextResponse.json(
        {
          success: false,
          message: 'Curso no encontrado o no habilitado para certificados',
        } as CertificateResponse,
        { status: 404 }
      );
    }

    // Validar que el estudiante completó el curso (passing score fijo: 70)
    const validation = await validateStudentCompletion(
      courseId,
      studentEmail,
      70
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.message,
        } as CertificateResponse,
        { status: 400 }
      );
    }

    // Generar token único para el certificado
    const token = generateCertificateToken();
    const validationUrl = `${BASE_URL}/validar/${token}`;
    const certificateUrl = `${BASE_URL}/api/certificate/${token}`;

    // Preparar datos del certificado
    const certificateData: CertificateData = {
      token,
      studentName: validation.student!.name,
      studentEmail: validation.student!.email,
      courseName: courseConfig.courseName,
      courseId,
      completionDate: validation.submission!.gradedAt!,
      instructorName: courseConfig.instructorName,
      duration: 'Curso completado', // Duration genérico
      score: validation.submission!.score!,
      validationUrl,
      generatedAt: new Date().toISOString(),
    };

    // Guardar datos del certificado en Redis
    await saveCertificate(token, certificateData);

    // Retornar URLs del certificado
    return NextResponse.json(
      {
        success: true,
        message: 'Certificado generado exitosamente',
        certificateUrl,
        token,
        validationUrl,
      } as CertificateResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/certificate:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      } as CertificateResponse,
      { status: 500 }
    );
  }
}

/**
 * API Route: GET /api/certificate/[token]
 * 
 * Descarga el PDF de un certificado existente
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

    // Generar PDF
    const pdfBuffer = await generateCertificatePDF(certificateData);

    // Retornar PDF como descarga
    const filename = `certificado-${certificateData.studentName.replace(/\s+/g, '-')}-${certificateData.courseId}.pdf`;
    
    // Convertir Buffer a Uint8Array para NextResponse
    const uint8 = new Uint8Array(pdfBuffer);
    
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error en GET /api/certificate/[token]:', error);
    
    return NextResponse.json(
      { error: 'Error generando el certificado' },
      { status: 500 }
    );
  }
}
