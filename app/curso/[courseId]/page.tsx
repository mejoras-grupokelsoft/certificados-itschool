'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ShareCertificateButton from '@/app/components/ShareCertificateButton';

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
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'validating' | 'generating' | 'success'>('form');
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [validationUrl, setValidationUrl] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [courseName, setCourseName] = useState<string>('');
  const [certificateToken, setCertificateToken] = useState<string | null>(null);

  const handleDownloadPdf = async (e?: React.MouseEvent) => {
    // Prevenir navegación del navegador
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!certificateUrl) return;
    
    setDownloadingPdf(true);
    try {
      // Agregar timestamp para evitar caché
      const downloadUrl = `${certificateUrl}?download=true&t=${Date.now()}`;
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Verificar que sea un PDF
      if (!blob.type.includes('pdf')) {
        console.warn('Response is not a PDF:', blob.type);
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificado-${fullName.replace(/\s+/g, '-')}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup después de un pequeño delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback: abrir en nueva pestaña si fetch falla
      window.open(certificateUrl, '_blank');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor ingrese su email');
      return;
    }

    if (!fullName.trim()) {
      setError('Por favor ingrese su nombre y apellido');
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
          studentName: fullName, // Usamos el nombre ingresado por el usuario
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
      setCertificateToken(certificateData.token);
      setCourseName(validateData.courseName);
      setStep('success');
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-center mb-12">
          <Link href="/" className="inline-block">
            <img 
              src="/Logo Original a color.svg" 
              alt="ITSCHOOL Logo" 
              className="h-20 w-auto"
            />
          </Link>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {step === 'form' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-4 text-center" style={{ color: '#1A1A1A' }}>
                Obtené tu Certificado
              </h2>
              <p className="text-center mb-8" style={{ color: '#666666' }}>
                Ingresá tus datos para generar tu certificado
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                    Nombre y Apellido
                    <span className="font-normal text-xs ml-2" style={{ color: '#666666' }}>
                      (Este nombre aparecerá en tu certificado)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-lg"
                    placeholder="Juan Pérez"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                    Email
                    <span className="font-normal text-xs ml-2" style={{ color: '#666666' }}>
                      (Debe ser el mismo email registrado en Canvas)
                    </span>
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
                  className="w-full text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:cursor-not-allowed"
                  style={{ backgroundColor: loading ? '#666666' : '#4285F4' }}
                >
                  {loading ? 'Procesando...' : 'Generar Certificado'}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Requisitos para obtener el certificado:</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: '#5C00D6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Estar inscrito en el curso en Canvas
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: '#5C00D6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Haber completado y entregado el examen final
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: '#5C00D6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Tener una calificación igual o superior al puntaje mínimo requerido
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 'validating' && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-6" style={{ borderColor: '#5C00D6' }}></div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                Validando información...
              </h2>
              <p style={{ color: '#666666' }}>
                Estamos verificando tus datos en Canvas
              </p>
            </div>
          )}

          {step === 'generating' && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-6" style={{ borderColor: '#5C00D6' }}></div>
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
              <div className="p-8 text-center text-white" style={{ background: 'linear-gradient(135deg, #5C00D6 0%, #7B2FE4 100%)' }}>
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
                  {/* Botón de compartir certificado */}
                  {!hasShared && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
                      <p className="text-blue-900 text-center font-bold text-xl mb-2">
                        🎉 ¡Compartí tu logro!
                      </p>
                      <p className="text-blue-700 text-center text-sm mb-4">
                        Compartí tu certificado en redes sociales y mencioná a ITSCHOOL
                      </p>
                      
                      <ShareCertificateButton
                        certificateUrl={certificateUrl}
                        studentName={fullName}
                        courseName={courseName}
                        validationUrl={validationUrl}
                        onShareComplete={() => setHasShared(true)}
                        className="w-full bg-gradient-to-r from-[#4285F4] to-[#393185] text-white"
                      />
                    </div>
                  )}

                  {hasShared && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 mb-4 text-center">
                      <p className="text-green-800 font-bold text-lg">✓ ¡Gracias por compartir tu logro!</p>
                      <p className="text-green-700 text-sm mt-1">Ahora podés descargar tu certificado en PDF</p>
                      {/* Botón para volver a compartir */}
                      <ShareCertificateButton
                        certificateUrl={certificateUrl}
                        studentName={fullName}
                        courseName={courseName}
                        validationUrl={validationUrl}
                        onShareComplete={() => {}}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg text-sm hover:bg-green-50 transition-colors"
                        compact={true}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDownloadPdf(e)}
                    disabled={downloadingPdf || !hasShared}
                    className="block w-full text-white text-center px-6 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative"
                    style={{ backgroundColor: hasShared ? '#5C00D6' : '#9CA3AF' }}
                  >
                    {!hasShared && (
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2">🔒</span>
                    )}
                    {downloadingPdf ? '⏳ Descargando...' : hasShared ? '📄 Descargar Certificado PDF' : '📄 Primero compartí tu logro ☝️'}
                  </button>

                  <a
                    href={validationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-white text-center px-6 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#5C00D6', opacity: 0.85 }}
                  >
                    ✓ Ver Página de Validación
                  </a>

                  <button
                    onClick={() => {
                      setStep('form');
                      setEmail('');
                      setFullName('');
                      setCertificateUrl(null);
                      setValidationUrl(null);
                      setHasShared(false);
                      setCourseName('');
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
        <div className="text-center mt-12" style={{ color: '#666666' }}>
          <p className="text-sm">
            Si querés saber más de nosotros o ver más cursos, consultá nuestra página:{' '}
            <a href="https://www.itschool.com.ar" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#5C00D6' }}>
              www.itschool.com.ar
            </a>
          </p>
          
          {/* Redes sociales */}
          <div className="mt-6">
            <p className="text-sm font-medium mb-3" style={{ color: '#1A1A1A' }}>Seguinos en redes</p>
            <div className="flex justify-center gap-4">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/itlovers"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
                title="Instagram"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              
              {/* WhatsApp Canal */}
              <a
                href="https://whatsapp.com/channel/0029VaYOkLn6LIQznDKSsj2c"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                title="Canal de WhatsApp"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@itlovers"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-black rounded-full flex items-center justify-center transition-transform hover:scale-110"
                title="TikTok"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
