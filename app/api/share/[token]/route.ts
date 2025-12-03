/**
 * Endpoint para generar PNG del certificado para compartir en redes sociales
 * TEMPORALMENTE DESHABILITADO: Conflicto con módulos nativos en Netlify/Turbopack
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  // Funcionalidad temporalmente deshabilitada debido a conflictos con módulos nativos (@napi-rs/canvas)
  // en el build de Netlify con Turbopack
  return new NextResponse(
    JSON.stringify({ 
      error: 'Funcionalidad temporalmente no disponible',
      message: 'La generación de PNG para compartir está en desarrollo. Por favor comparte el PDF del certificado.'
    }), 
    { 
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
}
