'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface CertificateInfo {
  studentName: string;
  studentEmail: string;
  courseName: string;
  completionDate: string;
  instructorName: string;
  duration: string;
  score: number;
  generatedAt: string;
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-indigo-600 mb-4">
            IT SCHOOL
          </h1>
          <p className="text-gray-600 text-lg">
            Validación de Certificado
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto">
          {loading && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
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
                  className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          )}

          {certificateInfo && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  ✓ Certificado Válido
                </h2>
                <p className="text-indigo-100">
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
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
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

                {/* Actions */}
                <div className="flex gap-4 mt-8">
                  <a
                    href={`/api/certificate/${token}`}
                    className="flex-1 bg-indigo-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
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
            <a href="https://www.itschool.com.ar" className="text-indigo-600 hover:underline">
              www.itschool.com.ar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
