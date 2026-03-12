/**
 * Script de backfill: Supabase → Google Sheets "Certificados"
 *
 * Lee TODOS los certificados de Supabase y los escribe en la hoja
 * "Certificados" correcta (ITSCHOOL o SEC), evitando duplicados.
 *
 * Uso:
 *   npx cross-env DOTENV_CONFIG_PATH=.env.local tsx -r dotenv/config scripts/backfill-sheets-from-supabase.ts
 *
 * Flags opcionales:
 *   --dry-run    Solo muestra lo que escribiría, sin modificar Sheets
 *   --sec-only   Solo procesa certificados SEC
 *   --std-only   Solo procesa certificados ITSCHOOL (estándar)
 */

import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const DRY_RUN = process.argv.includes('--dry-run');
const SEC_ONLY = process.argv.includes('--sec-only');
const STD_ONLY = process.argv.includes('--std-only');

// ─── Supabase ────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Google Sheets ────────────────────────────────────────────────────────────
const SPREADSHEET_ID_STD = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
const SPREADSHEET_ID_SEC = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_SEC!;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')!;

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getExistingHashes(spreadsheetId: string): Promise<Set<string>> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Certificados!B:B',
    });
    const rows = response.data.values || [];
    const hashes = new Set<string>();
    for (const row of rows) {
      if (row[0] && row[0] !== 'Hash') hashes.add(row[0]);
    }
    return hashes;
  } catch (err) {
    console.error('⚠️ Error leyendo hashes existentes:', err);
    return new Set();
  }
}

async function getNextId(spreadsheetId: string): Promise<number> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Certificados!A:A',
    });
    const rows = response.data.values || [];
    if (rows.length <= 1) return 1;
    const lastId = parseInt(rows[rows.length - 1][0], 10);
    return isNaN(lastId) ? 1 : lastId + 1;
  } catch {
    return 1;
  }
}

async function appendRows(spreadsheetId: string, rows: string[][]): Promise<void> {
  if (DRY_RUN) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Certificados!A:E',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Iniciando backfill Supabase → Google Sheets...');
  if (DRY_RUN) console.log('⚠️  MODO DRY-RUN: no se escribirá nada en Sheets\n');

  // 1. Leer TODOS los certificados de Supabase (paginado de 1000 en 1000)
  let allCerts: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('certificates')
      .select('token, student_name, student_email, course_name, institution, generated_at')
      .order('generated_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('❌ Error leyendo Supabase:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allCerts = allCerts.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`📊 Total certificados en Supabase: ${allCerts.length}`);

  // Separar en estándar y SEC
  const stdCerts = allCerts.filter(c => (c.institution || 'ITSCHOOL') !== 'SEC');
  const secCerts = allCerts.filter(c => c.institution === 'SEC');

  console.log(`   → ITSCHOOL (estándar): ${stdCerts.length}`);
  console.log(`   → SEC:                 ${secCerts.length}\n`);

  // 2. Procesar hoja ITSCHOOL
  if (!SEC_ONLY) {
    if (!SPREADSHEET_ID_STD) {
      console.error('❌ Falta GOOGLE_SHEETS_SPREADSHEET_ID, saltando hoja estándar');
    } else {
      console.log('📋 Procesando hoja ITSCHOOL...');
      const existing = await getExistingHashes(SPREADSHEET_ID_STD);
      console.log(`   Hashes ya presentes en Sheets: ${existing.size}`);

      const newCerts = stdCerts.filter(c => !existing.has(c.token));
      console.log(`   Certificados a agregar: ${newCerts.length}`);

      if (newCerts.length > 0) {
        let nextId = await getNextId(SPREADSHEET_ID_STD);
        const rows: string[][] = newCerts.map(c => [
          (nextId++).toString(),
          c.token,
          c.student_name,
          c.student_email,
          c.course_name,
        ]);

        if (DRY_RUN) {
          console.log('   [DRY-RUN] Primeras 3 filas que se agregarían:');
          rows.slice(0, 3).forEach(r => console.log('   ', JSON.stringify(r)));
        } else {
          // Agregar en bloques de 500 para no superar límites de Sheets API
          const BATCH = 500;
          for (let i = 0; i < rows.length; i += BATCH) {
            await appendRows(SPREADSHEET_ID_STD, rows.slice(i, i + BATCH));
            console.log(`   ✅ Escritos ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
          }
        }
      } else {
        console.log('   ✅ Hoja ITSCHOOL ya está al día');
      }
    }
  }

  // 3. Procesar hoja SEC
  if (!STD_ONLY) {
    if (!SPREADSHEET_ID_SEC) {
      console.warn('⚠️  Falta GOOGLE_SHEETS_SPREADSHEET_ID_SEC, saltando hoja SEC');
    } else {
      console.log('\n📋 Procesando hoja SEC...');
      const existing = await getExistingHashes(SPREADSHEET_ID_SEC);
      console.log(`   Hashes ya presentes en Sheets SEC: ${existing.size}`);

      const newCerts = secCerts.filter(c => !existing.has(c.token));
      console.log(`   Certificados a agregar: ${newCerts.length}`);

      if (newCerts.length > 0) {
        let nextId = await getNextId(SPREADSHEET_ID_SEC);
        const rows: string[][] = newCerts.map(c => [
          (nextId++).toString(),
          c.token,
          c.student_name,
          c.student_email,
          c.course_name.replace(/\s*-\s*SEC\s*$/i, '').trim(), // sin sufijo SEC
        ]);

        if (DRY_RUN) {
          console.log('   [DRY-RUN] Primeras 3 filas que se agregarían:');
          rows.slice(0, 3).forEach(r => console.log('   ', JSON.stringify(r)));
        } else {
          const BATCH = 500;
          for (let i = 0; i < rows.length; i += BATCH) {
            await appendRows(SPREADSHEET_ID_SEC, rows.slice(i, i + BATCH));
            console.log(`   ✅ Escritos ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
          }
        }
      } else {
        console.log('   ✅ Hoja SEC ya está al día');
      }
    }
  }

  console.log('\n🎉 Backfill completado');
}

main().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
