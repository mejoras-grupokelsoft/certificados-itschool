# 🎓 Sistema de Certificados IT School

Sistema automatizado de generación y validación de certificados digitales para cursos de IT School. Los estudiantes que completen un curso con puntaje ≥70 en el Test Final pueden obtener un certificado PDF profesional con código QR de validación.

**URL Producción**: [https://certificados.itschool.com.ar](https://certificados.itschool.com.ar)

## 🎯 Características

- ✅ **Validación automática** de estudiantes mediante Canvas LMS GraphQL API con paginación completa
- ✅ **Auto-detección del Test Final** - excluye "Trabajo Práctico" automáticamente
- 📄 **Generación de certificados PDF** con pdf-lib (~100KB) sobre template diseñado en Canva
- 🔐 **Código QR único azul (#4285F4)** en cada certificado para verificación
- 💾 **Almacenamiento permanente** en Upstash Redis (tokens determinísticos)
- 🔍 **Página de validación pública** para verificar certificados
- 📤 **Sistema de compartir** en redes sociales (LinkedIn, X, WhatsApp) con Web Share API
- ⚙️ **Configuración simple** mediante Google Sheets (3 columnas: CourseID, CourseName, InstructorName)
- 🌐 **Completamente serverless** (Netlify + Upstash + Google Sheets)
- 💰 **Costo $0** - todo en tiers gratuitos

## 🚀 Stack Tecnológico

- **Framework**: Next.js 16.0.3 (App Router + Turbopack)
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4
- **PDF**: pdf-lib 1.17.1 (generación de PDF liviana)
- **QR Codes**: qrcode 1.5.4
- **Base de datos**: Upstash Redis (256MB gratis)
- **Configuración**: Google Sheets API (Service Account)
- **API externa**: Canvas LMS GraphQL (graphql-request 7.3.4)
- **Deploy**: Netlify con @netlify/plugin-nextjs 5.14.7
- **React**: 19.2.1 (con parche de seguridad)

## 📋 Prerequisitos

Antes de empezar, asegúrate de tener:

1. **Node.js 20+** y **npm** instalados ([Descargar Node.js](https://nodejs.org/))
2. **Git** instalado ([Descargar Git](https://git-scm.com/))
3. **Cuenta de Netlify** (gratis) - [Registrarse](https://app.netlify.com/signup)
4. **Cuenta de Upstash** (Redis gratis - 256MB) - [Registrarse](https://console.upstash.com/)
5. **Canvas API Token** con permisos de lectura (consultar con IT School)
6. **Google Service Account** con acceso a Google Sheets API (consultar con IT School)
7. **Editor de código** (recomendado: VS Code)

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/mejoras-grupokelsoft/certificados-itschool.git
cd certificados-itschool
```

### 2. Instalar dependencias

```bash
npm install
```

**Nota**: Si ves warnings sobre versiones de npm, son informativos y no afectan el funcionamiento.

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# Canvas API
CANVAS_BASE_URL=https://canvas.instructure.com/api/graphql
CANVAS_API_TOKEN=tu_token_canvas

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_key\n-----END PRIVATE KEY-----\n"

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu_token_aqui

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Configurar Google Sheets

Crea una hoja llamada **"Configuracion"** con esta estructura **SIMPLE (solo 3 columnas)**:

| CourseID | CourseName | InstructorName |
|----------|------------|----------------|
| 12112663 | Optimización de procesos con herramientas de IA | Morena Caparrós |
| 123456   | Python I   | Juan Pérez     |
| 234567   | JavaScript | María García   |

**Columnas requeridas:**
- `CourseID`: ID del curso en Canvas (primera columna, fila 2 en adelante)
- `CourseName`: Nombre del curso para el certificado
- `InstructorName`: Nombre del instructor para la firma

**Notas importantes:**
- ✅ **Puntaje mínimo fijo: 70** (hardcodeado en el sistema)
- ✅ **Auto-detección del Test Final**: busca automáticamente assignments con "Test Final"/"Examen Final"
- ✅ **Excluye Trabajos Prácticos**: ignora assignments con "Trabajo Práctico"/"TP Final"
- ⚠️ Cache de 5 minutos en memoria para reducir llamadas a Google Sheets API

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 🚢 Deploy en Netlify + Upstash

### Paso 1: Crear base de datos en Upstash

1. Ve a https://upstash.com → Sign up con GitHub
2. Console → **Create Database**
3. Configuración:
   - Name: `certificados-itschool`
   - Type: **Redis**
   - Region: **us-east-1** (o la más cercana)
   - Plan: **Free**
4. Click **Create**
5. En tu database → **REST API** tab → Copia:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Paso 2: Deploy en Netlify

1. Ve a https://netlify.com → Login con GitHub
2. **Add new site** → **Import an existing project**
3. Conecta con **GitHub**
4. Selecciona: `mejoras-grupokelsoft/certificados-itschool`
5. Configuración automática (detecta Next.js):
   - Build command: `npm run build`
   - Publish directory: `.next`
6. **ANTES de Deploy**, agrega estas **Environment Variables**:

```env
CANVAS_BASE_URL=https://canvas.instructure.com/api/graphql
CANVAS_API_TOKEN=tu_token_canvas
GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=python-sheets@canvas-427419.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\ntu_key_completa\n-----END PRIVATE KEY-----\n
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu_token_upstash
NEXT_PUBLIC_BASE_URL=https://certificadositschool.netlify.app
```

7. Click **Deploy site**

### Paso 3: Configurar dominio custom (Opcional)

1. En Netlify → **Domain management** → **Add custom domain**
2. Ingresa: `certificados.itschool.com.ar`
3. En tu proveedor de DNS, agrega:
   ```
   CNAME: certificados → certificadositschool.netlify.app
   ```
4. Actualiza variable en Netlify:
   ```
   NEXT_PUBLIC_BASE_URL=https://certificados.itschool.com.ar
   ```
5. SSL automático en 5-10 minutos ✅

## 📖 Uso

### Para estudiantes

1. Ir a `https://certificadositschool.netlify.app/curso/[COURSE_ID]`
2. Ingresar email registrado en Canvas
3. El sistema valida automáticamente:
   - ✅ Estudiante inscrito en el curso
   - ✅ Examen final entregado y calificado
   - ✅ Puntaje ≥ mínimo requerido
4. Genera certificado PDF con QR code
5. Descarga inmediata

### Validar certificados

1. Escanear QR del certificado
2. O visitar: `https://certificadositschool.netlify.app/validar/[TOKEN]`
3. Muestra toda la información verificada

## 🏗️ Arquitectura

```
certificados-itschool/
├── app/
│   ├── page.tsx                          # Página de inicio (placeholder)
│   ├── curso/[courseId]/page.tsx         # Solicitar certificado (formulario)
│   ├── cursos/page.tsx                   # Listado de todos los cursos
│   ├── validar/[token]/page.tsx          # Validación pública con logo ITSCHOOL
│   └── api/
│       ├── validate/route.ts             # Validar estudiante + Canvas (3-step)
│       ├── courses/route.ts              # Listar todos los cursos habilitados
│       └── certificate/
│           ├── route.ts                  # Crear certificado (POST)
│           ├── [token]/route.ts          # Descargar PDF (GET)
│           └── validate/[token]/route.ts # Info certificado para validación
├── lib/
│   ├── types.ts                          # Tipos TypeScript (CertificateData, etc.)
│   ├── canvasAPI.ts                      # Canvas GraphQL con paginación completa
│   ├── sheetsConfig.ts                   # Google Sheets con cache de 5 min
│   ├── certificateStorage.ts             # Upstash Redis (tokens SHA-256)
│   ├── pdfGenerator.ts                   # Generación PDF con pdf-lib
│   ├── certificateTemplateV2.pdf         # Template diseñado en Canva (A4 landscape)
│   ├── rocket-icon.png                   # Ícono de cohete (35x35pts)
│   └── Logo Original a color.svg         # Logo ITSCHOOL (para UI)
├── scripts/
│   ├── test-certificates.ts              # Script para testing masivo de PDFs
│   └── run-test-certificates.js          # Wrapper para ejecutar tests
├── netlify.toml                          # Config de Netlify + plugin Next.js
├── .env.local.example                    # Template de variables de entorno
└── README.md
```

## 🔑 APIs

### POST /api/validate
Valida si estudiante puede obtener certificado.

**Request:**
```json
{
  "courseId": "12112663",
  "studentEmail": "estudiante@example.com"
}
```

**Response exitosa:**
```json
{
  "success": true,
  "message": "Estudiante validado correctamente",
  "studentName": "Juan Pérez",
  "studentEmail": "estudiante@example.com",
  "courseName": "Python I",
  "score": 95,
  "courseConfig": {
    "courseId": "12112663",
    "courseName": "Python I",
    "instructorName": "Juan Pérez"
  }
}
```

**Errores comunes:**
- `400`: Puntaje < 70 → "Te falta alcanzar el puntaje mínimo para aprobar el Test Final"
- `400`: Test no calificado → "Aún no finalizaste el curso"
- `400`: Estudiante no inscrito → "No estás inscrito en este curso"
- `404`: Curso no configurado → "Curso no encontrado o no habilitado para certificados"

### POST /api/certificate
Genera certificado para estudiante validado.

**Request:**
```json
{
  "studentName": "Juan Pérez",
  "studentEmail": "estudiante@example.com",
  "courseName": "Python I",
  "courseId": "12112663",
  "instructorName": "Juan Pérez",
  "score": 95
}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificado generado exitosamente",
  "certificateUrl": "https://certificados.itschool.com.ar/api/certificate/a3f5...",
  "token": "a3f51b2c8d...",
  "validationUrl": "https://certificados.itschool.com.ar/validar/a3f5...",
  "existing": false
}
```

**Nota**: Mismo estudiante + curso = mismo token (idempotente). `existing: true` si ya existía.

### GET /api/certificate/[token]
Descarga PDF del certificado con nombre descriptivo: `Certificado-CourseName-StudentName.pdf`

### GET /api/certificate/validate/[token]
Obtiene información del certificado (para página de validación).

**Response:**
```json
{
  "token": "a3f51b2c8d...",
  "studentName": "Juan Pérez",
  "courseName": "Python I",
  "completionDate": "2025-12-02",
  "instructorName": "Juan Pérez",
  "generatedAt": "2025-12-02T15:30:00.000Z"
}
```

### GET /api/courses
Lista todos los cursos habilitados para certificados.

**Response:**
```json
[
  {
    "courseId": "12112663",
    "courseName": "Optimización de procesos con herramientas de IA",
    "instructorName": "Morena Caparrós"
  }
]
```

## 📊 Capacidad y Límites

**Netlify Free Tier:**
- ✅ 100 GB bandwidth/mes
- ✅ 300 minutos build/mes
- ✅ Funciones serverless ilimitadas

**Upstash Redis Free:**
- ✅ 256 MB storage (~512,000 certificados)
- ✅ 10,000 comandos/día
- ✅ 100 MB bandwidth/mes

**Canvas API:**
- 3,000 requests/hora

**Google Sheets API:**
- 60 reads/minuto (con cache de 5 min)

## 🔧 Mantenimiento

### Ver logs en Netlify
```
Site → Functions → Ver logs en tiempo real
```

### Limpiar cache de configuración
El cache se actualiza automáticamente cada 5 minutos. No requiere acción manual.

### Troubleshooting

**Error: "Test Final no encontrado"**
- Verifica que el curso tenga un assignment con "Test Final"/"Examen Final" en el nombre
- El sistema **excluye automáticamente** "Trabajo Práctico"/"TP Final"
- Patrón de búsqueda: case-insensitive, busca en todos los assignments del curso

**Error: "Estudiante no encontrado" (pero SÍ está inscrito)**
- **Paginación**: El sistema busca en TODAS las páginas de enrollments (100 por página)
- Si hay 200+ estudiantes, el sistema sigue buscando hasta encontrar el email
- Verifica que el email en Canvas coincida exactamente (case-insensitive)

**Error: "Aún no finalizaste el curso"**
- El Test Final debe estar **calificado** (`gradedAt` no null)
- El puntaje debe ser **≥ 70**
- El sistema busca la submission en TODAS las páginas (100 por página)

**Error: "Error al leer Google Sheets"**
- Verifica que la hoja se llame exactamente **"Configuracion"** (sin tilde)
- Comprueba que el Service Account tenga acceso de lectura
- Solo 3 columnas: CourseID, CourseName, InstructorName

**Certificado no se genera**
- Revisa los logs en Netlify Functions (buscar emoji 🚀🚀🚀 para ver versión)
- Verifica que `certificateTemplateV2.pdf` exista en `lib/`
- Verifica que `rocket-icon.png` exista en `lib/`
- Comprueba conexión con Upstash Redis

**PDF con texto cortado o mal posicionado**
- Las coordenadas están en CM convertidas a puntos (1cm = 28.35pts)
- Template es A4 landscape: 842.25 x 595.5 pts
- Origen en pdf-lib: esquina inferior izquierda
- Para ajustar: edita `lib/pdfGenerator.ts` (función `cmToPts()`)

### Testing local

```powershell
# Ejecutar dev server
npm run dev

# Probar certificados masivamente (genera PDFs en carpeta externa)
npm run test:certificates

# Probar generación de PNG (si se implementa en el futuro)
npm run test:png
```

### Modificar diseño del certificado

1. Diseña en Canva (A4 Landscape 297mm x 210mm)
2. Deja espacios en blanco para: título del curso, nombre del estudiante, instructor, QR
3. Exporta como PDF → guarda como `lib/certificateTemplateV2.pdf`
4. Ajusta coordenadas en `lib/pdfGenerator.ts`:
   - Usa función `cmToPts()` para convertir medidas de Canva
   - Color azul corporativo: `#4285F4` (rgb(0.259, 0.522, 0.957))
   - Fuentes: HelveticaBold (títulos), Helvetica (texto regular)
5. Prueba con `npm run test:certificates`

## 📧 Herramienta de Extracción de Emails

El proyecto incluye un script para convertir archivos MBOX (exports de Gmail) en documentos Markdown legibles para el área de negocios.

### ¿Qué hace?

Transforma un archivo `.mbox` (export de correos de Gmail/Google Takeout) en un documento Markdown limpio y organizado con:

- ✅ **Hilos de conversación** agrupados por asunto
- ✅ **Metadata clara**: Fecha, De, Para, CC
- ✅ **Detección de archivos adjuntos** (lista nombres y tipos, aunque el MBOX no incluye los archivos)
- ✅ **Limpieza automática**: Remueve HTML, código base64, headers técnicos
- ✅ **Codificación UTF-8 corregida**: Arregla caracteres mal decodificados (Ã³ → ó, Ã± → ñ)
- ✅ **Ordenado por fecha**: Más recientes primero

### Cómo usar

1. **Exportar tus emails de Gmail**:
   - Ve a [Google Takeout](https://takeout.google.com/)
   - Selecciona solo "Correo" (Mail)
   - Descarga el archivo `.zip`
   - Extrae y busca el archivo `.mbox`

2. **Ejecutar el script**:

```powershell
# Windows PowerShell
npm run extract:emails "C:\ruta\a\tu\archivo.mbox"

# Ejemplo real
npm run extract:emails "C:\Users\Admin\Downloads\takeout-20251205T150758Z-3-001\Takeout\Correo electrónico\JCR.mbox"
```

3. **Ver el resultado**:
   - Se genera `resumen-correos.md` en la raíz del proyecto
   - Contiene todos los correos organizados y limpios
   - Listo para compartir con el equipo

### Formato del documento generado

```markdown
# Resumen de Correos Electrónicos

**Fecha de generación:** 5/12/2025
**Total de hilos de conversación:** 40

---

## 1. Factura de NOVIEMBRE 2025 Juan Carlos Romero

**Participantes:** Juan Romero, Proveedores NetKEL, Marca Personal
**Cantidad de mensajes:** 2

---

### Mensaje 1 - 1 de diciembre de 2025, 05:33 p. m.

**De:** Juan Carlos Romero
**Para:** Proveedores NetKEL
**CC:** Marca Personal

**📎 Archivos adjuntos (2):**
- Factura-Nov-2025.pdf (application/pdf)
- Recibo.pdf (application/pdf)

**Contenido:**

Saludos,

Les hago llegar las facturas del mes de NOVIEMBRE de 2025.
...
```

### Notas importantes

- ⚠️ El archivo MBOX **NO incluye los archivos adjuntos reales** (PDFs, imágenes)
- ✅ Solo lista los metadatos (nombre del archivo, tipo)
- ✅ Los archivos adjuntos pueden estar en otra carpeta del Takeout o no estar incluidos
- ✅ El script es útil para revisar conversaciones y saber qué adjuntos buscar

### Troubleshooting

**Error: "Faltan variables de entorno"**
```powershell
# En Windows, usa:
$env:DOTENV_CONFIG_PATH='.env.local'; npm run extract:emails "ruta\archivo.mbox"
```

**El documento se ve raro o tiene caracteres extraños**
- Verifica que el archivo MBOX esté en UTF-8
- El script ya incluye correcciones automáticas para la mayoría de encodings

**No detecta todos los adjuntos**
- Algunos formatos de MBOX pueden variar
- Revisa manualmente las carpetas del Takeout para archivos adjuntos

## 📞 Soporte

- 📧 Email: soporte@itschool.com.ar
- 🌐 Web: [www.itschool.com.ar](https://www.itschool.com.ar)
- 💬 Issues: [GitHub Issues](https://github.com/mejoras-grupokelsoft/certificados-itschool/issues)

## 👥 Equipo

**Grupo KELSOFT** - Desarrollo y mantenimiento

## 📄 Licencia

© 2024 IT School - Todos los derechos reservados

---

**Desarrollado para IT School** - Sistema de Certificados Digitales v1.0

Deployed on Netlify + Upstash Redis
