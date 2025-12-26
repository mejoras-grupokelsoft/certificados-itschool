/**
 * Script para eliminar un certificado de Redis
 * Uso: npx tsx scripts/delete-certificate.ts <token>
 */

import { deleteCertificate } from '../lib/certificateStorage';

const token = process.argv[2];

if (!token) {
  console.error('❌ Error: Debes proporcionar un token');
  console.log('Uso: npx tsx scripts/delete-certificate.ts <token>');
  process.exit(1);
}

console.log(`🗑️ Eliminando certificado con token: ${token}`);

deleteCertificate(token)
  .then((deleted) => {
    if (deleted) {
      console.log('✅ Certificado eliminado exitosamente');
    } else {
      console.log('⚠️ Certificado no encontrado');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error eliminando certificado:', error);
    process.exit(1);
  });
