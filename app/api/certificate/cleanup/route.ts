import { NextRequest, NextResponse } from 'next/server';
import { listCertificates, deleteCertificate, getCertificate } from '@/lib/certificateStorage';

/**
 * API Route: DELETE /api/certificate/cleanup
 * 
 * Endpoint para limpiar certificados viejos del sistema
 * Útil cuando se actualiza el template del PDF
 * 
 * Query params:
 * - all=true: Borra TODOS los certificados (usar con precaución)
 * - courseId=12112663: Borra solo certificados de un curso específico
 * - email=test@example.com: Borra solo certificados de un email específico
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get('all') === 'true';
    const courseId = searchParams.get('courseId');
    const email = searchParams.get('email');

    console.log('🗑️ Cleanup request:', { deleteAll, courseId, email });

    // Obtener todos los tokens de certificados
    const tokens = await listCertificates(1000);
    console.log(`📊 Found ${tokens.length} certificates in Redis`);

    let deletedCount = 0;
    const errors: string[] = [];

    for (const key of tokens) {
      try {
        // Extraer token de la key "certificate:TOKEN"
        const token = key.replace('certificate:', '');
        
        // Obtener datos del certificado
        const cert = await getCertificate(token);
        
        if (!cert) {
          console.log(`⚠️ Certificate ${token} not found, skipping`);
          continue;
        }

        // Decidir si borrar basado en filtros
        let shouldDelete = false;

        if (deleteAll) {
          shouldDelete = true;
        } else if (courseId && cert.courseId === courseId) {
          shouldDelete = true;
        } else if (email && cert.studentEmail.toLowerCase() === email.toLowerCase()) {
          shouldDelete = true;
        }

        if (shouldDelete) {
          const deleted = await deleteCertificate(token);
          if (deleted) {
            deletedCount++;
            console.log(`✅ Deleted certificate: ${cert.studentName} - ${cert.courseName}`);
          }
        }
      } catch (error) {
        const errorMsg = `Error processing token ${key}: ${error}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completado`,
      deleted: deletedCount,
      total: tokens.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ Error in cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error during cleanup',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Permitir GET para ver info sin borrar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const email = searchParams.get('email');

    const tokens = await listCertificates(1000);
    const certificates = [];

    for (const key of tokens) {
      const token = key.replace('certificate:', '');
      const cert = await getCertificate(token);
      
      if (cert) {
        // Filtrar si hay parámetros
        if (courseId && cert.courseId !== courseId) continue;
        if (email && cert.studentEmail.toLowerCase() !== email.toLowerCase()) continue;
        
        certificates.push({
          token: token.substring(0, 16) + '...',
          student: cert.studentName,
          email: cert.studentEmail,
          course: cert.courseName,
          courseId: cert.courseId,
          date: cert.completionDate,
        });
      }
    }

    return NextResponse.json({
      total: tokens.length,
      filtered: certificates.length,
      certificates,
    });
  } catch (error) {
    console.error('❌ Error listing certificates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
