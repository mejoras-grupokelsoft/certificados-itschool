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
  const [sharing, setSharing] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

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

  // Compartir usando Web Share API (funciona en móviles y algunos navegadores de escritorio)
  const handleNativeShare = async () => {
    if (!certificateUrl || !validationUrl) return;
    
    setSharing(true);
    try {
      const shareText = `¡Completé exitosamente el curso de ${courseName} en ITSCHOOL - Educación IT! 🚀🎓\n\nValidá mi certificado: ${validationUrl}`;
      
      // Intentar compartir con archivo PDF
      const response = await fetch(certificateUrl);
      const blob = await response.blob();
      const file = new File([blob], `Certificado-${courseName.replace(/\s+/g, '-')}-ITSCHOOL.pdf`, { type: 'application/pdf' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Certificado de ${courseName} - ITSCHOOL`,
          text: shareText,
        });
        setHasShared(true);
        setShowShareOptions(false);
      } else if (navigator.share) {
        // Compartir solo texto/URL si no soporta archivos
        await navigator.share({
          title: `Certificado de ${courseName} - ITSCHOOL`,
          text: shareText,
          url: validationUrl,
        });
        setHasShared(true);
        setShowShareOptions(false);
      } else {
        // Fallback: mostrar opciones de redes sociales
        setShowShareOptions(true);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.log('Web Share API no disponible, mostrando opciones manuales');
        setShowShareOptions(true);
      }
    } finally {
      setSharing(false);
    }
  };

  // Compartir en LinkedIn
  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(`¡Completé exitosamente el curso de ${courseName} en ITSCHOOL - Educación IT! 🚀🎓\n\nValidá mi certificado:`);
    const url = encodeURIComponent(validationUrl || '');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=600');
    setHasShared(true);
  };

  // Compartir en X (Twitter)
  const handleShareX = () => {
    const text = encodeURIComponent(`¡Completé el curso de ${courseName} en @itlovers 🚀🎓\n\nValidá mi certificado: ${validationUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400');
    setHasShared(true);
  };

  // Compartir en WhatsApp
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`¡Completé exitosamente el curso de *${courseName}* en *ITSCHOOL - Educación IT*! 🚀🎓\n\nValidá mi certificado: ${validationUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setHasShared(true);
  };

  // Copiar link al portapapeles
  const handleCopyLink = async () => {
    if (!validationUrl) return;
    try {
      await navigator.clipboard.writeText(validationUrl);
      alert('¡Link copiado al portapapeles!');
      setHasShared(true);
    } catch (err) {
      console.error('Error copiando al portapapeles:', err);
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
                  {/* Botón de compartir - Debe ser clickeado primero */}
                  {!hasShared && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
                      <p className="text-blue-900 text-center font-bold text-xl mb-2">
                        🎉 ¡Compartí tu logro!
                      </p>
                      <p className="text-blue-700 text-center text-sm mb-4">
                        Compartí tu certificado en redes sociales y mencioná a ITSCHOOL
                      </p>
                      
                      {!showShareOptions ? (
                        <button
                          type="button"
                          onClick={handleNativeShare}
                          disabled={sharing}
                          className="block w-full bg-gradient-to-r from-[#4285F4] to-[#393185] text-white text-center px-6 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          {sharing ? '⏳ Preparando...' : '📤 Compartir certificado'}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-gray-600 text-center text-sm mb-3">Elegí dónde compartir:</p>
                          
                          {/* LinkedIn - Destacado */}
                          <button
                            type="button"
                            onClick={handleShareLinkedIn}
                            className="block w-full bg-[#0A66C2] hover:bg-[#004182] text-white text-center px-6 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            Compartir en LinkedIn
                          </button>

                          {/* X (Twitter) */}
                          <button
                            type="button"
                            onClick={handleShareX}
                            className="block w-full bg-black hover:bg-gray-800 text-white text-center px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            Compartir en X
                          </button>

                          {/* WhatsApp */}
                          <button
                            type="button"
                            onClick={handleShareWhatsApp}
                            className="block w-full bg-[#25D366] hover:bg-[#128C7E] text-white text-center px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Compartir en WhatsApp
                          </button>

                          {/* Copiar link */}
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="block w-full bg-gray-600 hover:bg-gray-700 text-white text-center px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copiar link de validación
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {hasShared && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 mb-4 text-center">
                      <p className="text-green-800 font-bold text-lg">✓ ¡Gracias por compartir tu logro!</p>
                      <p className="text-green-700 text-sm mt-1">Ahora podés descargar tu certificado en PDF</p>
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
                      setShowShareOptions(false);
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
        </div>
      </div>
    </div>
  );
}
