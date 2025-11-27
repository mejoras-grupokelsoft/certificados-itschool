export default function HomePage() {
  return (
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
