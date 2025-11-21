import { kv } from '@vercel/kv';
import { randomBytes } from 'crypto';
import type { CertificateData } from './types';

/**
 * Genera un token único para el certificado
 */
export function generateCertificateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Guarda los datos del certificado en Vercel KV (Redis)
 * La key usa el formato: certificate:{token}
 * Los datos se guardan indefinidamente (sin expiración)
 */
export async function saveCertificate(
  token: string,
  data: CertificateData
): Promise<void> {
  const key = `certificate:${token}`;
  await kv.set(key, JSON.stringify(data));
}

/**
 * Recupera los datos de un certificado desde Vercel KV
 */
export async function getCertificate(token: string): Promise<CertificateData | null> {
  const key = `certificate:${token}`;
  const data = await kv.get<string>(key);
  
  if (!data) {
    return null;
  }
  
  try {
    return JSON.parse(data) as CertificateData;
  } catch {
    return null;
  }
}

/**
 * Verifica si un certificado existe
 */
export async function certificateExists(token: string): Promise<boolean> {
  const key = `certificate:${token}`;
  const exists = await kv.exists(key);
  return exists === 1;
}

/**
 * Lista todos los certificados (para debugging/admin)
 * CUIDADO: Puede ser costoso en producción si hay muchos certificados
 */
export async function listCertificates(limit: number = 100): Promise<string[]> {
  const keys = await kv.keys('certificate:*');
  return keys.slice(0, limit);
}

/**
 * Elimina un certificado (para testing o correcciones)
 */
export async function deleteCertificate(token: string): Promise<boolean> {
  const key = `certificate:${token}`;
  const deleted = await kv.del(key);
  return deleted === 1;
}
