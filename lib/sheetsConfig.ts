import { google } from 'googleapis';
import type { CourseConfig } from './types';

const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!GOOGLE_SHEETS_SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  throw new Error('Faltan variables de entorno de Google Sheets');
}

// Configurar cliente de Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
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
 * Invalida el cache de configuración (útil para testing o forzar recarga)
 */
export function clearConfigCache(): void {
  configCache = null;
  cacheTimestamp = 0;
}

/**
 * Verifica si un curso está habilitado para generar certificados
 */
export async function isCourseEnabled(courseId: string): Promise<boolean> {
  const config = await getCourseConfig(courseId);
  return config !== null && config.enabled;
}
