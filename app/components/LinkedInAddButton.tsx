'use client';

import { useState } from 'react';
import { getLinkedInAddCertificationLink, buildLinkedInCertificationOptions } from '@/lib/shareCertificateService';

interface LinkedInAddButtonProps {
  courseName: string;
  studentName: string;
  validationUrl: string;
  token: string;
  generatedAt: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'compact';
}

/**
 * Botón para agregar certificación directamente al perfil de LinkedIn
 * Abre LinkedIn con los campos de certificación pre-llenados
 */
export default function LinkedInAddButton({
  courseName,
  studentName,
  validationUrl,
  token,
  generatedAt,
  className = '',
  variant = 'primary',
}: LinkedInAddButtonProps) {
  const [clicked, setClicked] = useState(false);

  const handleAddToLinkedIn = () => {
    const options = buildLinkedInCertificationOptions(
      {
        certificateUrl: '', // No se usa para agregar al perfil
        studentName,
        courseName,
        validationUrl,
      },
      generatedAt,
      token
    );

    const linkedInUrl = getLinkedInAddCertificationLink(options);
    window.open(linkedInUrl, '_blank', 'width=600,height=700');
    setClicked(true);
  };

  // Variante compacta (solo ícono + texto corto)
  if (variant === 'compact') {
    return (
      <button
        onClick={handleAddToLinkedIn}
        className={`flex items-center gap-2 text-[#0A66C2] hover:text-[#004182] font-medium transition-colors ${className}`}
        title="Agregar certificación a tu perfil de LinkedIn"
      >
        <LinkedInIcon className="w-5 h-5" />
        <span className="text-sm">Agregar a LinkedIn</span>
        {clicked && (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    );
  }

  // Variante secundaria (botón outline)
  if (variant === 'secondary') {
    return (
      <button
        onClick={handleAddToLinkedIn}
        className={`flex items-center justify-center gap-3 px-5 py-3 rounded-lg font-semibold 
          border-2 border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white 
          transition-all ${className}`}
      >
        <LinkedInIcon className="w-5 h-5" />
        <span>Agregar al Perfil</span>
      </button>
    );
  }

  // Variante primaria (botón lleno)
  return (
    <button
      onClick={handleAddToLinkedIn}
      className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold text-lg
        bg-[#0A66C2] text-white hover:bg-[#004182] transition-all shadow-md hover:shadow-lg ${className}`}
    >
      <LinkedInIcon className="w-6 h-6" />
      <div className="flex flex-col items-start">
        <span>Agregar a mi Perfil de LinkedIn</span>
        <span className="text-xs font-normal opacity-80">
          Aparecerá en tu sección de Certificaciones
        </span>
      </div>
    </button>
  );
}

// Componente del ícono de LinkedIn
function LinkedInIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
