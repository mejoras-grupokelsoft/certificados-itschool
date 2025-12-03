// Wrapper para cargar variables de entorno antes de ejecutar el script
require('dotenv').config({ path: '.env.local' });

// Verificar variables críticas
const requiredVars = [
  'GOOGLE_SHEETS_SPREADSHEET_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('❌ Faltan variables de entorno:');
  missing.forEach(v => console.error(`   - ${v}`));
  console.error('\nAsegúrate de tener un archivo .env.local con todas las credenciales.');
  process.exit(1);
}

console.log('✅ Variables de entorno cargadas correctamente\n');

// Ejecutar el script principal
require('./test-certificates.ts');
