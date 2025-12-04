import { google } from 'googleapis';
import type { CourseConfig } from './types';

const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!GOOGLE_SHEETS_SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  throw new Error('Faltan variables de entorno de Google Sheets');
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
 */
export async function getCourseConfigs(): Promise<CourseConfig[]> {
  // Retornar cache si aún es válido
  const now = Date.now();
  if (configCache && now - cacheTimestamp < CACHE_DURATION) {
    return configCache;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
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

    // Actualizar cache
    configCache = configs;
    cacheTimestamp = now;

    return configs;
  } catch (error) {
    console.error('Error leyendo configuración de Google Sheets:', error);
    
    // Si hay cache anterior, retornarlo aunque esté vencido
    if (configCache) {
      console.warn('Usando cache vencido debido a error');
      return configCache;
    }
    
    throw new Error('Error al leer configuración de Google Sheets');
  }
}

/**
 * Obtiene la configuración de un curso específico por su ID
 */
export async function getCourseConfig(courseId: string): Promise<CourseConfig | null> {
  const configs = await getCourseConfigs();
  return configs.find((config) => config.courseId === courseId) || null;
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
}

/**
 * Interfaz para los datos del certificado a guardar en Sheets
 */
interface CertificateSheetData {
  hash: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
}

/**
 * Obtiene el próximo ID disponible para certificados
 */
async function getNextCertificateId(): Promise<number> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Certificados!A:A', // Solo columna A (IDs)
    });

    const rows = response.data.values || [];
    
    // Si no hay filas o solo hay header, empezar en 1
    if (rows.length <= 1) {
      return 1;
    }
    
    // Obtener el último ID y sumar 1
    const lastId = parseInt(rows[rows.length - 1][0], 10);
    return isNaN(lastId) ? 1 : lastId + 1;
  } catch (error) {
    console.error('Error obteniendo siguiente ID de certificado:', error);
    return 1;
  }
}

/**
 * Verifica si un certificado ya existe en la hoja por su hash
 */
async function certificateExistsInSheet(hash: string): Promise<boolean> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Certificados!B:B', // Columna B (Hash)
    });

    const rows = response.data.values || [];
    return rows.some(row => row[0] === hash);
  } catch (error) {
    console.error('Error verificando existencia de certificado:', error);
    return false;
  }
}

/**
 * Guarda un nuevo certificado en la hoja "Certificados"
 * Columnas: ID | Hash | Nombre y apellido | Mail | Curso
 * 
 * @returns true si se guardó exitosamente, false si ya existía o hubo error
 */
export async function saveCertificateToSheet(data: CertificateSheetData): Promise<boolean> {
  console.log('📋 [Sheets] Intentando guardar certificado:', { hash: data.hash.slice(0, 10) + '...', studentName: data.studentName });
  console.log('📋 [Sheets] Spreadsheet ID:', GOOGLE_SHEETS_SPREADSHEET_ID?.slice(0, 10) + '...');
  
  try {
    // Verificar si ya existe
    console.log('📋 [Sheets] Verificando si certificado ya existe...');
    const exists = await certificateExistsInSheet(data.hash);
    if (exists) {
      console.log('📋 Certificado ya existe en Sheets, no se duplica:', data.hash);
      return false;
    }
    console.log('📋 [Sheets] Certificado no existe, procediendo a guardar...');

    // Obtener siguiente ID
    const nextId = await getNextCertificateId();
    console.log('📋 [Sheets] Siguiente ID:', nextId);

    // Preparar fila
    const row = [
      nextId.toString(),
      data.hash,
      data.studentName,
      data.studentEmail,
      data.courseName,
    ];

    // Agregar fila a la hoja
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Certificados!A:E',
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    console.log('✅ Certificado guardado en Sheets:', { id: nextId, hash: data.hash });
    return true;
  } catch (error) {
    console.error('❌ Error guardando certificado en Sheets:', error);
    return false;
  }
}
