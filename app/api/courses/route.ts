import { NextResponse } from 'next/server';
import { getCourseConfigs } from '@/lib/sheetsConfig';

export async function GET() {
  try {
    console.log('🔍 Fetching all courses from Google Sheets (standard + SEC)...');
    
    // Obtener cursos estándar y SEC en PARALELO
    const [standardCourses, secCoursesResult] = await Promise.all([
      getCourseConfigs(false),
      getCourseConfigs(true).catch((secError) => {
        console.warn('⚠️ No se pudieron cargar cursos SEC:', secError instanceof Error ? secError.message : secError);
        return [];
      })
    ]);

    const secCourses = secCoursesResult;
    console.log(`✅ Found ${standardCourses.length} standard + ${secCourses.length} SEC courses`);
    
    // Combinar y marcar tipo
    const allCourses = [
      ...standardCourses.map(course => ({ ...course, type: 'standard' as const })),
      ...secCourses.map(course => ({ ...course, type: 'sec' as const }))
    ];
    
    return NextResponse.json({ 
      courses: allCourses,
      count: allCourses.length,
      breakdown: {
        standard: standardCourses.length,
        sec: secCourses.length
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Error al cargar los cursos' },
      { status: 500 }
    );
  }
}
