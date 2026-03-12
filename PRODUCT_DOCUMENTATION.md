# Sistema de Certificados IT School - Documentación de Producto

## 📋 Resumen Ejecutivo

Sistema automatizado de generación y validación de certificados digitales para estudiantes de IT School que completan cursos en Canvas LMS. Valida automáticamente la aprobación del estudiante, genera certificados en PDF con códigos QR únicos para validación pública, y mantiene un registro permanente de todos los certificados emitidos.

**Objetivo principal**: Eliminar el proceso manual de emisión de certificados, garantizar la autenticidad de las certificaciones, y proporcionar una forma pública de validar credenciales.

**Modelo de costos**: Completamente serverless con $0 de hosting mensual (Netlify + Upstash Redis + Google Sheets).

---

## 🎯 Problema que Resuelve

### Antes del Sistema
- Emisión manual de certificados (tiempo: ~5-10 min por certificado)
- Sin forma de validar autenticidad de certificados físicos/PDF
- Riesgo de falsificación de certificados
- No hay registro centralizado de certificados emitidos
- Proceso propenso a errores humanos (nombres incorrectos, cursos equivocados)

### Después del Sistema
- ✅ Generación automática en ~2 segundos
- ✅ Validación pública mediante código QR único
- ✅ Imposible falsificar (tokens SHA-256 de 64 caracteres)
- ✅ Registro permanente en base de datos Redis
- ✅ Validación automática de aprobación en Canvas LMS
- ✅ 100% self-service para estudiantes

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

#### **Frontend & Backend**
- **Next.js 16** (App Router)
  - Framework React con rendering híbrido (SSR + SSG)
  - Rutas API integradas (serverless functions)
  - TypeScript para type safety
  - Despliegue automático en Netlify

#### **Integración con Canvas LMS**
- **Canvas GraphQL API**
  - Validación de estudiantes en tiempo real
  - Verificación de calificaciones del Test Final
  - Paginación cursor-based para 100+ estudiantes por curso
  - Token de autenticación Bearer

#### **Almacenamiento de Datos**
- **Upstash Redis** (Storage actual - en proceso de migración)
  - Base de datos serverless en memoria
  - Almacenamiento permanente de certificados (sin TTL)
  - Keys: `certificate:{token}` con metadata completa
  - Tier gratuito: 256MB (~512k certificados)
  
- **Supabase** (Migración en progreso)
  - PostgreSQL serverless
  - Mayor capacidad de almacenamiento
  - Funcionalidades adicionales (analytics, logs)

#### **Configuración de Cursos**
- **Google Sheets API**
  - Spreadsheet como "base de datos" de configuración
  - Sheet "Configuracion" con columnas: `CourseID`, `CourseName`, `InstructorName`
  - Cache en memoria de 5 minutos para reducir API calls
  - Service Account con credenciales JSON
  - **Dos spreadsheets separados**:
    - Cursos estándar IT School
    - Cursos SEC (sindicato) con diseño de certificado diferenciado

#### **Generación de PDFs**
- **pdf-lib** (~100KB)
  - Librería lightweight para manipulación de PDFs
  - Overlay de texto sobre template pre-diseñado
  - Reemplazó a Puppeteer por problemas de bundle size en Netlify
  - Genera QR codes con token de validación

#### **Hosting & CI/CD**
- **Netlify**
  - Deploy automático desde Git (push to `main` = deploy)
  - Serverless functions (AWS Lambda bajo el capó)
  - CDN global para assets estáticos
  - HTTPS automático con certificados SSL
  - Branch deploys para testing

---

## 🔄 Flujos Principales

### 1. Flujo de Validación de Estudiante

```
Usuario → Formulario Web → API /validate → Canvas GraphQL → Google Sheets
```

**Paso a paso**:

1. **Estudiante accede a URL**: `certificados.itschool.com.ar/curso/{courseId}`
   - Ejemplo: `/curso/12112663` (ID de curso en Canvas)

2. **Ingresa email**: `alumno@example.com`

3. **Sistema busca configuración en Google Sheets**:
   - Query al spreadsheet por `courseId`
   - Obtiene: `courseName`, `instructorName`
   - Si no existe → Error 404 "Curso no encontrado"

4. **Validación en Canvas** (3 pasos críticos):

   **a) Validar inscripción del estudiante**
   - GraphQL query: `GET_COURSE_ENROLLMENTS` con paginación
   - Busca email en TODAS las páginas (100 enrollments/página)
   - **CRÍTICO**: Implementa cursor pagination (`hasNextPage` + `endCursor`)
   - Comparación case-insensitive de emails
   - Si no encontrado → Error "No estás inscrito en este curso"

   **b) Encontrar el Test Final**
   - GraphQL query: `GET_COURSE_ASSIGNMENTS`
   - Busca por patrón de nombre: "Test Final" o "Examen Final" (case-insensitive)
   - **Excluye explícitamente**: "Trabajo Práctico", "TP Final" (son opcionales)
   - Auto-detección por nombre (no usa IDs hardcodeados)
   - Si no encontrado → Error interno

   **c) Verificar aprobación**
   - GraphQL query: `GET_ASSIGNMENT_SUBMISSIONS` con paginación
   - Busca submission del estudiante en TODAS las páginas
   - Valida dos condiciones:
     - `gradedAt !== null` (la tarea fue calificada)
     - `score >= 70` (puntaje mínimo de aprobación)
   - Si falla → Error "Te falta alcanzar el puntaje mínimo" o "Aún no finalizaste el curso"

5. **Respuesta exitosa**:
   ```json
   {
     "valid": true,
     "studentName": "Juan Pérez",
     "courseName": "Introducción a Python",
     "instructorName": "Morena Caparrós",
     "courseId": "12112663"
   }
   ```

### 2. Flujo de Generación de Certificado

```
Validación exitosa → POST /api/certificate → PDF Generation → Upstash Storage → Download
```

**Paso a paso**:

1. **Usuario hace clic en "Generar certificado"**

2. **Sistema genera token único**:
   - Hash SHA-256 de: `{studentEmail}-{courseId}-{timestamp}`
   - Resultado: 64 caracteres hexadecimales
   - **Idempotencia**: Mismo estudiante + curso = mismo token
   - Propósito: Token no guessable para validación pública

3. **Almacenamiento en Upstash Redis**:
   - Key: `certificate:{token}`
   - Value (JSON):
     ```json
     {
       "token": "abc123...",
       "studentName": "Juan Pérez",
       "studentEmail": "juan@example.com",
       "courseName": "Introducción a Python",
       "courseId": "12112663",
       "instructorName": "Morena Caparrós",
       "emissionDate": "2026-02-10T15:30:00Z",
       "downloaded": false,
       "downloadedAt": null
     }
     ```
   - **Sin TTL**: Los certificados nunca expiran

4. **Generación del PDF**:

   **Template base**: `lib/certificateTemplate.pdf`
   - Diseñado en Canva (A4 landscape: 842x595 pts)
   - Exportado como PDF estático
   - Contiene diseño visual completo (fondo, logos, decoraciones)

   **Overlay dinámico con pdf-lib**:
   - **Título del curso**: x=1.07cm, y=9.64cm, 39pt HelveticaBold, color #4285F4
     - Soporte multi-línea si el nombre es largo (max width: 20.78cm)
   - **Rocket icon** (🚀): Posicionado dinámicamente 1cm a la derecha del título
   - **Texto descriptivo**: "Desde ITSCHOOL certificamos que **[NOMBRE]** ha finalizado..."
   - **Sección instructor**: Centrado en x=14.06cm
   - **QR Code**: Esquina inferior derecha (80x80pts)
     - Codifica URL: `certificados.itschool.com.ar/validar/{token}`
     - Color: #4285F4 (matching brand)

   **Variante SEC** (cursos sindicales):
   - Detecta sufijo "- SEC" en nombre del curso
   - Usa template diferenciado con diseño custom
   - Remueve "- SEC" del nombre mostrado en certificado
   - Color primario: #202C72 (azul oscuro)
   - Consulta spreadsheet separado: `GOOGLE_SHEETS_SPREADSHEET_ID_SEC`

5. **Respuesta al cliente**:
   ```json
   {
     "certificateUrl": "/api/certificate/{token}",
     "validationUrl": "/validar/{token}",
     "token": "abc123..."
   }
   ```

6. **Usuario descarga PDF**:
   - GET `/api/certificate/{token}`
   - Nombre archivo: `Certificado-NombreCurso-NombreEstudiante.pdf`
   - Normalización: Remove acentos, max 50 chars para curso
   - Headers: `Content-Type: application/pdf`, `Content-Disposition: attachment`

### 3. Flujo de Validación Pública

```
Escaneo QR → /validar/{token} → Upstash Query → Página de Validación
```

**Uso**: Empleadores, instituciones educativas, cualquier persona puede validar autenticidad

1. **Escaneo de QR code** en certificado físico/digital
   - URL: `certificados.itschool.com.ar/validar/{token}`

2. **Sistema consulta Redis**:
   - GET key `certificate:{token}`
   - Si no existe → Error 404 "Certificado no encontrado"

3. **Página de validación muestra**:
   - ✅ "Certificado válido"
   - Logo de IT School
   - Nombre del estudiante
   - Nombre del curso
   - Fecha de emisión
   - Nombre del instructor/a
   - Diseño responsive (mobile-friendly)

4. **Colores de marca**:
   - Celeste primario: #4285F4
   - Azul secundario: #393185
   - Texto: #1A1A1A / #666666

---

## 🔑 Configuración e Integraciones

### Google Sheets como "Base de Datos" de Configuración

**¿Por qué Google Sheets?**
- ✅ Editable sin código por personal no técnico
- ✅ Cambios en tiempo real (actualización dentro de 5 min por cache)
- ✅ Costo: $0 (dentro de cuotas gratuitas)
- ✅ Backup automático y historial de cambios
- ✅ Permisos granulares (share con equipo)

**Estructura del Spreadsheet "Configuracion"**:

| CourseID | CourseName | InstructorName |
|----------|------------|----------------|
| 12112663 | Optimización de procesos con herramientas de IA | Morena Caparrós |
| 15432123 | Introducción a Python | Juan Rodríguez |
| ... | ... | ... |

**Columnas**:
1. `CourseID` (string): ID del curso en Canvas (se obtiene de la URL del curso)
2. `CourseName` (string): Nombre para mostrar en certificado (puede diferir del nombre en Canvas)
3. `InstructorName` (string): Nombre del docente para firma del certificado

**Proceso de actualización**:
1. Personal de IT School edita sheet cuando hay nuevo curso
2. Sistema cachea config en memoria por 5 minutos
3. Después de 5 min, próxima request obtiene datos actualizados
4. No requiere deploy ni reinicio de servidor

**Autenticación**:
- Service Account de Google Cloud
- Credenciales JSON (email + private key en variables de entorno)
- Permisos de solo lectura al spreadsheet

### Canvas LMS API

**¿Por qué GraphQL?**
- Obtiene solo los datos necesarios (reducción de bandwidth)
- Un solo endpoint para múltiples queries
- Type safety con esquema definido

**Queries críticos**:

1. **GET_COURSE_ENROLLMENTS**: Lista de estudiantes en un curso
   ```graphql
   query($courseId: ID!, $after: String) {
     course(id: $courseId) {
       enrollmentsConnection(first: 100, after: $after) {
         nodes { user { email, name } }
         pageInfo { hasNextPage, endCursor }
       }
     }
   }
   ```

2. **GET_ASSIGNMENT_SUBMISSIONS**: Calificaciones de una tarea
   ```graphql
   query($assignmentId: ID!, $after: String) {
     assignment(id: $assignmentId) {
       submissionsConnection(first: 100, after: $after) {
         nodes { user { _id }, score, gradedAt }
         pageInfo { hasNextPage, endCursor }
       }
     }
   }
   ```

**Desafíos superados**:
- ❌ **Bug Nov 2025**: Estudiantes después de posición 100 fallaban validación
- ✅ **Solución**: Implementar paginación completa con `while (hasNextPage)` loops
- ⚡ **Optimización**: Búsqueda early-exit cuando se encuentra el estudiante

### Variables de Entorno

```bash
# Canvas LMS
CANVAS_BASE_URL=https://canvas.instructure.com/api/graphql
CANVAS_API_TOKEN=7~[TOKEN_DE_64_CHARS]

# Google Sheets (cursos estándar)
GOOGLE_SHEETS_SPREADSHEET_ID=1sp5fzVtqiTuer8gp40rj-r57iWn6IlqVgfSFc5NDHUk
GOOGLE_SERVICE_ACCOUNT_EMAIL=python-sheets@canvas-427419.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Sheets (cursos SEC)
GOOGLE_SHEETS_SPREADSHEET_ID_SEC=1yvjJ_PnKRPUhE9rSIWRFuPf8hs2U_xrRvjxuLcF7pdk

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://relative-coyote-10314.upstash.io
UPSTASH_REDIS_REST_TOKEN=AShKAAIncD...

# Supabase (migración futura)
SUPABASE_URL=https://nmbonaeipadchkgputlm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# URLs públicas
NEXT_PUBLIC_BASE_URL=https://certificados.itschool.com.ar
```

**Gestión de secretos**:
- Desarrollo: `.env.local` (gitignored)
- Producción: Netlify Environment Variables (UI Dashboard)
- No hardcodear secretos en código fuente

---

## 📊 Características Técnicas Importantes

### 1. Paginación Cursor-Based (Canvas API)

**Por qué es crítico**:
- Canvas limita queries a 100 items por página
- Cursos con 100+ estudiantes requieren múltiples requests
- Sin paginación → estudiantes invisibles para el sistema

**Implementación**:
```typescript
let allEnrollments: CanvasEnrollment[] = [];
let hasNextPage = true;
let after: string | null = null;

while (hasNextPage) {
  const data = await graphqlClient.request(QUERY, { courseId, after });
  allEnrollments = [...allEnrollments, ...data.nodes];
  hasNextPage = data.pageInfo?.hasNextPage || false;
  after = data.pageInfo?.endCursor || null;
}
```

**Ventajas**:
- ✅ Soporta cursos con miles de estudiantes
- ✅ Consistencia garantizada (no se saltean registros)
- ✅ Optimización con early-exit cuando se encuentra el dato buscado

### 2. Idempotencia de Certificados

**Problema**: ¿Qué pasa si un estudiante regenera su certificado?

**Solución implementada**:
- Mismo estudiante + curso → mismo token SHA-256
- Re-generación busca certificado existente en Redis
- QR code permanece constante (misma URL de validación)
- **Ventaja**: Un solo certificado "canónico" por estudiante-curso

**Formula del token**:
```typescript
const data = `${studentEmail}-${courseId}-${timestamp}`;
const hash = crypto.createHash('sha256');
hash.update(data);
const token = hash.digest('hex'); // 64 caracteres
```

### 3. Limitaciones de pdf-lib vs Puppeteer

**Decisión arquitectónica (Nov 2025)**:

| Aspecto | Puppeteer | pdf-lib (actual) |
|---------|-----------|------------------|
| Bundle size | ~50MB (con chromium) | ~100KB |
| Compatibilidad Netlify | ❌ Falla con brotli | ✅ Sin problemas |
| Flexibilidad diseño | ✅ HTML/CSS completo | ⚠️ Solo overlays básicos |
| Fuentes custom | ✅ Cualquier font | ❌ Solo fonts estándar PDF |
| Performance | Lento (~5s) | Rápido (~500ms) |

**Implicación para diseño**:
- Certificado DEBE diseñarse en Canva/Figma primero
- Exportar como PDF estático
- pdf-lib solo agrega texto dinámico en coordenadas fijas
- Cambios de diseño = actualizar template PDF + ajustar coordenadas

### 4. Arquitectura Serverless

**Ventajas**:
- ✅ Costo: $0/mes (dentro de free tiers)
- ✅ Escalabilidad automática (1 request o 1000, mismo costo)
- ✅ No hay servidor que mantener (no patches, no updates)
- ✅ Deploy en <2 minutos (push to Git)

**Desventajas/Limitaciones**:
- ⚠️ Cold starts (~500ms-1s primera request)
- ⚠️ Timeout: 10s por function en Netlify free tier
- ⚠️ Sin IP fija (no whitelist posible para Canvas)
- ⚠️ Memoria limitada (1024MB por function)

**Componentes serverless**:
1. **Next.js API Routes** → Netlify Functions (AWS Lambda)
2. **Upstash Redis** → Redis serverless (sin servidor dedicado)
3. **Google Sheets API** → Backend de Google (siempre disponible)
4. **Static files (PDFs, images)** → Netlify CDN

---

## 🎨 Branding y Diseño

### Colores de IT School

| Uso | Color | Hex | Contexto |
|-----|-------|-----|----------|
| **Primary** | Celeste | `#4285F4` | Botones, títulos, links, texto certificado |
| **Secondary** | Azul | `#393185` | Gradientes, acentos oscuros |
| **Text Primary** | Gris Oscuro | `#1A1A1A` | Texto principal |
| **Text Secondary** | Gris Neutro | `#666666` | Fechas, detalles, hints |
| **Background** | Blanco | `#FFFFFF` | Fondos |

**Certificado SEC (variante)**:
- Color primario: `#202C72` (azul oscuro institucional)
- Mantiene misma estructura, diferente paleta

### Assets

- **Logo principal**: `Logo Original a color.svg` (uso en validación)
- **Rocket icon**: `lib/rocket-icon.png` (35x35pts, transparent)
- **Certificate templates**: 
  - Estándar: `lib/certificateTemplate.pdf`
  - SEC: (template separado con diseño custom)

---

## 🔒 Seguridad

### Validación de Autenticidad

**Problema**: ¿Cómo prevenir falsificación de certificados?

**Solución multi-capa**:

1. **Token no predecible**: SHA-256 de 64 chars (2^256 posibilidades)
2. **Validación pública**: Cualquiera puede escanear QR y verificar
3. **Registro inmutable**: Una vez emitido, certificado permanece en Redis
4. **No metadata en PDF**: Certificado no contiene info que permita recrear token

**Flujo de verificación**:
```
Certificado físico → QR code → Token → Redis lookup → Validación
```

Si alguien modifica el PDF (cambia nombre, curso), el QR code sigue apuntando al certificado original. Discrepancia = falsificación evidente.

### API Security

- **Rate limiting**: Netlify provee DDoS protection básico
- **No auth en endpoints públicos**: `/validar` es intencionalmente público
- **Auth en Canvas API**: Token Bearer en headers (renovable desde Canvas)
- **Secretos en env vars**: Never hardcoded, solo en Netlify dashboard

### GDPR/Privacidad

- **Datos almacenados**: Nombre, email, curso, fecha
- **Retención**: Permanente (certificados no expiran)
- **Acceso público**: Solo a través de token no guessable
- **No PII sensible**: No se guarda DNI, dirección, fecha nacimiento

---

## 📈 Métricas y Analytics

### Métricas Actuales (Manual)

Mediante Google Sheets se pueden trackear:
- Número de certificados emitidos por curso
- Estudiantes certificados por instructor
- Cursos más populares

### Migración a Supabase (Futuro)

**Ventajas planeadas**:
- Dashboard de analytics en tiempo real
- Queries SQL para reportes custom
- Triggers automáticos (notificaciones cuando X certificados)
- Logs de validaciones (quién escaneó QR, cuándo)

---

## 🚀 Roadmap y Mejoras Futuras

### En Progreso

1. **Migración Upstash → Supabase**
   - Mayor capacidad de almacenamiento
   - Analytics y reporting mejorado
   - Triggers y webhooks

### Consideradas

1. **Envío automático por email**
   - Gmail API integration (variable ya configurada)
   - Email con certificado adjunto + link de validación
   - Template HTML profesional

2. **LinkedIn Integration**
   - Botón "Agregar a LinkedIn" post-generación
   - API de LinkedIn para publicar certificación automáticamente

3. **Badge embebible**
   - Widget HTML/iframe para portafolios
   - Muestra mini-certificado con validación en vivo

4. **Multi-idioma**
   - Certificados en inglés para cursos internacionales
   - i18n en formularios y páginas de validación

5. **Analytics Dashboard**
   - Panel para administradores
   - Métricas de uso, cursos más certificados
   - Export a CSV para reportes

---

## 🐛 Bugs Históricos y Lecciones Aprendidas

### Bug 1: Paginación Faltante (Nov 2025)

**Síntoma**: Estudiante Victoria Tofalo no podía generar certificado pese a aprobar curso.

**Root cause**: 
- Canvas query solo obtenía primeros 100 enrollments
- Victoria estaba en posición 120+
- Sistema la consideraba "no inscrita"

**Fix**: Implementar `while (hasNextPage)` en todas las queries Connection.

**Lección**: SIEMPRE paginar APIs que retornan listas. No asumir datasets pequeños.

### Bug 2: Puppeteer en Netlify (Nov 2025)

**Síntoma**: Deploy exitoso, pero PDF generation fallaba con error "brotli files not found".

**Root cause**: 
- Puppeteer requiere chromium binaries (~50MB)
- Netlify Functions tienen límite de bundle size
- Compresión brotli fallaba en runtime

**Fix**: Migrar a pdf-lib (100KB, sin dependencias nativas).

**Lección**: Priorizar librerías lightweight para serverless. Siempre testear en ambiente producción equivalente.

### Bug 3: Filenames con Acentos (Nov 2025)

**Síntoma**: PDFs descargaban con nombre `abc123...pdf` en lugar de nombre descriptivo.

**Root cause**: 
- Headers `Content-Disposition` con caracteres UTF-8 no ASCII
- Algunos browsers no parseaban correctamente

**Fix**: Normalizar con `normalize('NFD')` + strip diacritics, limit 50 chars.

**Lección**: Sanitizar TODOS los inputs user-facing. Browsers tienen comportamientos inconsistentes.

---

## 🛠️ Guía para Nuevos Desarrolladores

### Setup Local (Primera Vez)

```powershell
# 1. Clonar repo
git clone [repo-url]
cd certificados-itschool

# 2. Instalar dependencias
npm install

# 3. Configurar .env.local (copiar vars de Netlify dashboard)
# Ver sección "Variables de Entorno" arriba

# 4. Verificar credenciales
npm run dev
# Visitar http://localhost:3000

# 5. Testear con curso de prueba
# ID: 12112663
# Email test: morena.caparros@grupokelsoft.com
```

### Estructura del Código

```
app/
  api/              # Endpoints serverless (Netlify Functions)
    validate/       # POST: Valida estudiante en Canvas
    certificate/    # POST: Genera certificado + GET: Download PDF
    validar/[token] # GET: Valida certificado público
  curso/[courseId]  # Página de formulario para estudiantes
  validar/[token]   # Página pública de validación

lib/
  canvasAPI.ts           # Queries GraphQL a Canvas
  sheetsConfig.ts        # Lectura de Google Sheets
  pdfGenerator.ts        # Generación de PDF con pdf-lib
  certificateStorage.ts  # Operaciones Redis (get/set certificates)
  types.ts               # TypeScript types compartidos
```

### Testing Manual

1. **Validación de estudiante**:
   ```powershell
   curl -X POST http://localhost:3000/api/validate `
     -H "Content-Type: application/json" `
     -d '{"courseId":"12112663","studentEmail":"morena.caparros@grupokelsoft.com"}'
   ```

2. **Generación de certificado**:
   ```powershell
   curl -X POST http://localhost:3000/api/certificate `
     -H "Content-Type: application/json" `
     -d '{"studentName":"Test Student","studentEmail":"test@example.com","courseName":"Test Course","courseId":"12112663","instructorName":"Test Instructor"}'
   ```

3. **Validar certificado público**:
   - Visitar: `http://localhost:3000/validar/{token-from-step-2}`

### Modificar Diseño de Certificado

1. Editar en Canva (A4 landscape, 297x210mm)
2. Exportar como PDF → guardar en `lib/certificateTemplate.pdf`
3. Ajustar coordenadas en `lib/pdfGenerator.ts`:
   - Convertir cm a points (1cm = 28.35pts)
   - Origin: bottom-left corner
4. Testear con comando de step 2 arriba
5. Verificar que texto no se corta y QR está visible

---

## 🔧 Mantenimiento Operacional

### Tareas Regulares

**Cada 3 meses**:
- Renovar Canvas API token (expira cada 6 meses)
- Verificar cuotas de Google Sheets (10k reads/day)
- Revisar storage de Upstash (alertar si >200MB)

**Cada 6 meses**:
- Audit logs de validación (queries anormales)
- Backup de base de datos Redis (export a JSON)
- Revisar dependencies (npm outdated)

### Agregar Nuevo Curso

1. Obtener Course ID de Canvas (URL del curso)
2. Editar Google Sheets "Configuracion":
   - Agregar fila: `[CourseID] | [Nombre para certificado] | [Instructor]`
3. Esperar 5 minutos (cache expira)
4. Testear con estudiante de prueba
5. Comunicar URL a estudiantes: `certificados.itschool.com.ar/curso/{courseId}`

### Troubleshooting Común

**Error: "Curso no encontrado"**
→ Verificar que courseId existe en Google Sheets
→ Verificar permisos de Service Account al spreadsheet

**Error: "No estás inscrito en este curso"**
→ Confirmar que email en Canvas coincide exactamente
→ Revisar logs de API (Netlify Functions tab)
→ Verificar que estudiante no está en rol "Observer"

**PDF no se genera**
→ Check Netlify function logs (timeout?)
→ Verificar que `certificateTemplate.pdf` existe en repo
→ Confirmar memoria suficiente (max 1024MB)

**QR code no funciona**
→ Verificar `NEXT_PUBLIC_BASE_URL` en env vars
→ Confirmar que token existe en Redis
→ Testear URL manualmente en browser

---

## 📚 Glosario de Términos

- **Canvas LMS**: Learning Management System usado por IT School para cursos online
- **GraphQL**: Query language para APIs, alternativa a REST
- **Serverless**: Modelo donde provider maneja infraestructura (no servers propios)
- **Cursor pagination**: Método de paginación usando cursors en lugar de offsets
- **Cold start**: Delay en primera invocación de serverless function
- **Service Account**: Cuenta de Google Cloud para autenticación machine-to-machine
- **Idempotencia**: Operación que produce mismo resultado si se ejecuta múltiples veces
- **TTL (Time To Live)**: Tiempo de expiración de un record en base de datos
- **Token**: String único que identifica un certificado (64 chars hex)
- **SHA-256**: Algoritmo de hashing criptográfico (256 bits de salida)

---

## 👥 Contactos y Responsabilidades

| Rol | Responsabilidad | Contacto |
|-----|-----------------|----------|
| **Product Manager** | Roadmap, priorización, stakeholders | [TBD] |
| **Tech Lead** | Arquitectura, code review, deploys | [TBD] |
| **Backend Dev** | APIs, integraciones, database | [TBD] |
| **Frontend Dev** | UI/UX, formularios, páginas | [TBD] |
| **IT School Admin** | Configuración cursos, soporte usuarios | itschool@grupokelsoft.com |

---

## 📞 Soporte y Escalamiento

**Para estudiantes**:
- Email: itschool@grupokelsoft.com
- Formulario de contacto en web de IT School

**Para desarrolladores**:
- Issues en GitHub repo
- Slack channel: #certificados-dev (si existe)
- Code reviews: Pull requests en main branch

---

**Última actualización**: Febrero 2026
**Versión del documento**: 1.0
**Mantenido por**: Equipo de Desarrollo IT School
