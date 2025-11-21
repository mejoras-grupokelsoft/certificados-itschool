import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-indigo-600 mb-4">IT SCHOOL</h1>
          <p className="text-gray-600 text-xl">Instituto de Tecnología y Desarrollo de Software</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">Sistema de Certificados</h2>
            <p className="text-gray-600 text-lg text-center mb-12">Obtén tu certificado digital verificable al completar nuestros cursos</p>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 text-center">
              <h3 className="font-bold text-gray-900 text-xl mb-4">¿Completaste un curso?</h3>
              <p className="text-gray-600 mb-6">Ingresa el ID de tu curso para generar tu certificado</p>
              <Link href="/curso/123456" className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors">Generar Certificado (Ejemplo)</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
