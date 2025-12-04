'use client';

import { useState } from 'react';
import ShareFallbackModal from './ShareFallbackModal';

interface ShareCertificateButtonProps {
  certificateUrl: string;
  studentName: string;
  courseName: string;
  validationUrl: string;
  onShareComplete?: () => void;
  className?: string;
  compact?: boolean; // Modo compacto para botón pequeño
}

export default function ShareCertificateButton({
  certificateUrl,
  studentName,
  courseName,
  validationUrl,
  onShareComplete,
  className = '',
  compact = false,
}: ShareCertificateButtonProps) {
  const [sharing, setSharing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleShare = async () => {
    // Mostrar siempre el modal personalizado con opciones de redes sociales
    // El Web Share API nativo de Windows/navegadores no incluye redes sociales
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    onShareComplete?.();
  };

  // Versión compacta del botón
  if (compact) {
    return (
      <>
        <button
          onClick={handleShare}
          disabled={sharing}
          className={`flex items-center gap-2 ${className}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Volver a compartir</span>
        </button>

        <ShareFallbackModal
          isOpen={showModal}
          onClose={handleModalClose}
          certificateUrl={certificateUrl}
          studentName={studentName}
          courseName={courseName}
          validationUrl={validationUrl}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={sharing}
        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {sharing ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Preparando...</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Compartir certificado</span>
          </>
        )}
      </button>

      <ShareFallbackModal
        isOpen={showModal}
        onClose={handleModalClose}
        certificateUrl={certificateUrl}
        studentName={studentName}
        courseName={courseName}
        validationUrl={validationUrl}
      />
    </>
  );
}
