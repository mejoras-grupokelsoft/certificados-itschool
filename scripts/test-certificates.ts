/**
 * Script para generar certificados de prueba para todos los cursos configurados
 * 
 * Uso: npm run test:certificates
 * 
 * Este script:
 * 1. Lee todos los cursos de Google Sheets
 * 2. Genera un certificado de prueba para cada curso
 * 3. Guarda los PDFs en public/test-certificates/
 * 4. Genera un index.json con metadata de todos los certificados
 * 
 * Nota: Las variables de entorno se cargan automáticamente vía -r dotenv/config
 */

import { generatePDF } from '../lib/pdfGenerator';
import { getCourseConfigs } from '../lib/sheetsConfig';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { CertificateData } from '../lib/types';

const OUTPUT_DIR = 'C:\\Users\\Admin\\Desktop\\test certificados';
const TEST_STUDENT_NAME = 'María García Rodríguez';
const TEST_VALIDATION_URL = 'https://certificados.itschool.com.ar/validar/test-token-12345';

async function main() {
  console.log('🚀 Iniciando generación de certificados de prueba...\n');

  // Crear directorio de salida si no existe
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Directorio creado: ${OUTPUT_DIR}\n`);
  }

  try {
    // Obtener todos los cursos de Google Sheets
    console.log('📊 Obteniendo configuración de cursos desde Google Sheets...');
    const courses = await getCourseConfigs();
    console.log(`✅ ${courses.length} cursos encontrados\n`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Generar certificado para cada curso
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const progress = `[${i + 1}/${courses.length}]`;

      console.log(`${progress} Generando certificado para: "${course.courseName}"`);
      console.log(`   📚 Curso ID: ${course.courseId}`);
      console.log(`   👨‍🏫 Instructor: ${course.instructorName}`);

      try {
        // Crear datos de certificado de prueba
        const certificateData: CertificateData = {
          studentName: TEST_STUDENT_NAME,
          studentEmail: 'test@example.com',
          courseId: course.courseId,
          courseName: course.courseName,
          instructorName: course.instructorName,
          completionDate: new Date().toISOString().split('T')[0],
          duration: 'Curso completo',
          score: 95,
          generatedAt: new Date().toISOString(),
          validationUrl: TEST_VALIDATION_URL,
          token: `test-${course.courseId}`,
        };

        // Generar PDF
        const pdfBytes = await generatePDF(certificateData);

        // Guardar PDF
        const filename = `${course.courseId}.pdf`;
        const filepath = join(OUTPUT_DIR, filename);
        writeFileSync(filepath, pdfBytes);

        console.log(`   ✅ PDF generado: ${filename} (${(pdfBytes.length / 1024).toFixed(2)} KB)\n`);

        results.push({
          courseId: course.courseId,
          courseName: course.courseName,
          instructorName: course.instructorName,
          filename,
          size: pdfBytes.length,
          success: true,
        });

        successCount++;
      } catch (error) {
        console.error(`   ❌ Error generando certificado: ${error instanceof Error ? error.message : String(error)}\n`);
        
        results.push({
          courseId: course.courseId,
          courseName: course.courseName,
          instructorName: course.instructorName,
          filename: null,
          size: 0,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });

        errorCount++;
      }
    }

    // Guardar metadata
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalCourses: courses.length,
      successCount,
      errorCount,
      testStudent: TEST_STUDENT_NAME,
      results,
    };

    const metadataPath = join(OUTPUT_DIR, 'index.json');
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`📄 Metadata guardada: ${metadataPath}\n`);

    // Resumen final
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE GENERACIÓN');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📁 Ubicación: ${OUTPUT_DIR}`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (successCount > 0) {
      console.log('🌐 Para revisar visualmente los certificados, visita:');
      console.log('   http://localhost:3000/test/gallery\n');
    }

    if (errorCount > 0) {
      console.warn('⚠️  Algunos certificados fallaron. Revisa los errores arriba.');
      process.exit(1);
    }

    console.log('🎉 ¡Todos los certificados generados exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar script
main();
