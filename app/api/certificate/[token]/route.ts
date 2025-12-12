import { NextRequest, NextResponse } from 'next/server';
import { getCertificate } from '@/lib/certificateStorage';
import { generatePDF } from '@/lib/pdfGenerator';

const DEPLOY_VERSION = 'v3.0-logs-2025-11-28';

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

    console.log(`🚀 [${DEPLOY_VERSION}] 📄 Generando PDF para:`, {
      student: certificateData.studentName,
      course: certificateData.courseName,
      token: token.substring(0, 10) + '...'
    });

    // Generar PDF
    console.log(`🚀 [${DEPLOY_VERSION}] Llamando a generatePDF()`);
    const pdfBuffer = await generatePDF(certificateData);
    console.log(`✅ [${DEPLOY_VERSION}] PDF generado exitosamente, tamaño:`, pdfBuffer.length, 'bytes');

    // Normalizar nombre del estudiante
    const studentNameSafe = (certificateData.studentName || 'estudiante')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-zA-Z0-9]/g, '-')   // Solo alfanuméricos y guiones
      .replace(/-+/g, '-')             // Múltiples guiones a uno solo
      .replace(/^-|-$/g, '');          // Quitar guiones al inicio/fin
    
    // Normalizar nombre del curso
    const courseNameSafe = (certificateData.courseName || 'Curso')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50); // Limitar longitud
    
    const filename = `Certificado-${courseNameSafe}-${studentNameSafe}.pdf`;
    
    console.log('📥 Enviando PDF con nombre:', filename);
    
    // Convertir Buffer a Uint8Array para NextResponse
    const uint8 = new Uint8Array(pdfBuffer);
    
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('❌ Error en GET /api/certificate/[token]:', error);
    console.error('Error completo:', JSON.stringify(error, null, 2));
    
    return NextResponse.json(
      { 
        error: 'Error generando el certificado',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
