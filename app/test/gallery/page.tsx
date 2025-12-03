'use client';

import { useEffect, useState } from 'react';

interface CertificateResult {
  courseId: string;
  courseName: string;
  instructorName: string;
  filename: string | null;
  size: number;
  success: boolean;
  error?: string;
}

interface Metadata {
  generatedAt: string;
  totalCourses: number;
  successCount: number;
  errorCount: number;
  testStudent: string;
  results: CertificateResult[];
}

export default function TestGalleryPage() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test/metadata');
      
      if (!response.ok) {
        throw new Error('No se encontraron certificados de prueba. Ejecuta: npm run test:certificates');
      }

      const data = await response.json();
      setMetadata(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (courseId: string, courseName: string) => {
    if (regenerating) return;

    setRegenerating(courseId);

    try {
      const response = await fetch('/api/test/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          studentName: metadata?.testStudent || 'María García Rodríguez',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error regenerando certificado');
      }

      // Descargar PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificado-${courseName}-Test.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert(`✅ Certificado regenerado: ${courseName}`);
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRegenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando certificados de prueba...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 mb-2">Para generar certificados de prueba:</h2>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Abre una terminal en el proyecto</li>
              <li>Ejecuta: <code className="bg-blue-100 px-2 py-1 rounded">npm run test:certificates</code></li>
              <li>Espera a que se generen todos los certificados</li>
              <li>Recarga esta página</li>
            </ol>
          </div>

          <button
            onClick={loadMetadata}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return null;
  }

  const successResults = metadata.results.filter((r) => r.success);
  const errorResults = metadata.results.filter((r) => !r.success);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4285F4] to-[#393185] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">🧪 Galería de Certificados de Prueba</h1>
          <p className="text-blue-100">
            Validación visual de {metadata.totalCourses} certificados generados
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-sm">Total Cursos</div>
            <div className="text-2xl font-bold text-gray-900">{metadata.totalCourses}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-sm">Exitosos</div>
            <div className="text-2xl font-bold text-green-600">{metadata.successCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-sm">Errores</div>
            <div className="text-2xl font-bold text-red-600">{metadata.errorCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-sm">Generado</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date(metadata.generatedAt).toLocaleString('es-AR')}
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-blue-900">
            <span className="font-semibold">👤 Estudiante de prueba:</span> {metadata.testStudent}
          </p>
        </div>

        {/* Success Grid */}
        {successResults.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ✅ Certificados Generados ({successResults.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {successResults.map((cert) => (
                <div
                  key={cert.courseId}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* PDF Preview */}
                  <div className="bg-gray-100 aspect-[1.414] relative">
                    <iframe
                      src={`/api/test/pdf/${cert.courseId}#toolbar=0`}
                      className="w-full h-full"
                      title={`Vista previa: ${cert.courseName}`}
                    />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                      {cert.courseName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      👨‍🏫 {cert.instructorName}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      📄 {(cert.size / 1024).toFixed(2)} KB · ID: {cert.courseId}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <a
                        href={`/api/test/pdf/${cert.courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 transition-colors text-center"
                      >
                        📥 Descargar
                      </a>
                      <button
                        onClick={() => handleRegenerate(cert.courseId, cert.courseName)}
                        disabled={regenerating === cert.courseId}
                        className="flex-1 bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                      >
                        {regenerating === cert.courseId ? '⏳' : '🔄'} Regenerar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Error List */}
        {errorResults.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              ❌ Errores ({errorResults.length})
            </h2>
            <div className="space-y-3">
              {errorResults.map((cert) => (
                <div
                  key={cert.courseId}
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <h3 className="font-bold text-red-900 mb-1">{cert.courseName}</h3>
                  <p className="text-sm text-red-700 mb-2">
                    ID: {cert.courseId} · Instructor: {cert.instructorName}
                  </p>
                  <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded">
                    {cert.error}
                  </p>
                  <button
                    onClick={() => handleRegenerate(cert.courseId, cert.courseName)}
                    disabled={regenerating === cert.courseId}
                    className="mt-3 bg-red-600 text-white text-sm py-2 px-4 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {regenerating === cert.courseId ? '⏳ Regenerando...' : '🔄 Reintentar'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-900 mb-4">🛠️ Acciones</h3>
          <div className="space-y-3">
            <button
              onClick={loadMetadata}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
            >
              🔄 Recargar metadata
            </button>
            <div className="bg-gray-50 border border-gray-200 rounded p-4">
              <p className="text-sm text-gray-700 mb-2">
                Para regenerar todos los certificados desde cero:
              </p>
              <code className="block bg-gray-900 text-green-400 p-3 rounded text-sm font-mono">
                npm run test:certificates
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
