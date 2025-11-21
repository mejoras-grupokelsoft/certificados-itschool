'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Página principal para generar certificados por curso
 * URL: /curso/[courseId]
 * 
 * Permite a los estudiantes ingresar su email para solicitar su certificado
 */
export default function CursoPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'validating' | 'generating' | 'success'>('form');
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [validationUrl, setValidationUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor ingrese su email');
      return;
    }

    setError(null);
    setLoading(true);
    setStep('validating');

    try {
      // Paso 1: Validar estudiante
      const validateResponse = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, studentEmail: email }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok) {
        setError(validateData.message || 'Error al validar el estudiante');
        setStep('form');
        setLoading(false);
        return;
      }

      // Paso 2: Generar certificado
      setStep('generating');
      
      const certificateResponse = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          courseId, 
          studentEmail: email,
          studentName: validateData.studentName,
          courseName: validateData.courseName,
          instructorName: validateData.courseConfig?.instructorName,
          score: validateData.score
        }),
      });

      const certificateData = await certificateResponse.json();

      if (!certificateResponse.ok) {
        setError(certificateData.message || 'Error al generar el certificado');
        setStep('form');
        setLoading(false);
        return;
      }

      // Éxito!
      setCertificateUrl(certificateData.certificateUrl);
      setValidationUrl(certificateData.validationUrl);
      setStep('success');
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-5xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              IT SCHOOL
            </h1>
          </Link>
          <p className="text-gray-600 text-lg">
            Sistema de Certificados
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {step === 'form' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                Obtén tu Certificado
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Ingresa el email con el que te registraste en Canvas para generar tu certificado
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email del Estudiante
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-lg"
                    placeholder="tu.email@ejemplo.com"
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Procesando...' : 'Generar Certificado'}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Requisitos para obtener el certificado:</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Estar inscrito en el curso en Canvas
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Haber completado y entregado el examen final
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Tener una calificación igual o superior al puntaje mínimo requerido
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Que el examen haya sido calificado por el instructor
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 'validating' && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Validando información...
              </h2>
              <p className="text-gray-600">
                Estamos verificando tus datos en Canvas
              </p>
            </div>
          )}

          {step === 'generating' && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Generando tu certificado...
              </h2>
              <p className="text-gray-600">
                Estamos creando tu certificado personalizado en PDF
              </p>
            </div>
          )}

          {step === 'success' && certificateUrl && validationUrl && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  ¡Certificado Generado!
                </h2>
                <p className="text-indigo-100">
                  Tu certificado está listo para descargar
                </p>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <p className="text-indigo-900 text-center font-medium mb-4">
                    Tu certificado ha sido generado exitosamente y ya está disponible para descarga
                  </p>
                </div>

                <div className="space-y-4">
                  <a
                    href={certificateUrl}
                    className="block w-full bg-indigo-600 text-white text-center px-6 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors"
                    download
                  >
                    📄 Descargar Certificado PDF
                  </a>

                  <a
                    href={validationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-purple-600 text-white text-center px-6 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors"
                  >
                    ✓ Ver Página de Validación
                  </a>

                  <button
                    onClick={() => {
                      setStep('form');
                      setEmail('');
                      setCertificateUrl(null);
                      setValidationUrl(null);
                    }}
                    className="block w-full bg-gray-200 text-gray-700 text-center px-6 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Generar otro certificado
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Información Importante:</h3>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      El certificado incluye un código QR para validación de autenticidad
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Puedes compartir la URL de validación con empleadores o instituciones
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      El certificado está almacenado permanentemente en nuestro sistema
                    </li>
                  </ul>
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
