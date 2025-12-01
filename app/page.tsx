import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header con Logo */}
        <div className="flex justify-center mb-16">
          <img 
            src="/Logo Original a color.svg" 
            alt="ITSCHOOL Logo" 
            className="h-24 w-auto"
          />
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 mb-8">
            <h2 className="text-4xl font-bold mb-6 text-center" style={{ color: '#1A1A1A' }}>
              Sistema de Certificados
            </h2>
            <p className="text-lg text-center mb-12" style={{ color: '#666666' }}>
              Obtené tu certificado digital verificable al completar nuestros cursos
            </p>

            <div className="rounded-xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #4285F4 0%, #393185 100%)' }}>
              <h3 className="font-bold text-white text-xl mb-4">
                ¿Completaste un curso?
              </h3>
              <p className="text-white/90 mb-6">
                Elegí tu curso y generá tu certificado oficial
              </p>
              <Link 
                href="/cursos" 
                className="inline-block text-white px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#34A853' }}
              >
                Ver Cursos Disponibles
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12" style={{ color: '#666666' }}>
          <p className="text-sm">
            Si querés saber más de nosotros o ver más cursos, consultá nuestra página:{' '}
            <a 
              href="https://www.itschool.com.ar" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline" 
              style={{ color: '#4285F4' }}
            >
              www.itschool.com.ar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
