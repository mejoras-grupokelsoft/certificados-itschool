'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Course {
  courseId: string;
  courseName: string;
  instructorName: string;
  type: 'standard' | 'sec';
}

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [courseTypeFilter, setCourseTypeFilter] = useState<'all' | 'standard' | 'sec'>('all');
  const [page, setPage] = useState(1);
  const COURSES_PER_PAGE = 10;

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, sortOrder, courseTypeFilter]);

  useEffect(() => {
    // Actualizar cursos mostrados según la paginación
    setDisplayedCourses(filteredCourses.slice(0, page * COURSES_PER_PAGE));
  }, [filteredCourses, page]);

  useEffect(() => {
    // Resetear paginación cuando cambian los filtros
    setPage(1);
  }, [searchTerm, sortOrder, courseTypeFilter]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Error al cargar los cursos');
      }
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCourses = () => {
    let filtered = courses;

    // Filtrar por tipo de curso
    if (courseTypeFilter !== 'all') {
      filtered = filtered.filter(course => course.type === courseTypeFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered = [...filtered].sort((a, b) => {
      const comparison = a.courseName.localeCompare(b.courseName, 'es');
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredCourses(filtered);
  };

  const loadMoreCourses = () => {
    setPage(prev => prev + 1);
  };

  const hasMoreCourses = displayedCourses.length < filteredCourses.length;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header con Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <img 
              src="/Logo Original a color.svg" 
              alt="ITSCHOOL Logo" 
              className="h-20 w-auto cursor-pointer"
            />
          </Link>
        </div>

        {/* Título */}
        <div className="max-w-6xl mx-auto mb-8">
          <h1 className="text-4xl font-bold text-center mb-4" style={{ color: '#1A1A1A' }}>
            Cursos Disponibles
          </h1>
          <p className="text-center" style={{ color: '#666666' }}>
            Seleccioná un curso para generar tu certificado
          </p>
        </div>

        {/* Pestañas de filtro por tipo */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setCourseTypeFilter('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                courseTypeFilter === 'all'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={courseTypeFilter === 'all' ? { backgroundColor: '#4285F4' } : {}}
            >
              Todos ({courses.length})
            </button>
            <button
              onClick={() => setCourseTypeFilter('standard')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                courseTypeFilter === 'standard'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={courseTypeFilter === 'standard' ? { backgroundColor: '#4285F4' } : {}}
            >
              ITSCHOOL ({courses.filter(c => c.type === 'standard').length})
            </button>
            <button
              onClick={() => setCourseTypeFilter('sec')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                courseTypeFilter === 'sec'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={courseTypeFilter === 'sec' ? { backgroundColor: '#202C72' } : {}}
            >
              SEC ({courses.filter(c => c.type === 'sec').length})
            </button>
          </div>
        </div>

        {/* Barra de búsqueda y ordenamiento */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Buscador */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nombre de curso o instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              {/* Selector de ordenamiento */}
              <div className="md:w-48">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="asc">A → Z</option>
                  <option value="desc">Z → A</option>
                </select>
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="mt-4 text-sm" style={{ color: '#666666' }}>
              {filteredCourses.length} {filteredCourses.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
            </div>
          </div>
        </div>

        {/* Lista de cursos */}
        <div className="max-w-6xl mx-auto">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4" style={{ borderColor: '#4285F4' }}></div>
              <p style={{ color: '#666666' }}>Cargando cursos...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: '#666666' }}>No se encontraron cursos que coincidan con tu búsqueda</p>
            </div>
          )}

          {!loading && !error && filteredCourses.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCourses.map((course) => (
                <Link
                  key={course.courseId}
                  href={`/curso/${course.courseId}`}
                  className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-100"
                >
                  {/* Header del card con gradiente */}
                  <div className="p-6 text-white" style={{ background: 'linear-gradient(135deg, #4285F4 0%, #393185 100%)' }}>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {course.courseName}
                    </h3>
                  </div>

                  {/* Body del card */}
                  <div className="p-6">
                    <div className="flex items-center mb-4" style={{ color: '#666666' }}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm">{course.instructorName}</span>
                    </div>

                    <div className="flex items-center text-sm" style={{ color: '#666666' }}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>ID: {course.courseId}</span>
                    </div>

                    {/* Botón */}
                    <button
                      className="w-full mt-6 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#4285F4' }}
                    >
                      Generar Certificado
                    </button>
                  </div>
                </Link>
              ))}
              </div>

              {/* Botón Cargar Más */}
              {hasMoreCourses && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMoreCourses}
                    className="px-8 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#4285F4' }}
                  >
                    Cargar más cursos ({filteredCourses.length - displayedCourses.length} restantes)
                  </button>
                </div>
              )}
            </>
          )}
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
