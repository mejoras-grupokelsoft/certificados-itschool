/**
 * Endpoint para servir metadata de certificados de prueba
 * Lee desde C:\Users\Admin\Desktop\test certificados\index.json
 */

import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';

const METADATA_PATH = 'C:\\Users\\Admin\\Desktop\\test certificados\\index.json';

export async function GET() {
  try {
    if (!existsSync(METADATA_PATH)) {
      return NextResponse.json(
        { error: 'No se encontraron certificados de prueba. Ejecuta: npm run test:certificates' },
        { status: 404 }
      );
    }

    const metadataContent = readFileSync(METADATA_PATH, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    return NextResponse.json(metadata, { status: 200 });
  } catch (error) {
    console.error('❌ Error leyendo metadata:', error);
    return NextResponse.json(
      {
        error: 'Error leyendo metadata de certificados de prueba',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
