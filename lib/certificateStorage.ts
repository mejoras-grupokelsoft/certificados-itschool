import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';
import type { CertificateData } from './types';

const BUILD_ID = `certificateStorage-${new Date().toISOString()}-${Date.now()}`;
const BUILD_TIMESTAMP = Date.now();
console.log(`📦 certificateStorage loaded - BUILD_ID: ${BUILD_ID}, TIMESTAMP: ${BUILD_TIMESTAMP}`);

// Configurar cliente de Redis con Upstash
// Usa las variables de entorno UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

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
 * Guarda los datos del certificado en Upstash Redis
 * La key usa el formato: certificate:{token}
 * Los datos se guardan indefinidamente (sin expiración)
 */
export async function saveCertificate(
  token: string,
  data: CertificateData
): Promise<void> {
  const key = `certificate:${token}`;
  await redis.set(key, JSON.stringify(data));
}

/**
 * Recupera los datos de un certificado desde Upstash Redis
 */
export async function getCertificate(token: string): Promise<CertificateData | null> {
  const key = `certificate:${token}`;
  const data = await redis.get<string>(key);
  
  if (!data) {
    return null;
  }
  
  try {
    return typeof data === 'string' ? JSON.parse(data) : data as CertificateData;
  } catch {
    return null;
  }
}

/**
 * Verifica si un certificado existe
 */
export async function certificateExists(token: string): Promise<boolean> {
  const key = `certificate:${token}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Lista todos los certificados (para debugging/admin)
 * CUIDADO: Puede ser costoso en producción si hay muchos certificados
 */
export async function listCertificates(limit: number = 100): Promise<string[]> {
  const keys = await redis.keys('certificate:*');
  return keys.slice(0, limit);
}

/**
 * Elimina un certificado (para testing o correcciones)
 */
export async function deleteCertificate(token: string): Promise<boolean> {
  const key = `certificate:${token}`;
  const deleted = await redis.del(key);
  return deleted === 1;
}

/**
 * Actualiza campos específicos de un certificado existente
 */
export async function updateCertificate(
  token: string,
  updates: Partial<CertificateData>
): Promise<boolean> {
  const existing = await getCertificate(token);
  if (!existing) {
    return false;
  }
  
  const updated = { ...existing, ...updates };
  await saveCertificate(token, updated);
  return true;
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
