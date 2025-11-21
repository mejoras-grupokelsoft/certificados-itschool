import { Redis } from '@upstash/redis';
import { randomBytes } from 'crypto';
import type { CertificateData } from './types';

// Configurar cliente de Redis con Upstash
// Usa las variables de entorno UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

/**
 * Genera un token único para el certificado
 */
export function generateCertificateToken(): string {
  return randomBytes(32).toString('hex');
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
