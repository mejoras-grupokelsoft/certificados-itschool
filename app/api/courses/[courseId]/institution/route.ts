import { NextRequest, NextResponse } from 'next/server';
import { getCourseConfig } from '@/lib/sheetsConfig';

/**
 * API Route: GET /api/courses/[courseId]/institution
 * 
 * Devuelve la institución (ITSCHOOL o SEC) del curso especificado
 * Endpoint rápido para detectar institución sin cargar todos los cursos
 */
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const params = await context.params;
    const { courseId } = params;

    // Buscar curso (busca en ambas configuraciones automáticamente)
    const courseConfig = await getCourseConfig(courseId);

    if (!courseConfig) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Determinar institución por el sufijo "- SEC"
    const institution = courseConfig.courseName.trim().endsWith('- SEC') ? 'SEC' : 'ITSCHOOL';

    return NextResponse.json(
      { institution },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache por 5 minutos
        },
      }
    );
  } catch (error) {
    console.error('Error obteniendo institución del curso:', error);
    
    return NextResponse.json(
      { institution: 'ITSCHOOL' }, // Default a ITSCHOOL en caso de error
      { status: 200 }
    );
  }
}
