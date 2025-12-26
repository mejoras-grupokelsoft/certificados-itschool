'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LinkedInAddButton from '@/app/components/LinkedInAddButton';
import EmbeddableBadge from '@/app/components/EmbeddableBadge';

interface CertificateInfo {
  studentName: string;
  studentEmail: string;
  courseName: string;
  completionDate: string;
  instructorName: string;
  duration: string;
  score: number;
  generatedAt: string;
  institution?: 'ITSCHOOL' | 'SEC';
}

/**
 * Página de validación pública de certificados
 * URL: /validar/[token]
 * 
 * Permite a cualquier persona verificar la autenticidad de un certificado
 * escaneando el QR code o ingresando manualmente la URL
 */
export default function ValidarCertificadoPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateInfo, setCertificateInfo] = useState<CertificateInfo | null>(null);

  // Cargar información del certificado al montar el componente
  useState(() => {
    const fetchCertificateInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/certificate/validate/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Certificado no encontrado. El código QR puede ser inválido o el certificado fue revocado.');
          } else {
            setError('Error al validar el certificado. Intente nuevamente más tarde.');
          }
          return;
        }

        const data = await response.json();
        setCertificateInfo(data);
      } catch (err) {
        setError('Error de conexión. Verifique su conexión a internet.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificateInfo();
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            {certificateInfo?.institution === 'SEC' ? (
              <img 
                src="/sec-logo.svg" 
                alt="SEC Logo" 
                className="h-20 w-auto"
              />
            ) : (
              <img 
                src="/Logo Original a color.svg" 
                alt="IT SCHOOL Logo" 
                className="h-20 w-auto"
              />
            )}
          </div>
          <p className="text-gray-600 text-lg">
            Validación de Certificado
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto">
          {loading && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#4285F4] mx-auto mb-6"></div>
              <p className="text-gray-600 text-lg">Validando certificado...</p>
            </div>
          )}

          {error && (
            <div className="bg-white rounded-2xl shadow-xl p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-red-600 mb-4">
                  Certificado No Válido
                </h2>
                <p className="text-gray-600 text-lg">{error}</p>
              </div>
              <div className="text-center">
                <Link
                  href="/"
                  className="inline-block bg-[#4285F4] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#393185] transition-colors"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          )}

          {certificateInfo && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-[#4285F4] to-[#393185] p-8 text-center text-white">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  ✓ Certificado Válido
                </h2>
                <p className="text-blue-100">
                  Este certificado ha sido verificado y es auténtico
                </p>
              </div>

              {/* Certificate Details */}
              <div className="p-8">
                <div className="space-y-6">
                  {/* Estudiante */}
                  <div className="border-b border-gray-200 pb-6">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Estudiante
                    </label>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {certificateInfo.studentName}
                    </p>
                    <p className="text-gray-600 mt-1">{certificateInfo.studentEmail}</p>
                  </div>

                  {/* Curso */}
                  <div className="border-b border-gray-200 pb-6">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Curso Completado
                    </label>
                    <p className="text-2xl font-bold text-[#4285F4] mt-2">
                      {certificateInfo.courseName}
                    </p>
                  </div>

                  {/* Detalles en Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Duración
                      </label>
                      <p className="text-lg text-gray-900 mt-2">{certificateInfo.duration}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Calificación Final
                      </label>
                      <p className="text-lg text-gray-900 mt-2 font-bold">{certificateInfo.score} puntos</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Fecha de Finalización
                      </label>
                      <p className="text-lg text-gray-900 mt-2">{formatDate(certificateInfo.completionDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Instructor
                      </label>
                      <p className="text-lg text-gray-900 mt-2">{certificateInfo.instructorName}</p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="bg-gray-50 rounded-lg p-4 mt-6">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Certificado emitido el:</span>{' '}
                      {formatDate(certificateInfo.generatedAt)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Código de verificación:</span>{' '}
                      <code className="bg-white px-2 py-1 rounded font-mono text-xs">
                        {token.substring(0, 16).toUpperCase()}
                      </code>
                    </p>
                  </div>
                </div>

                {/* LinkedIn Integration */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    Agregá esta certificación a LinkedIn
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Mostrá tu logro profesional agregando esta certificación directamente a tu perfil de LinkedIn.
                  </p>
                  <LinkedInAddButton
                    courseName={certificateInfo.courseName}
                    studentName={certificateInfo.studentName}
                    validationUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/validar/${token}`}
                    token={token}
                    generatedAt={certificateInfo.generatedAt}
                  />
                </div>

                {/* Badge Embebible */}
                <div className="mt-8">
                  <EmbeddableBadge
                    studentName={certificateInfo.studentName}
                    courseName={certificateInfo.courseName}
                    validationUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/validar/${token}`}
                    token={token}
                    generatedAt={certificateInfo.generatedAt}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-8">
                  <a
                    href={`/api/certificate/${token}`}
                    className="flex-1 bg-[#4285F4] text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-[#393185] transition-colors"
                    download
                  >
                    Descargar Certificado PDF
                  </a>
                  <Link
                    href="/"
                    className="flex-1 bg-gray-200 text-gray-700 text-center px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Volver al Inicio
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            © {new Date().getFullYear()} IT School - Instituto de Tecnología y Desarrollo de Software
          </p>
          <p className="text-sm mt-2">
            <a href="https://www.itschool.com.ar" className="text-[#4285F4] hover:underline">
              www.itschool.com.ar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
