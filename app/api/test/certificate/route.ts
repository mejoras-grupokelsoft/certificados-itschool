/**
 * Endpoint de testing para generar certificados sin validar en Canvas
 * 
 * POST /api/test/certificate
 * Body: { courseId: string, studentName: string }
 * 
 * Respuesta: PDF bytes con header Content-Disposition
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdfGenerator';
import { getCourseConfig } from '@/lib/sheetsConfig';
import type { CertificateData } from '@/lib/types';

// Permitir respuestas grandes (PDFs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, studentName } = body;

    // Validar parámetros
    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json(
        { error: 'courseId requerido' },
        { status: 400 }
      );
    }

    if (!studentName || typeof studentName !== 'string') {
      return NextResponse.json(
        { error: 'studentName requerido' },
        { status: 400 }
      );
    }

    console.log(`🧪 [TEST] Generando certificado de prueba: ${courseId} - ${studentName}`);

    // Obtener configuración del curso
    const courseConfig = await getCourseConfig(courseId);
    if (!courseConfig) {
      return NextResponse.json(
        { error: `Curso ${courseId} no encontrado en configuración` },
        { status: 404 }
      );
    }

    // Crear datos de certificado de prueba
    const certificateData: CertificateData = {
      studentName,
      studentEmail: 'test@example.com',
      courseId,
      courseName: courseConfig.courseName,
      instructorName: courseConfig.instructorName,
      completionDate: new Date().toISOString().split('T')[0],
      duration: 'Curso de prueba',
      score: 95,
      validationUrl: 'https://certificados.itschool.com.ar/validar/test-token',
      token: `test-${courseId}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      institution: courseConfig.courseName.endsWith('- SEC') ? 'SEC' : 'ITSCHOOL',
    };

    // Generar PDF
    const pdfBytes = await generatePDF(certificateData);

    console.log(`✅ [TEST] Certificado generado: ${(pdfBytes.length / 1024).toFixed(2)} KB`);

    // Normalizar nombre de archivo
    const normalizeFilename = (text: string): string => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Solo alfanuméricos, espacios y guiones
        .replace(/\s+/g, '-') // Espacios a guiones
        .substring(0, 50); // Máximo 50 caracteres
    };

    const normalizedCourseName = normalizeFilename(courseConfig.courseName);
    const normalizedStudentName = normalizeFilename(studentName);
    const filename = `Certificado-${normalizedCourseName}-${normalizedStudentName}.pdf`;

    // Retornar PDF (convertir Buffer a Uint8Array)
    const uint8 = new Uint8Array(pdfBytes);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ [TEST] Error generando certificado:', error);

    return NextResponse.json(
      {
        error: 'Error generando certificado de prueba',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
