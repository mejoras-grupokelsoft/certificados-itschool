export default function HomePage() {
  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="mb-8">
              <h1 className="text-7xl font-bold text-indigo-600 mb-4">ITSCHOOL</h1>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 my-8">
              <div className="mb-6">
                <svg className="w-20 h-20 mx-auto text-indigo-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Sistema de Certificados</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  El sitio está en proceso. <br />
                  Pronto vas a poder descargar y validar tu certificado de manera automática.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                Para más información contactanos en{' '}
                <a href="mailto:itschool@grupokelsoft.com" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  itschool@grupokelsoft.com
                </a>
              </p>
=======
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

        {/* Testing Branch Badge */}
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: '#FABB05', color: '#1A1A1A' }}>
            [TESTING BRANCH]
          </span>
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
>>>>>>> testing
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
