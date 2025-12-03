/**
 * Script de prueba para generar PNG del certificado
 */

import { getCourseConfigs } from '../lib/sheetsConfig';
import { generateSharePNG } from '../lib/generateCertificateAssets';
import type { CertificateData } from '../lib/types';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function testPNGGeneration() {
  try {
    console.log('🧪 Iniciando prueba de generación PNG...\n');
    
    // Obtener primer curso de prueba
    const courses = await getCourseConfigs();
    const testCourse = courses[0];
    
    console.log('📚 Curso de prueba:', testCourse.courseName);
    console.log('👨‍🏫 Instructor:', testCourse.instructorName);
    
    // Crear datos de certificado de prueba
    const testData: CertificateData = {
      token: 'test-token-123',
      studentName: 'María García Rodríguez',
      studentEmail: 'test@example.com',
      courseName: testCourse.courseName,
      courseId: testCourse.courseId,
      completionDate: new Date().toISOString().split('T')[0],
      instructorName: testCourse.instructorName,
      duration: 'Curso completado',
      score: 85,
      validationUrl: 'https://certificados.itschool.com.ar/validar/test-token-123',
      generatedAt: new Date().toISOString(),
    };
    
    console.log('\n🎨 Generando PNG...');
    const pngBuffer = await generateSharePNG(testData);
    
    console.log('✅ PNG generado exitosamente!');
    console.log('📊 Tamaño:', pngBuffer.length, 'bytes', `(${(pngBuffer.length / 1024).toFixed(2)} KB)`);
    
    // Guardar PNG de prueba
    const outputPath = join('C:', 'Users', 'Admin', 'Desktop', 'test-certificado.png');
    writeFileSync(outputPath, pngBuffer);
    
    console.log(`\n💾 PNG guardado en: ${outputPath}`);
    console.log('\n✅ ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error en la prueba:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testPNGGeneration();
