import { google } from 'googleapis';
import type { CourseConfig } from './types';

const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const GOOGLE_SHEETS_SPREADSHEET_ID_SEC = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_SEC;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!GOOGLE_SHEETS_SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  throw new Error('Faltan variables de entorno de Google Sheets');
}

/**
 * Detecta si un curso es de la variante SEC por su nombre
 * Los cursos SEC tienen el sufijo "- SEC" en su nombre
 */
export function isSECCourse(courseName: string): boolean {
  return courseName.trim().endsWith('- SEC');
}

/**
 * Remueve el sufijo "- SEC" del nombre del curso
 * Usado para mostrar el nombre limpio en el certificado
 */
export function removeSECSuffix(courseName: string): string {
  return courseName.replace(/\s*-\s*SEC\s*$/i, '').trim();
}

// Configurar cliente de Google Sheets con permisos de lectura Y escritura
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Permisos completos
});

const sheets = google.sheets({ version: 'v4', auth });

// Cache en memoria para reducir llamadas a Google Sheets
let configCache: CourseConfig[] | null = null;
let cacheTimestamp: number = 0;
// Cache separado para cursos SEC
let configCacheSEC: CourseConfig[] | null = null;
let cacheTimestampSEC: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene la configuración de todos los cursos desde Google Sheets
 * Estructura esperada de la hoja "Configuracion":
 * 
 * | CourseID | CourseName | InstructorName |
 * |----------|------------|----------------|
 * | 123456   | Python I   | Juan Pérez     |
 * | 234567   | JavaScript | María García   |
 * 
 * PassingScore fijo: 70 puntos
 * Duration: Se calcula automáticamente desde Canvas
 * 
 * @param isSEC - Si true, consulta el spreadsheet SEC, si false consulta el estándar
 */
export async function getCourseConfigs(isSEC: boolean = false): Promise<CourseConfig[]> {
  // Retornar cache si aún es válido
  const now = Date.now();
  const cache = isSEC ? configCacheSEC : configCache;
  const timestamp = isSEC ? cacheTimestampSEC : cacheTimestamp;
  
  if (cache && now - timestamp < CACHE_DURATION) {
    console.log(`📋 Usando cache ${isSEC ? 'SEC' : 'estándar'} válido`);
    return cache;
  }

  try {
    const spreadsheetId = isSEC ? GOOGLE_SHEETS_SPREADSHEET_ID_SEC : GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error(`Falta variable de entorno GOOGLE_SHEETS_SPREADSHEET_ID${isSEC ? '_SEC' : ''}`);
    }
    
    console.log(`📋 Consultando Google Sheets ${isSEC ? 'SEC' : 'estándar'}`);
    console.log(`📋 Spreadsheet ID completo: ${spreadsheetId}`);
    console.log(`📋 Rango: Configuracion!A2:C`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Configuracion!A2:C', // Solo 3 columnas: CourseID, CourseName, InstructorName
    });

    const rows = response.data.values || [];
    
    const configs: CourseConfig[] = rows
      .filter((row) => row.length >= 3) // Filtrar filas con datos completos
      .map((row) => ({
        courseId: row[0]?.trim() || '',
        courseName: row[1]?.trim() || '',
        instructorName: row[2]?.trim() || '',
      }))
      .filter((config) => config.courseId && config.courseName && config.instructorName);

    // Actualizar cache correspondiente
    if (isSEC) {
      configCacheSEC = configs;
      cacheTimestampSEC = now;
    } else {
      configCache = configs;
      cacheTimestamp = now;
    }

    console.log(`✅ Configuración ${isSEC ? 'SEC' : 'estándar'} cargada: ${configs.length} cursos`);
    return configs;
  } catch (error) {
    console.error(`❌ Error leyendo configuración de Google Sheets ${isSEC ? 'SEC' : 'estándar'}:`, error);
    
    // Si hay cache anterior, retornarlo aunque esté vencido
    if (cache) {
      console.warn(`⚠️ Usando cache ${isSEC ? 'SEC' : 'estándar'} vencido debido a error`);
      return cache;
    }
    
    throw new Error(`Error al leer configuración de Google Sheets ${isSEC ? 'SEC' : 'estándar'}`);
  }
}

/**
 * Obtiene la configuración de un curso específico por su ID
 * Busca automáticamente en el spreadsheet correcto (estándar o SEC)
 * detectando el sufijo "- SEC" en el nombre del curso
 */
export async function getCourseConfig(courseId: string): Promise<CourseConfig | null> {
  // Primero buscar en configuración estándar
  console.log('🔍 Buscando curso', courseId, 'en configuración estándar...');
  let configs = await getCourseConfigs(false);
  let config = configs.find((config) => config.courseId === courseId);
  
  if (config) {
    console.log('✅ Curso encontrado en configuración estándar:', config.courseName);
    return config;
  }
  
  // Si no se encuentra, buscar en configuración SEC
  console.log('🔍 Curso no encontrado en estándar, buscando en configuración SEC...');
  configs = await getCourseConfigs(true);
  config = configs.find((config) => config.courseId === courseId);
  
  if (config) {
    console.log('✅ Curso encontrado en configuración SEC:', config.courseName);
  } else {
    console.log('❌ Curso no encontrado en ninguna configuración');
  }
  
  return config || null;
}

/**
 * Obtiene todos los cursos disponibles (alias para getCourseConfigs)
 * Útil para listar todos los cursos en la interfaz
 */
export async function getAllCourses(): Promise<CourseConfig[]> {
  return getCourseConfigs();
}

/**
 * Invalida el cache de configuración (útil para testing o forzar recarga)
 */
export function clearConfigCache(): void {
  configCache = null;
  cacheTimestamp = 0;
  configCacheSEC = null;
  cacheTimestampSEC = 0;
  console.log('🧹 Cache limpiado (estándar y SEC)');
}

/**
 * Interfaz para los datos del certificado a guardar en Sheets
 */
interface CertificateSheetData {
  hash: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  isSEC?: boolean; // Si true, guarda en el spreadsheet SEC
}

/**
 * Obtiene el próximo ID disponible leyendo solo las filas con datos reales.
 * Ignora filas vacías con formato para no contar celdas vacías como ocupadas.
 */
async function getNextCertificateId(spreadsheetId: string): Promise<number> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Certificados!A2:B', // Columnas A (ID) y B (Hash)
  });
  const rows = (response.data.values || []).filter(row => row[1] && row[1].trim() !== '');
  if (rows.length === 0) return 1;
  const lastId = parseInt(rows[rows.length - 1][0], 10);
  return isNaN(lastId) ? rows.length + 1 : lastId + 1;
}

/**
 * Verifica si un certificado ya existe en la hoja por su hash.
 */
async function certificateExistsInSheet(hash: string, spreadsheetId: string): Promise<boolean> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Certificados!B2:B',
  });
  return (response.data.values || []).some(row => row[0] === hash);
}

/**
 * Guarda un nuevo certificado en la hoja "Certificados".
 * Columnas: ID | Hash | Nombre y apellido | Mail | Curso
 *
 * Usa batchUpdate para escribir exactamente en la primera fila vacía real
 * (leyendo cuántas filas con datos hay), evitando el problema de que
 * append inserte en fila 1001 cuando hay formato aplicado a celdas vacías.
 *
 * Si isSEC=true, escribe en GOOGLE_SHEETS_SPREADSHEET_ID_SEC.
 * Si isSEC=false (default), escribe en GOOGLE_SHEETS_SPREADSHEET_ID.
 *
 * @returns true si se guardó exitosamente, false si ya existía o hubo error
 */
export async function saveCertificateToSheet(data: CertificateSheetData): Promise<boolean> {
  const isSEC = data.isSEC === true;
  const spreadsheetId = isSEC ? GOOGLE_SHEETS_SPREADSHEET_ID_SEC : GOOGLE_SHEETS_SPREADSHEET_ID;
  const label = isSEC ? 'SEC' : 'ITSCHOOL';

  console.log(`📋 [Sheets] Guardando certificado en hoja ${label}:`, { hash: data.hash.slice(0, 10) + '...', studentName: data.studentName });
  console.log('📋 [Sheets] Spreadsheet ID:', spreadsheetId?.slice(0, 10) + '...');

  if (!spreadsheetId) {
    console.error(`❌ [Sheets] Falta variable GOOGLE_SHEETS_SPREADSHEET_ID${isSEC ? '_SEC' : ''}, no se puede guardar`);
    return false;
  }

  try {
    // Verificar duplicado
    const exists = await certificateExistsInSheet(data.hash, spreadsheetId);
    if (exists) {
      console.log('📋 Certificado ya existe en Sheets, no se duplica:', data.hash);
      return false;
    }

    // Obtener siguiente ID y calcular fila destino (encabezado en fila 1, datos desde fila 2)
    const nextId = await getNextCertificateId(spreadsheetId);
    const targetRow = nextId + 1; // fila 2 = ID 1, fila 3 = ID 2, etc.

    console.log(`📋 [Sheets] Escribiendo en fila ${targetRow} (ID ${nextId})`);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Certificados!A${targetRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[nextId.toString(), data.hash, data.studentName, data.studentEmail, data.courseName]],
      },
    });

    console.log(`✅ Certificado guardado en Sheets ${label}: { id: ${nextId}, fila: ${targetRow} }`);
    return true;
  } catch (error) {
    console.error(`❌ Error guardando certificado en Sheets ${label}:`, error);
    return false;
  }
}
