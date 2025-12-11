import { NextRequest, NextResponse } from 'next/server';
import { getCertificate } from '@/lib/certificateStorage';
import { sendCertificateEmail } from '@/lib/emailService';

/**
 * API Route: POST /api/certificate/resend
 * 
 * Reenvía el email del certificado para certificados existentes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token requerido' },
        { status: 400 }
      );
    }

    console.log('📧 Solicitud de reenvío de certificado para token:', token);

    // Obtener el certificado existente
    const certificate = await getCertificate(token);
    
    if (!certificate) {
      return NextResponse.json(
        { success: false, message: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    // Obtener BASE_URL del host header
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const BASE_URL = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const certificateUrl = `${BASE_URL}/api/certificate/${token}`;
    const validationUrl = `${BASE_URL}/validar/${token}`;

    // Enviar el email (la función descarga el PDF internamente)
    console.log('📧 Reenviando email a:', certificate.studentEmail);
    const emailSent = await sendCertificateEmail({
      to: certificate.studentEmail,
      studentName: certificate.studentName,
      courseName: certificate.courseName,
      certificatePdfUrl: certificateUrl,
      validationUrl: validationUrl,
    });

    if (emailSent) {
      console.log('✅ Email reenviado exitosamente');
      return NextResponse.json({
        success: true,
        message: 'Certificado reenviado exitosamente',
      });
    } else {
      console.error('❌ Error al reenviar email');
      return NextResponse.json(
        { success: false, message: 'Error al enviar el email. Intente nuevamente.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error en reenvío de certificado:', error);
    return NextResponse.json(
      { success: false, message: 'Error al reenviar el certificado' },
      { status: 500 }
    );
  }
}
