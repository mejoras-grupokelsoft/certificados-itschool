/**
 * Endpoint para generar imagen Open Graph del certificado
 * Esto permite que LinkedIn/Facebook/Twitter muestren una preview del certificado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCertificate } from '@/lib/certificateStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    // Obtener datos del certificado
    const certificate = await getCertificate(token);
    
    if (!certificate) {
      return new NextResponse('Certificate not found', { status: 404 });
    }

    // Generar HTML para la imagen OG
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #4285F4 0%, #393185 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              color: white;
              padding: 60px;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              padding: 60px;
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            .logo {
              font-size: 48px;
              font-weight: bold;
              margin-bottom: 30px;
              color: white;
            }
            .title {
              font-size: 36px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .student {
              font-size: 52px;
              font-weight: bold;
              margin: 30px 0;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .course {
              font-size: 40px;
              margin: 20px 0;
              color: #FFE57F;
            }
            .verified {
              font-size: 28px;
              margin-top: 30px;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🚀 IT SCHOOL</div>
            <div class="title">Certificado Verificado</div>
            <div class="student">${certificate.studentName}</div>
            <div class="course">${certificate.courseName}</div>
            <div class="verified">✓ Certificado Auténtico</div>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new NextResponse('Error generating image', { status: 500 });
  }
}
