/**
 * Script de migración: Upstash Redis → Supabase PostgreSQL
 * 
 * Uso: npx cross-env DOTENV_CONFIG_PATH=.env.local tsx -r dotenv/config scripts/migrate-to-supabase.ts
 */

import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

// Conectar a Upstash (origen)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Conectar a Supabase (destino)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RedisCertificate {
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
  institution?: string;
  issueDate?: string;
  hasBeenDownloaded?: boolean;
  firstDownloadAt?: string;
  hasAcceptedCommitment?: boolean;
  commitmentAcceptedAt?: string;
}

async function migrate() {
  console.log('🚀 Iniciando migración Upstash → Supabase...\n');

  // 1. Obtener todas las keys de certificados desde Redis
  console.log('🔍 Buscando certificados en Upstash...');
  const keys = await redis.keys('certificate:*');
  console.log(`📊 Encontrados: ${keys.length} certificados\n`);

  if (keys.length === 0) {
    console.log('⚠️ No hay certificados para migrar.');
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const key of keys) {
    const token = key.replace('certificate:', '');
    
    try {
      // 2. Leer datos de Redis
      const raw = await redis.get<string>(key);
      if (!raw) {
        console.log(`⚠️ Key vacía: ${key}`);
        skipped++;
        continue;
      }

      const cert: RedisCertificate = typeof raw === 'string' ? JSON.parse(raw) : raw;

      // 3. Verificar si ya existe en Supabase (para re-runs seguros)
      const { data: existing } = await supabase
        .from('certificates')
        .select('token')
        .eq('token', token)
        .single();

      if (existing) {
        console.log(`⏭️ Ya existe: ${cert.studentName} - ${cert.courseName}`);
        skipped++;
        continue;
      }

      // 4. Insertar en Supabase
      const { error } = await supabase.from('certificates').insert({
        token: token,
        student_name: cert.studentName,
        student_email: cert.studentEmail,
        course_name: cert.courseName,
        course_id: cert.courseId,
        completion_date: cert.completionDate,
        instructor_name: cert.instructorName,
        duration: cert.duration || 'Curso completado',
        score: cert.score,
        validation_url: cert.validationUrl,
        generated_at: cert.generatedAt,
        institution: cert.institution || 'ITSCHOOL',
        has_been_downloaded: cert.hasBeenDownloaded || false,
        first_download_at: cert.firstDownloadAt || null,
        has_accepted_commitment: cert.hasAcceptedCommitment || false,
        commitment_accepted_at: cert.commitmentAcceptedAt || null,
      });

      if (error) {
        console.log(`❌ Error migrando ${cert.studentName}: ${error.message}`);
        errors++;
      } else {
        console.log(`✅ Migrado: ${cert.studentName} - ${cert.courseName}`);
        migrated++;
      }
    } catch (err) {
      console.log(`❌ Error procesando ${key}: ${err}`);
      errors++;
    }
  }

  console.log('\n📊 Resumen de migración:');
  console.log(`   ✅ Migrados: ${migrated}`);
  console.log(`   ⏭️ Saltados (ya existían): ${skipped}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`   📦 Total procesados: ${keys.length}`);

  // 5. Verificar conteo en Supabase
  const { count } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🎯 Total certificados en Supabase: ${count}`);
  console.log('🏁 Migración completada!');
}

migrate().catch(console.error);
