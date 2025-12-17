'use client';

import { useState } from 'react';

interface CommitmentLetterModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

/**
 * Modal que muestra la Carta de Compromiso de ITSCHOOL
 * Debe aceptarse antes de poder compartir/descargar el certificado por primera vez
 */
export default function CommitmentLetterModal({
  isOpen,
  onAccept,
  onClose,
}: CommitmentLetterModalProps) {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const handleAcceptAndContinue = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <>
      {/* Overlay con blur */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal centrado */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-scale-in max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/Logo Original a color.svg" 
                  alt="IT SCHOOL Logo" 
                  className="h-10 w-auto"
                />
                <h3 className="text-xl font-bold text-gray-900">
                  Carta de Compromiso
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="px-6 py-5 overflow-y-auto flex-1">
            {/* Contenido de la carta */}
            <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
              <p className="text-gray-500 text-sm">Buenos Aires, Argentina,</p>
              
              <p>Estimado/a,</p>
              
              <p>
                Te enviamos esta carta para solicitar tu compromiso como parte de <strong>IT SCHOOL</strong>, esto 
                no es una tarea obligatoria, sino una propuesta para difundir lo que ofrece IT SCHOOL 
                para ayudarnos a que más personas conozcan nuestra propuesta.
              </p>

              <p className="font-semibold text-gray-900">Lo que te proponemos es:</p>

              <div className="bg-blue-50 border-l-4 border-[#4285F4] p-4 rounded-r-lg">
                <ul className="space-y-3 list-none pl-0 m-0 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#4285F4] font-bold">•</span>
                    <span>Repostear y compartir las publicaciones que hace IT School en{' '}
                      <a href="https://www.linkedin.com/company/it-school-educacion-tecnica/" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] hover:underline">LinkedIn</a>,{' '}
                      <a href="https://www.instagram.com/itschool_laposta/" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] hover:underline">Instagram</a> y{' '}
                      <a href="https://www.tiktok.com/@itschool.laposta" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] hover:underline">TikTok</a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4285F4] font-bold">•</span>
                    <span>Compartir tu certificado en las redes sociales, junto con el hashtag <strong>#ITSCHOOL</strong> y <strong>#ITSKILLED</strong>, cuando lo recibís para incentivar a otros a inscribirse en los cursos y terminarlos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4285F4] font-bold">•</span>
                    <span>Dar testimonio de tu experiencia como alumno para dar a conocer IT School</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4285F4] font-bold">•</span>
                    <span>Formar parte de la{' '}
                      <a href="https://chat.whatsapp.com/IshFFCZAz1bJqQWoVjh92U" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] hover:underline">comunidad de WhatsApp</a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4285F4] font-bold">•</span>
                    <span>Buscar y proponer Instructores de nuevas tecnologías para que nos contacten y brindarles un espacio para que se den a conocer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4285F4] font-bold">•</span>
                    <span>Avisándonos oportunidades de trabajo que les pueda servir a otros</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4285F4] font-bold">•</span>
                    <span>Formando parte del programa de referidos, por acá te dejamos el{' '}
                      <a href="https://cosys.com.ar/programa-de-referidos/" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] hover:underline">link</a> junto con información adicional detallada{' '}
                      <a href="https://www.linkedin.com/posts/cosysglobal_programadereferidoscosys-planderereridos-activity-7189594072859238400-82DA?utm_source=share&utm_medium=member_desktop" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] hover:underline">aquí</a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4285F4] font-bold">•</span>
                    <span>Difundir las búsquedas que realiza{' '}
                      <a href="https://www.linkedin.com/company/cosysglobal/" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] hover:underline">Cosys</a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4285F4] font-bold">•</span>
                    <span>Agregar en LinkedIn en el apartado de Educación que estudiaste en IT School y el curso que tomaste y ahí podés subir el certificado también</span>
                  </li>
                </ul>
              </div>

              <p>
                Agradecemos tu participación al éxito educativo de IT School y de nuestros estudiantes, 
                por eso si aceptás esta propuesta te pedimos que nos confirmes por mail a{' '}
                <a href="mailto:itschool@grupokelsoft.com" className="text-[#4285F4] hover:underline">itschool@grupokelsoft.com</a>. 
                Si tenés alguna pregunta o inquietud, no dudes en comunicarte con nosotros.
              </p>

              <p>Atentamente,</p>
              <p className="font-semibold text-gray-900">Equipo de ITSCHOOL</p>
            </div>

            {/* Checkbox de aceptación */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="w-5 h-5 text-[#4285F4] border-2 border-gray-300 rounded focus:ring-[#4285F4] focus:ring-offset-0 cursor-pointer"
                  />
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  <strong>Acepto la propuesta de IT SCHOOL</strong> y me comprometo a colaborar 
                  con la difusión de la institución según las opciones mencionadas.
                </span>
              </label>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAcceptAndContinue}
                disabled={!accepted}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  accepted
                    ? 'bg-gradient-to-r from-[#4285F4] to-[#393185] text-white hover:opacity-90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {accepted ? '✓ Aceptar y Continuar' : 'Aceptá los términos para continuar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
