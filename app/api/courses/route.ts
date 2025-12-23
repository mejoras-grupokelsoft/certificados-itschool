import { NextResponse } from 'next/server';
import { getCourseConfigs } from '@/lib/sheetsConfig';

export async function GET() {
  try {
    console.log('🔍 Fetching all courses from Google Sheets (standard + SEC)...');
    
    // Obtener cursos estándar
    console.log('🔍 Fetching standard courses...');
    const standardCourses = await getCourseConfigs(false);
    console.log(`✅ Found ${standardCourses.length} standard courses`);
    
    // Intentar obtener cursos SEC (no fallar si no están disponibles)
    let secCourses: any[] = [];
    try {
      console.log('🔍 Fetching SEC courses...');
      secCourses = await getCourseConfigs(true);
      console.log(`✅ Found ${secCourses.length} SEC courses`);
    } catch (secError) {
      console.warn('⚠️ No se pudieron cargar cursos SEC (spreadsheet no disponible o sin permisos)');
      console.warn('Detalles:', secError instanceof Error ? secError.message : secError);
    }
    
    // Combinar y marcar tipo
    const allCourses = [
      ...standardCourses.map(course => ({ ...course, type: 'standard' as const })),
      ...secCourses.map(course => ({ ...course, type: 'sec' as const }))
    ];
    
    console.log(`✅ Total courses: ${allCourses.length} (${standardCourses.length} standard + ${secCourses.length} SEC)`);
    
    return NextResponse.json({ 
      courses: allCourses,
      count: allCourses.length,
      breakdown: {
        standard: standardCourses.length,
        sec: secCourses.length
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
