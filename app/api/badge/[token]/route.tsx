/**
 * Endpoint para generar una imagen de badge del certificado
 * Útil para embeber en portfolios como imagen verificable
 * 
 * URL: /api/badge/[token]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCertificate } from '@/lib/certificateStorage';
import { ImageResponse } from 'next/og';

// Usar Node.js runtime para evitar problemas con crypto en Edge
export const runtime = 'nodejs';

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

    const issueDate = new Date(certificate.generatedAt).toLocaleDateString('es-AR', {
      month: 'short',
      year: 'numeric',
    });

    // Generar imagen badge usando next/og
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #4285F4 0%, #393185 100%)',
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px 32px',
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Contenido del badge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* IT School Logo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '20px' }}>🚀</span>
                <span
                  style={{
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                  }}
                >
                  IT SCHOOL
                </span>
              </div>

              {/* Nombre del curso */}
              <span
                style={{
                  color: 'white',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  maxWidth: '280px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {certificate.courseName}
              </span>

              {/* Estudiante y fecha */}
              <span
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  marginTop: '6px',
                }}
              >
                {certificate.studentName} • {issueDate}
              </span>
            </div>

            {/* Ícono de verificación */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '12px',
                borderRadius: '12px',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
          </div>
        </div>
      ),
      {
        width: 450,
        height: 140,
      }
    );
  } catch (error) {
    console.error('Error generating badge image:', error);
    return new NextResponse('Error generating badge', { status: 500 });
  }
}
