'use client';

import { useState } from 'react';

interface EmbeddableBadgeProps {
  studentName: string;
  courseName: string;
  validationUrl: string;
  token: string;
  generatedAt: string;
}

/**
 * Componente que muestra un badge embebible del certificado
 * Incluye código HTML/iframe que el usuario puede copiar para su portfolio
 */
export default function EmbeddableBadge({
  studentName,
  courseName,
  validationUrl,
  token,
  generatedAt,
}: EmbeddableBadgeProps) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const badgeId = token.substring(0, 16).toUpperCase();
  const issueDate = new Date(generatedAt).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });

  // Código HTML del badge para embeber
  const embedCode = `<!-- IT School Certificate Badge -->
<a href="${validationUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
  <div style="display: inline-flex; align-items: center; gap: 12px; padding: 16px 20px; background: linear-gradient(135deg, #4285F4 0%, #393185 100%); border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);">
    <div style="display: flex; flex-direction: column;">
      <span style="color: rgba(255,255,255,0.8); font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Certificado IT School</span>
      <span style="color: white; font-size: 16px; font-weight: 600; margin-top: 4px;">${courseName}</span>
      <span style="color: rgba(255,255,255,0.9); font-size: 12px; margin-top: 2px;">${studentName} • ${issueDate}</span>
    </div>
    <div style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 8px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
  </div>
</a>`;

  // Código alternativo más simple (solo imagen + link)
  const simpleEmbedCode = `<a href="${validationUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${validationUrl.replace('/validar/', '/api/badge/')}" alt="Certificado ${courseName} - ITSCHOOL" style="max-width: 300px;">
</a>`;

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando código:', error);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#4285F4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        Badge para tu Portfolio
      </h3>
      
      {/* Preview del Badge */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Agregá este badge verificable a tu sitio web o portfolio:
        </p>
        
        {/* Badge Preview */}
        <a 
          href={validationUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#4285F4] to-[#393185] rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex flex-col">
            <span className="text-white/80 text-xs uppercase tracking-wider">
              Certificado ITSCHOOL
            </span>
            <span className="text-white font-semibold text-base mt-1">
              {courseName}
            </span>
            <span className="text-white/90 text-sm mt-0.5">
              {studentName} • {issueDate}
            </span>
          </div>
          <div className="bg-white/20 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </a>
      </div>

      {/* Toggle para mostrar código */}
      <button
        onClick={() => setShowCode(!showCode)}
        className="text-[#4285F4] hover:text-[#393185] text-sm font-medium flex items-center gap-2 mb-3"
      >
        <svg 
          className={`w-4 h-4 transition-transform ${showCode ? 'rotate-90' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {showCode ? 'Ocultar código HTML' : 'Ver código HTML para embeber'}
      </button>

      {/* Código para copiar */}
      {showCode && (
        <div className="space-y-4">
          {/* Código completo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Código HTML completo</label>
              <button
                onClick={() => handleCopy(embedCode)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  copied 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {copied ? '✓ Copiado' : 'Copiar código'}
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all">
                <code>{embedCode}</code>
              </pre>
            </div>
          </div>

          {/* Info adicional */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm">
            <p className="text-blue-800">
              <strong>💡 Tip:</strong> Pegá este código en tu portfolio, blog o página personal. 
              El badge incluye un link de verificación para que cualquiera pueda confirmar la autenticidad de tu certificado.
            </p>
          </div>
        </div>
      )}

      {/* Código de verificación */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          ID de certificación: <code className="bg-gray-200 px-2 py-0.5 rounded font-mono">{badgeId}</code>
        </p>
      </div>
    </div>
  );
}
