// Tipos para la configuración de cursos desde Google Sheets
export interface CourseConfig {
  courseId: string;
  courseName: string;
  instructorName: string;
}

// Tipos para la validación de estudiantes desde Canvas
export interface CanvasStudent {
  userId: string;
  name: string;
  email: string;
  enrollmentState: string;
}

export interface CanvasSubmission {
  userId: string;
  assignmentId: string;
  score: number | null;
  grade: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  workflowState: string;
}

// Tipos para el certificado
export interface CertificateData {
  token: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseId: string;
  completionDate: string;
  instructorName: string;
  duration: string;
  score: number;
  validationUrl: string;
  generatedAt: string;
  institution: 'ITSCHOOL' | 'SEC'; // Tipo de institución que emite el certificado
  issueDate?: string; // Deprecated - use generatedAt instead
  hasBeenDownloaded?: boolean; // True after first successful download (unlocks future downloads without sharing)
  firstDownloadAt?: string; // ISO timestamp of first download
  hasAcceptedCommitment?: boolean; // True after accepting commitment letter (required before first share/download)
  commitmentAcceptedAt?: string; // ISO timestamp of commitment acceptance
}

// Tipos para la respuesta de validación
export interface ValidationResponse {
  success: boolean;
  message: string;
  studentName?: string;
  studentEmail?: string;
  courseName?: string;
  score?: number;
  courseConfig?: CourseConfig;
}

// Tipos para la respuesta de generación de certificado
export interface CertificateResponse {
  success: boolean;
  message: string;
  certificateUrl?: string;
  token?: string;
  validationUrl?: string;
  existing?: boolean;
  hasBeenDownloaded?: boolean; // True if certificate was already downloaded before
  hasAcceptedCommitment?: boolean; // True if commitment letter was already accepted
}

// Tipos para Canvas GraphQL API
export interface CanvasEnrollment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  state: string;
}

export interface CanvasAssignment {
  _id: string;
  name: string;
  pointsPossible: number;
}

export interface CanvasSubmissionNode {
  _id: string;
  score: number | null;
  grade: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  user: {
    _id: string;
  };
  workflowState: string;
}
