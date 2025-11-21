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

// Query para obtener submissions de un assignment
const GET_ASSIGNMENT_SUBMISSIONS = `
  query GetAssignmentSubmissions($assignmentId: ID!) {
    assignment(id: $assignmentId) {
      submissionsConnection {
        nodes {
          _id
          score
          grade
          submittedAt
          gradedAt
          user {
            _id
          }
          workflowState
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
    const data: any = await client.request(GET_COURSE_ENROLLMENTS, { courseId });
    
    const enrollments: CanvasEnrollment[] = data.course?.enrollmentsConnection?.nodes || [];
    
    // Buscar el estudiante por email
    const enrollment = enrollments.find(
      (e) => e.user.email.toLowerCase() === studentEmail.toLowerCase()
    );
    
    if (!enrollment) {
      return null;
    }
    
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
    const data: any = await client.request(GET_ASSIGNMENT_SUBMISSIONS, { assignmentId });
    
    const submissions: CanvasSubmissionNode[] = data.assignment?.submissionsConnection?.nodes || [];
    
    // Buscar la submission del usuario específico
    const submission = submissions.find((s) => s.user._id === userId);
    
    if (!submission) {
      return null;
    }
    
    return {
      userId: submission.user._id,
      assignmentId,
      score: submission.score,
      grade: submission.grade,
      submittedAt: submission.submittedAt,
      gradedAt: submission.gradedAt,
      workflowState: submission.workflowState,
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
    
    // Buscar assignment que contenga "test final", "examen final", o "final"
    const finalExam = assignments.find((a: any) => {
      const name = a.name.toLowerCase();
      return name.includes('test final') || 
             name.includes('examen final') || 
             name.includes('final exam') ||
             (name.includes('final') && name.includes('test'));
    });
    
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
