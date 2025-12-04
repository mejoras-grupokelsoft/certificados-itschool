/**
 * Endpoint para generar imagen Open Graph del certificado
 * Esto permite que LinkedIn/Facebook/Twitter muestren una preview del certificado
 * 
 * Genera un SVG que se convierte a PNG mediante una librería
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCertificate } from '@/lib/certificateStorage';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    
    // Obtener datos del certificado
    const certificate = await getCertificate(token);
    
    if (!certificate) {
      return new NextResponse('Certificate not found', { status: 404 });
    }

    // Generar imagen OG usando next/og
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #4285F4 0%, #393185 100%)',
            fontFamily: 'Arial, sans-serif',
            padding: '60px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '50px 80px',
              borderRadius: '24px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Logo */}
            <div
              style={{
                fontSize: '42px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span>🚀</span>
              <span>IT SCHOOL</span>
            </div>

            {/* Certificado Verificado */}
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '30px',
              }}
            >
              CERTIFICADO VERIFICADO
            </div>

            {/* Nombre del estudiante */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {certificate.studentName}
            </div>

            {/* Curso */}
            <div
              style={{
                fontSize: '32px',
                color: '#FFE57F',
                marginBottom: '30px',
                maxWidth: '900px',
              }}
            >
              {certificate.courseName}
            </div>

            {/* Check de verificación */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '24px',
                color: '#34A853',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '10px 24px',
                borderRadius: '50px',
              }}
            >
              <span>✓</span>
              <span style={{ color: '#333' }}>Certificado Auténtico</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new NextResponse('Error generating image', { status: 500 });
  }
}
