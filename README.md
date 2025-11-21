# Sistema de Certificados IT School

Sistema automatizado de generación y validación de certificados digitales para cursos de IT School. Los estudiantes que completan un curso pueden obtener un certificado PDF profesional con código QR de validación.

## 🎯 Características

- ✅ **Validación automática** de estudiantes mediante Canvas LMS GraphQL API
- ✅ **Busca automáticamente** el "Test Final" o "Examen Final" de cada curso
- 📄 **Generación de certificados PDF** profesionales con diseño personalizado
- 🔐 **Código QR único** en cada certificado para verificación de autenticidad
- 💾 **Almacenamiento permanente** en Upstash Redis
- 🔍 **Página de validación pública** para verificar certificados
- ⚙️ **Configuración simple** mediante Google Sheets (solo datos manuales)
- 🌐 **Completamente serverless** (Netlify + Upstash + Google Sheets)
- 💰 **Costo $0** - todo en tiers gratuitos

## 🚀 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **PDF**: @react-pdf/renderer
- **QR Codes**: qrcode
- **Base de datos**: Upstash Redis (256MB gratis)
- **CMS**: Google Sheets
- **API externa**: Canvas LMS GraphQL
- **Deploy**: Netlify (gratis)

## 📋 Prerequisitos

1. **Node.js 20+** instalado
2. **Cuenta de Netlify** (gratis)
3. **Cuenta de Upstash** (Redis gratis - 256MB)
4. **Canvas API Token** con permisos de lectura
5. **Google Service Account** con acceso a Google Sheets API
6. **Dominio** configurado (ej: certificados.itschool.com.ar) - Opcional

## 🛠️ Instalación Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/mejoras-grupokelsoft/certificados-itschool.git
cd certificados-itschool
```

### 2. Instalar dependencias

```bash
npm install
```

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

Crea una hoja llamada **"Configuracion"** con esta estructura SIMPLE:

| CourseID | CourseName | InstructorName | Duration | PassingScore | Enabled |
|----------|------------|----------------|----------|--------------|---------|
| 123456   | Python I   | Juan Pérez     | 3 meses  | 80           | TRUE    |
| 234567   | JavaScript | María García   | 4 meses  | 75           | TRUE    |

**Columnas:**
- `CourseID`: ID del curso en Canvas
- `CourseName`: Nombre del curso para el certificado
- `InstructorName`: Nombre del instructor para firma
- `Duration`: Duración del curso (ej: "3 meses", "40 horas")
- `PassingScore`: Puntaje mínimo requerido
- `Enabled`: TRUE o FALSE

**✨ El sistema busca automáticamente el "Test Final" o "Examen Final" - no necesitas IDs de assignments!**

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
│   ├── page.tsx                          # Página de inicio
│   ├── curso/[courseId]/page.tsx         # Solicitar certificado
│   ├── validar/[token]/page.tsx          # Validación pública
│   └── api/
│       ├── validate/route.ts             # API: Validar estudiante
│       └── certificate/
│           ├── [token]/route.ts          # API: Generar PDF
│           └── validate/[token]/route.ts # API: Info certificado
├── lib/
│   ├── types.ts                          # Tipos TypeScript
│   ├── canvasAPI.ts                      # Canvas GraphQL + auto-detect exam
│   ├── sheetsConfig.ts                   # Google Sheets
│   ├── certificateStorage.ts             # Upstash Redis
│   └── CertificadoPDF.tsx                # Componente PDF
├── netlify.toml                          # Config de Netlify
└── README.md
```

## 🔑 APIs

### POST /api/validate
Valida si estudiante puede obtener certificado.

**Request:**
```json
{
  "courseId": "123456",
  "studentEmail": "estudiante@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "studentName": "Juan Pérez",
  "courseName": "Python I",
  "score": 95
}
```

### POST /api/certificate
Genera certificado para estudiante validado.

### GET /api/certificate/[token]
Descarga PDF del certificado.

### GET /api/certificate/validate/[token]
Obtiene información del certificado (para página de validación).

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
El cache se actualiza automáticamente cada 5 minutos.

### Troubleshooting

**Error: "Test Final no encontrado"**
- Verifica que el curso tenga un assignment llamado "Test Final", "Examen Final" o "Final Exam"
- El sistema busca automáticamente por estos nombres

**Error: "Error al leer Google Sheets"**
- Verifica que la hoja se llame exactamente "Configuracion"
- Comprueba que el Service Account tenga acceso

**Certificado no se genera**
- Revisa los logs en Netlify Functions
- Verifica que Upstash Redis esté conectado

## 📞 Soporte

- 📧 Email: soporte@itschool.com.ar
- 🌐 Web: [www.itschool.com.ar](https://www.itschool.com.ar)

## 📄 Licencia

© 2024 IT School - Todos los derechos reservados

---

**Desarrollado para IT School** - Sistema de Certificados Digitales v1.0

Deployed on Netlify + Upstash Redis
