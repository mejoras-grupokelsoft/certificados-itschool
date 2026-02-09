import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import type { CertificateData } from './types';

// Configurar cliente de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLE = 'certificates';

/**
 * Convierte un row de Supabase (snake_case) a CertificateData (camelCase)
 */
function rowToCertificate(row: Record<string, unknown>): CertificateData {
  return {
    token: row.token as string,
    studentName: row.student_name as string,
    studentEmail: row.student_email as string,
    courseName: row.course_name as string,
    courseId: row.course_id as string,
    completionDate: row.completion_date as string,
    instructorName: row.instructor_name as string,
    duration: row.duration as string,
    score: row.score as number,
    validationUrl: row.validation_url as string,
    generatedAt: row.generated_at as string,
    institution: (row.institution as 'ITSCHOOL' | 'SEC') || 'ITSCHOOL',
    hasBeenDownloaded: row.has_been_downloaded as boolean || false,
    firstDownloadAt: row.first_download_at as string | undefined,
    hasAcceptedCommitment: row.has_accepted_commitment as boolean || false,
    commitmentAcceptedAt: row.commitment_accepted_at as string | undefined,
  };
}

/**
 * Convierte CertificateData (camelCase) a formato de Supabase (snake_case)
 */
function certificateToRow(data: CertificateData) {
  return {
    token: data.token,
    student_name: data.studentName,
    student_email: data.studentEmail,
    course_name: data.courseName,
    course_id: data.courseId,
    completion_date: data.completionDate,
    instructor_name: data.instructorName,
    duration: data.duration,
    score: data.score,
    validation_url: data.validationUrl,
    generated_at: data.generatedAt,
    institution: data.institution || 'ITSCHOOL',
    has_been_downloaded: data.hasBeenDownloaded || false,
    first_download_at: data.firstDownloadAt || null,
    has_accepted_commitment: data.hasAcceptedCommitment || false,
    commitment_accepted_at: data.commitmentAcceptedAt || null,
  };
}

/**
 * Genera un token único y determinístico para el certificado
 * Mismo estudiante + curso = mismo token (idempotente)
 * Usa SHA-256 hash de: studentEmail + courseId
 */
export function generateCertificateToken(studentEmail: string, courseId: string): string {
  const data = `${studentEmail.toLowerCase().trim()}:${courseId.trim()}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Guarda los datos del certificado en Supabase
 */
export async function saveCertificate(
  token: string,
  data: CertificateData
): Promise<void> {
  const row = certificateToRow(data);

  const { error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'token' });

  if (error) {
    console.error(`❌ Error guardando certificado ${token.slice(0, 10)}...:`, error.message);
    throw new Error(`Failed to save certificate: ${error.message}`);
  }
}

/**
 * Recupera los datos de un certificado desde Supabase
 */
export async function getCertificate(token: string): Promise<CertificateData | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToCertificate(data);
}

/**
 * Verifica si un certificado existe
 */
export async function certificateExists(token: string): Promise<boolean> {
  const { count, error } = await supabase
    .from(TABLE)
    .select('token', { count: 'exact', head: true })
    .eq('token', token);

  if (error) return false;
  return (count ?? 0) > 0;
}

/**
 * Lista todos los tokens de certificados (para debugging/admin)
 */
export async function listCertificates(limit: number = 100): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('token')
    .limit(limit);

  if (error || !data) return [];
  return data.map((row: { token: string }) => `certificate:${row.token}`);
}

/**
 * Elimina un certificado (para testing o correcciones)
 */
export async function deleteCertificate(token: string): Promise<boolean> {
  const { error, count } = await supabase
    .from(TABLE)
    .delete({ count: 'exact' })
    .eq('token', token);

  if (error) return false;
  return (count ?? 0) > 0;
}

/**
 * Actualiza campos específicos de un certificado existente
 */
export async function updateCertificate(
  token: string,
  updates: Partial<CertificateData>
): Promise<boolean> {
  // Convertir solo los campos proporcionados a snake_case
  const snakeUpdates: Record<string, unknown> = {};
  if (updates.hasBeenDownloaded !== undefined) snakeUpdates.has_been_downloaded = updates.hasBeenDownloaded;
  if (updates.firstDownloadAt !== undefined) snakeUpdates.first_download_at = updates.firstDownloadAt;
  if (updates.hasAcceptedCommitment !== undefined) snakeUpdates.has_accepted_commitment = updates.hasAcceptedCommitment;
  if (updates.commitmentAcceptedAt !== undefined) snakeUpdates.commitment_accepted_at = updates.commitmentAcceptedAt;
  if (updates.institution !== undefined) snakeUpdates.institution = updates.institution;
  if (updates.studentName !== undefined) snakeUpdates.student_name = updates.studentName;
  if (updates.courseName !== undefined) snakeUpdates.course_name = updates.courseName;
  if (updates.instructorName !== undefined) snakeUpdates.instructor_name = updates.instructorName;
  if (updates.score !== undefined) snakeUpdates.score = updates.score;

  const { error, count } = await supabase
    .from(TABLE)
    .update(snakeUpdates, { count: 'exact' })
    .eq('token', token);

  if (error) {
    console.error(`❌ Error actualizando certificado ${token.slice(0, 10)}...:`, error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

/**
 * Marca un certificado como descargado (desbloquea descargas futuras sin compartir)
 */
export async function markCertificateAsDownloaded(token: string): Promise<boolean> {
  return updateCertificate(token, {
    hasBeenDownloaded: true,
    firstDownloadAt: new Date().toISOString()
  });
}

/**
 * Marca que el estudiante aceptó la carta de compromiso
 */
export async function markCommitmentAccepted(token: string): Promise<boolean> {
  return updateCertificate(token, {
    hasAcceptedCommitment: true,
    commitmentAcceptedAt: new Date().toISOString()
  });
}
