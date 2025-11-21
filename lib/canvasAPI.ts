import { GraphQLClient } from 'graphql-request';
import type { CanvasEnrollment, CanvasSubmissionNode, CanvasStudent, CanvasSubmission } from './types';

const CANVAS_BASE_URL = process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com/api/graphql';
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;

if (!CANVAS_API_TOKEN) {
  throw new Error('CANVAS_API_TOKEN no está configurado en las variables de entorno');
}

const client = new GraphQLClient(CANVAS_BASE_URL, {
  headers: {
    Authorization: `Bearer ${CANVAS_API_TOKEN}`,
  },
});

// Query para obtener enrollments de un curso
const GET_COURSE_ENROLLMENTS = `
  query GetCourseEnrollments($courseId: ID!) {
    course(id: $courseId) {
      enrollmentsConnection(filter: {types: [StudentEnrollment]}) {
        nodes {
          _id
          user {
            _id
            name
            email
          }
          state
        }
      }
    }
  }
`;

// Query para obtener assignments de un curso
const GET_COURSE_ASSIGNMENTS = `
  query GetCourseAssignments($courseId: ID!) {
    course(id: $courseId) {
      assignmentsConnection {
        nodes {
          _id
          name
          pointsPossible
        }
      }
    }
  }
`;

// Query para obtener submissions de un assignment (con paginación)
const GET_ASSIGNMENT_SUBMISSIONS = `
  query GetAssignmentSubmissions($assignmentId: ID!, $after: String) {
    assignment(id: $assignmentId) {
      submissionsConnection(first: 100, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          _id
          score
          grade
          submittedAt
          gradedAt
          user {
            _id
          }
        }
      }
    }
  }
`;

// Función para validar si un estudiante existe y está inscrito en el curso
export async function validateStudentInCourse(
  courseId: string,
  studentEmail: string
): Promise<CanvasStudent | null> {
  try {
    console.log(`🔍 Buscando estudiante con email: ${studentEmail} en curso: ${courseId}`);
    const data: any = await client.request(GET_COURSE_ENROLLMENTS, { courseId });
    
    const enrollments: CanvasEnrollment[] = data.course?.enrollmentsConnection?.nodes || [];
    console.log(`📊 Total enrollments encontrados: ${enrollments.length}`);
    
    // Mostrar TODOS los emails para debug
    if (enrollments.length > 0) {
      console.log('📧 TODOS los emails del curso:');
      enrollments.forEach((e, idx) => {
        console.log(`  ${idx + 1}. ${e.user.email} - ${e.user.name}`);
      });
    }
    
    // Buscar el estudiante por email
    const enrollment = enrollments.find(
      (e) => e.user.email.toLowerCase() === studentEmail.toLowerCase()
    );
    
    if (!enrollment) {
      console.log('❌ Email no encontrado en enrollments');
      return null;
    }
    
    console.log(`✅ Estudiante encontrado: ${enrollment.user.name}`);
    
    return {
      userId: enrollment.user._id,
      name: enrollment.user.name,
      email: enrollment.user.email,
      enrollmentState: enrollment.state,
    };
  } catch (error) {
    console.error('Error validando estudiante en Canvas:', error);
    throw new Error('Error al consultar Canvas API');
  }
}

// Función para obtener la submission de un estudiante en un assignment específico
export async function getStudentSubmission(
  assignmentId: string,
  userId: string
): Promise<CanvasSubmission | null> {
  try {
    console.log(`📄 Buscando submission para userId: ${userId} en assignment: ${assignmentId}`);
    
    // Obtener TODAS las submissions con paginación
    let allSubmissions: CanvasSubmissionNode[] = [];
    let hasNextPage = true;
    let after: string | null = null;
    
    while (hasNextPage) {
      const data: any = await client.request(GET_ASSIGNMENT_SUBMISSIONS, { 
        assignmentId,
        after 
      });
      
      const connection = data.assignment?.submissionsConnection;
      const submissions = connection?.nodes || [];
      allSubmissions = allSubmissions.concat(submissions);
      
      hasNextPage = connection?.pageInfo?.hasNextPage || false;
      after = connection?.pageInfo?.endCursor || null;
      
      console.log(`📊 Página obtenida: ${submissions.length} submissions (Total acumulado: ${allSubmissions.length})`);
    }
    
    console.log(`📊 Total final de submissions: ${allSubmissions.length}`);
    
    // Buscar la submission del usuario específico
    const submission = allSubmissions.find((s) => s.user._id === userId);
    
    if (submission) {
      console.log(`✅ Submission encontrada: Score=${submission.score}, Graded=${submission.gradedAt ? 'Sí' : 'No'}`);
    } else {
      console.log(`❌ No se encontró submission para userId ${userId}`);
      return null;
    }
    
    return {
      userId: submission.user._id,
      assignmentId,
      score: submission.score,
      grade: submission.grade,
      submittedAt: submission.submittedAt,
      gradedAt: submission.gradedAt,
      workflowState: 'graded', // Valor por defecto ya que Canvas no expone este campo
    };
  } catch (error) {
    console.error('Error obteniendo submission de Canvas:', error);
    throw new Error('Error al consultar Canvas API');
  }
}

// Función para buscar el assignment "Test Final" o similar en un curso
export async function findFinalExamAssignment(courseId: string): Promise<string | null> {
  try {
    const data: any = await client.request(GET_COURSE_ASSIGNMENTS, { courseId });
    const assignments = data.course?.assignmentsConnection?.nodes || [];
    
    console.log('📚 Assignments encontrados en el curso:');
    assignments.forEach((a: any, idx: number) => {
      console.log(`  ${idx + 1}. "${a.name}" (ID: ${a._id})`);
    });
    
    // Buscar assignment que contenga "test final" o "examen final"
    // EXCLUIR "Trabajo Práctico Final" o "TP Final"
    const finalExam = assignments.find((a: any) => {
      const name = a.name.toLowerCase();
      const isTest = name.includes('test final') || 
                     name.includes('examen final') || 
                     name.includes('final exam') ||
                     name.includes('evaluación integral');
      const isTP = name.includes('trabajo práctico') || 
                   name.includes('trabajo practico') ||
                   name.includes('tp final');
      
      return isTest && !isTP;
    });
    
    if (finalExam) {
      console.log(`✅ Test Final encontrado: "${finalExam.name}" (ID: ${finalExam._id})`);
    } else {
      console.log('❌ No se encontró Test Final en el curso');
    }
    
    return finalExam?._id || null;
  } catch (error) {
    console.error('Error buscando assignment final:', error);
    return null;
  }
}

// Función para validar si un estudiante completó un curso con puntaje mínimo
export async function validateStudentCompletion(
  courseId: string,
  studentEmail: string,
  passingScore: number
): Promise<{
  isValid: boolean;
  student?: CanvasStudent;
  submission?: CanvasSubmission;
  message: string;
}> {
  try {
    // 1. Validar que el estudiante existe y está inscrito
    const student = await validateStudentInCourse(courseId, studentEmail);
    
    if (!student) {
      return {
        isValid: false,
        message: 'Estudiante no encontrado o no está inscrito en este curso',
      };
    }
    
    // 2. Buscar el assignment "Test Final" automáticamente
    const assignmentId = await findFinalExamAssignment(courseId);
    
    if (!assignmentId) {
      return {
        isValid: false,
        student,
        message: 'No se encontró un "Test Final" o "Examen Final" en este curso',
      };
    }
    
    // 3. Obtener la submission del assignment
    const submission = await getStudentSubmission(assignmentId, student.userId);
    
    if (!submission) {
      return {
        isValid: false,
        student,
        message: 'No se encontró una entrega para el examen final',
      };
    }
    
    // 4. Validar que la submission está calificada
    if (!submission.gradedAt || submission.score === null) {
      return {
        isValid: false,
        student,
        submission,
        message: 'El examen final aún no ha sido calificado',
      };
    }
    
    // 5. Validar que el puntaje cumple con el mínimo
    if (submission.score < passingScore) {
      return {
        isValid: false,
        student,
        submission,
        message: `El puntaje obtenido (${submission.score}) no alcanza el mínimo requerido (${passingScore})`,
      };
    }
    
    // 6. Todo OK - estudiante aprobó
    return {
      isValid: true,
      student,
      submission,
      message: 'Estudiante validado correctamente',
    };
  } catch (error) {
    console.error('Error validando completitud del estudiante:', error);
    throw error;
  }
}
