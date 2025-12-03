/**
 * Endpoint para servir PDFs de certificados de prueba
 * Lee desde C:\Users\Admin\Desktop\test certificados\{courseId}.pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CERTIFICATES_DIR = 'C:\\Users\\Admin\\Desktop\\test certificados';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const params = await context.params;
    const { courseId } = params;
    const pdfPath = join(CERTIFICATES_DIR, `${courseId}.pdf`);

    if (!existsSync(pdfPath)) {
      return NextResponse.json(
        { error: `Certificado no encontrado para curso ${courseId}` },
        { status: 404 }
      );
    }

    const pdfBytes = readFileSync(pdfPath);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certificado-${courseId}.pdf"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Error sirviendo PDF:', error);
    return NextResponse.json(
      {
        error: 'Error leyendo certificado de prueba',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
