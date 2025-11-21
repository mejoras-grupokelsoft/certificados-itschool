import { NextRequest, NextResponse } from 'next/server';
import { validateStudentCompletion } from '@/lib/canvasAPI';
import { getCourseConfig } from '@/lib/sheetsConfig';
import type { ValidationResponse } from '@/lib/types';

/**
 * API Route: POST /api/validate
 * 
 * Valida si un estudiante completó un curso específico con el puntaje mínimo requerido
 * 
 * Body esperado:
 * {
 *   "courseId": "123456",
 *   "studentEmail": "estudiante@example.com"
 * }
 * 
 * Respuesta:
 * {
 *   "success": true,
 *   "message": "Estudiante validado correctamente",
 *   "studentName": "Juan Pérez",
 *   "studentEmail": "estudiante@example.com",
 *   "courseName": "Python I",
 *   "score": 95,
 *   "courseConfig": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parsear el body
    const body = await request.json();
    const { courseId, studentEmail } = body;

    // Validar parámetros requeridos
    if (!courseId || !studentEmail) {
      return NextResponse.json(
        {
          success: false,
          message: 'Faltan parámetros requeridos: courseId y studentEmail',
        } as ValidationResponse,
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: 'El formato del email no es válido',
        } as ValidationResponse,
        { status: 400 }
      );
    }

    // Obtener configuración del curso
    const courseConfig = await getCourseConfig(courseId);
    
    if (!courseConfig) {
      return NextResponse.json(
        {
          success: false,
          message: 'Curso no encontrado o no habilitado para certificados',
        } as ValidationResponse,
        { status: 404 }
      );
    }

    // Validar completitud del estudiante en Canvas
    const validation = await validateStudentCompletion(
      courseId,
      studentEmail,
      courseConfig.passingScore
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.message,
        } as ValidationResponse,
        { status: 400 }
      );
    }

    // Estudiante validado correctamente
    return NextResponse.json(
      {
        success: true,
        message: 'Estudiante validado correctamente',
        studentName: validation.student?.name,
        studentEmail: validation.student?.email,
        courseName: courseConfig.courseName,
        score: validation.submission?.score || 0,
        courseConfig,
      } as ValidationResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/validate:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      } as ValidationResponse,
      { status: 500 }
    );
  }
}

// Permitir solo POST
export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST.' },
    { status: 405 }
  );
}
