# IT School Certificate System - AI Agent Instructions

## Project Overview
Next.js 16 serverless app that generates PDF certificates for IT School students who complete Canvas LMS courses. Validates student completion via Canvas GraphQL API, stores certificates in Upstash Redis, generates PDFs with QR codes for validation.

**Key Architecture**: Completely serverless (Netlify + Upstash + Google Sheets) with $0 hosting cost.

## Critical Components & Data Flow

### 1. Student Validation Flow (`/api/validate` → Canvas GraphQL)
- **Entry**: `app/api/validate/route.ts` receives `courseId` (from URL - e.g., `/curso/123456`) + `studentEmail` (from form input)
- **Config lookup**: `lib/sheetsConfig.ts` queries Google Sheets ("Configuracion" tab) for course metadata
  - Reads from spreadsheet ID stored in `GOOGLE_SHEETS_SPREADSHEET_ID` (in `.env.local` or GitHub Environment Variables)
  - Returns: `courseName`, `instructorName` (used for certificate signature)
- **Canvas validation**: `lib/canvasAPI.ts` performs 3-step GraphQL validation:
  1. `validateStudentInCourse()` - **Searches email across ALL enrollment pages** via `GET_COURSE_ENROLLMENTS`
     - Fetches 100 enrollments per GraphQL page
     - Loops through pages using `pageInfo.hasNextPage` + `endCursor` until email found or pages exhausted
     - Compares emails case-insensitively to find matching student
  2. `findFinalExamAssignment()` - Auto-detects "Test Final"/"Examen Final" assignment by name
     - Explicitly **excludes** "Trabajo Práctico"/"TP Final" (these are optional, not required for certificate)
     - Searches all assignments by pattern matching, NOT by hardcoded assignment ID
  3. `getStudentSubmission()` - **Fetches grade across ALL submission pages** via `GET_ASSIGNMENT_SUBMISSIONS`
     - Paginates through submissions (100 per page) to find student's submission by `userId`
     - Validates: submission is graded (`gradedAt` not null) AND score ≥ 70
- **Passing score**: Hardcoded to 70 in `app/api/validate/route.ts` - this is the minimum score required for Test Final

**CRITICAL - Cursor-Based Pagination**: Canvas GraphQL uses cursor pagination for ALL `*Connection` queries. Pattern:
```typescript
let hasNextPage = true;
let after: string | null = null;
while (hasNextPage) {
  const data = await client.request(QUERY, { courseId, after });
  // Process data.nodes
  hasNextPage = data.pageInfo?.hasNextPage || false;
  after = data.pageInfo?.endCursor || null;
}
```
Recent bug: Students beyond position 100 failed validation because pagination was missing. ALWAYS implement full page traversal.

**URL flow example**: User visits `/curso/123456` → enters `alumno@example.com` → system searches Canvas course 123456 across all pages → validates Test Final ≥ 70 → ignores TP Final status.

### 2. Certificate Generation Flow (`/api/certificate` → PDF)
- **User action**: After successful validation, user clicks "Generar certificado" button
- **POST to `/api/certificate`**: Creates certificate metadata, generates 64-char SHA-256 hex token
- **Storage**: `lib/certificateStorage.ts` saves to Upstash Redis with key `certificate:{token}` (no TTL - permanent storage)
  - **Important**: Same student + course → same token (idempotent). Re-generating certificate reuses existing QR code
- **PDF generation**: `lib/generatePDF.ts` uses `pdf-lib` to overlay text on `lib/certificateTemplate.pdf`
  - **Replaced Puppeteer/heavy library**: Migrated to `pdf-lib` (~100KB) for Netlify compatibility
  - **Design workflow**: Export PDF from Canva → overlay dynamic content with pdf-lib
- **GET `/api/certificate/[token]`**: Retrieves PDF bytes, returns with descriptive filename

**Current PDF approach**: Overlays student name, course name, instructor name, and QR code onto pre-designed `certificateTemplate.pdf` at hardcoded coordinates. Filename format: `Certificado-CourseName-StudentName.pdf` (normalized, max 50 chars for course).

### 3. Validation Page (`/validar/[token]`)
Public validation page accessed by scanning QR code on certificate. Displays:
- Student name
- Course name
- Emission date (first generation date - duplicates don't create new tokens)
- Instructor name

Queries `/api/certificate/validate/[token]` endpoint to fetch certificate data from Upstash Redis.

## Key Files & Responsibilities

| File | Purpose | Critical Notes |
|------|---------|----------------|
| `lib/canvasAPI.ts` | Canvas GraphQL queries | **MUST paginate** all `*Connection` queries (100 items/page); auto-detects "Test Final" |
| `lib/sheetsConfig.ts` | Google Sheets config reader | 5-min in-memory cache; expects "Configuracion" sheet with 3 columns |
| `lib/generatePDF.ts` | PDF overlay with pdf-lib | Replaced Puppeteer (Nov 2025); overlays on `certificateTemplate.pdf`; A4 landscape |
| `lib/certificateTemplate.pdf` | PDF design base | Created in Canva; DO NOT modify with code - only overlay text/QR |
| `lib/certificateStorage.ts` | Upstash Redis operations | Keys never expire; token is SHA-256 (32 bytes → 64 hex chars) |
| `app/api/validate/route.ts` | Student validation endpoint | Returns 400 if not enrolled/graded, 404 if course not in Sheets |
| `app/api/certificate/route.ts` | Certificate creation endpoint | Generates token, saves to Redis, returns certificateUrl + validationUrl |
| `app/api/certificate/[token]/route.ts` | PDF download endpoint | Returns PDF with descriptive filename (course + student name) |

## Environment Variables (Required)

```bash
# Canvas LMS
CANVAS_BASE_URL=https://canvas.instructure.com/api/graphql
CANVAS_API_TOKEN=<bearer_token>

# Google Sheets (Service Account)
GOOGLE_SHEETS_SPREADSHEET_ID=<spreadsheet_id>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<email>
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://<region>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

# App URLs
NEXT_PUBLIC_BASE_URL=https://certificados.itschool.com.ar
```

## Development Commands

```powershell
npm run dev          # Local dev server (localhost:3000)
npm run build        # Next.js production build
npm run start        # Serve production build locally
```

**Testing certificate generation locally**:
1. Ensure `.env.local` has all credentials
2. POST to `http://localhost:3000/api/validate` with valid Canvas student
3. POST to `http://localhost:3000/api/certificate` with returned data
4. Access PDF at `http://localhost:3000/api/certificate/{token}`

## Common Patterns & Conventions

### Canvas API Pattern
Always paginate GraphQL queries with `while (hasNextPage)` loops. Example from `canvasAPI.ts`:
```typescript
let allEnrollments: CanvasEnrollment[] = [];
let hasNextPage = true;
let after: string | null = null;
while (hasNextPage) {
  const data = await client.request(QUERY, { courseId, after });
  allEnrollments = [...allEnrollments, ...data.nodes];
  hasNextPage = data.pageInfo?.hasNextPage || false;
  after = data.pageInfo?.endCursor || null;
}
```

### Error Logging Convention
Use emoji prefixes for console logs:
- `🔍` - Search/lookup operations
- `✅` - Success operations
- `❌` - Errors/validation failures
- `📊` - Data/statistics
- `📄` - File/document operations
### Google Sheets Structure
Sheet name MUST be "Configuracion" with columns:
1. `CourseID` - Canvas course ID (string)
2. `CourseName` - Display name for certificate
3. `InstructorName` - Instructor signature name (used on certificate)

**Source**: Google Sheets spreadsheet ID configured in `GOOGLE_SHEETS_SPREADSHEET_ID` environment variable (stored in `.env.local` for development, GitHub Secrets/Environment Variables for production).

No duration/passing score columns - duration is generic text, passing score hardcoded to 70.

No duration/passing score columns - duration is generic text, passing score hardcoded to 70.

## PDF Coordinate System & Design Workflow
<<<<<<< HEAD
`certificateTemplate.pdf` is A4 landscape (842x595 pts). Origin is bottom-left. 
=======
`certificateTemplate.pdf` dimensions vary. Origin is bottom-left. **Measurements in CM converted to points (1cm = 28.35pts)**.
>>>>>>> testing

**Design Process**:
1. Create certificate design in Canva/Figma (leave space for dynamic text)
2. Export as PDF → save as `lib/certificateTemplate.pdf`
3. Adjust coordinates in `lib/generatePDF.ts` to match layout

<<<<<<< HEAD
**Current overlays** (from `generatePDF.ts`):
- **Course name**: x=450, y=330, size=36pt, HelveticaBold, blue (#3B82F6) [right of rocket emoji]
- **Student name**: centered, y=250, size=28pt, HelveticaBold, uppercase, blue
- **Instructor name**: x=575, y=105, size=18pt, Helvetica, blue [below "Docente" label]
- **QR code**: x=742, y=70, 80x80 pts [bottom-right corner]

**Font limitation**: pdf-lib only supports standard PDF fonts (Helvetica, Times, Courier). Canva designs with Poppins/custom fonts approximate to HelveticaBold.

=======
**EXACT SPECIFICATIONS** (Updated Nov 2025 - Final):

**Color**: #4285F4 (azul corporativo) - applies to ALL certificate text

**Course Title**:
- Position: x=1.07cm, y=9.64cm (from top)
- Size: 39pt, HelveticaBold
- Line height: 1.2 (interlineado)
- **MAX width**: 20.78cm
- Multi-line support: Text wraps automatically if exceeds max width

**Rocket Icon** (🚀 rocket-icon.png):
- Position: Dynamic - calculated as 1cm to the right of the longest line in the title
- Size: 35x35pts
- Logic: 
  - Single line: Aligned with title baseline
  - Multiple lines: Vertically centered in the middle of all lines
- File: `lib/rocket-icon.png` (PNG with transparent background)

**Line 1**: "Desde ITSCHOOL certificamos que [STUDENT NAME IN BOLD] ha finalizado y aprobado el curso."
- Position: x=1.07cm, y=12.5cm (from top)
- Size: 14pt
- Font: Helvetica (regular), student name in HelveticaBold

**Line 2**: "Cumpliendo todos los requisitos exigidos."
- Position: x=1.07cm, y=13.59cm (from top)
- Size: 14pt, Helvetica

**Instructor Section** (two lines, both centered):
- Line 1 "Docente": x=14.06cm (centered), y=18.65cm (from top), 11pt
- Line 2 (Instructor name): x=14.06cm (centered), y=19.25cm (from top), 11pt
- Both lines use same center point for alignment

**QR Code**:
- Position: x=width-qrSize-80pts (dynamic, right side), y=70pts (bottom-right corner)
- Size: 80x80pts
- Color: #4285F4 (azul corporativo, matching text color)

**Font limitation**: pdf-lib only supports standard PDF fonts (Helvetica, Times, Courier). Canva designs with Poppins/custom fonts approximate to HelveticaBold.

**Template dimensions**: 842.25 x 595.5 pts (A4 landscape)

>>>>>>> testing
## User-Facing Error Messages

Validation errors in `/api/validate` should return user-friendly Spanish messages:

1. **Score < 70**: "Te falta alcanzar el puntaje mínimo para aprobar el Test Final"
2. **Test not submitted/graded**: "Aún no finalizaste el curso"
3. **Student not enrolled**: "No estás inscrito en este curso"
4. **Course not found**: "Curso no encontrado o no habilitado para certificados"

## Known Limitations & Gotchas

1. **Pagination is MANDATORY**: Bug discovered Nov 2025 - students beyond position 100 failed validation. All Canvas `*Connection` queries (enrollments, submissions, assignments) MUST use `while (hasNextPage)` loops with cursor pagination.

2. **Final exam detection**: Only finds assignments with "Test Final"/"Examen Final" in name (case-insensitive), explicitly excludes "Trabajo Práctico"/"TP Final". Update `findFinalExamAssignment()` regex if naming changes.

3. **Google Sheets cache**: Config cached for 5 minutes. To force refresh, restart the app or call `clearConfigCache()` (not exposed via API).

3. **Certificate idempotency**: Same student + course always generates same token/QR code. Re-generating a certificate returns the existing hash. Certificates are permanent in Redis - use `deleteCertificate(token)` for manual cleanup if needed.

5. **Font limitations**: pdf-lib only supports standard PDF fonts (Helvetica, Times, Courier). Canva design uses Poppins - approximated with Helvetica Bold. Cannot embed custom fonts without significantly increasing bundle size.

6. **Upstash free tier**: 256MB storage (~512k certificates) and 10k commands/day. Monitor usage if scaling.

7. **Puppeteer removed**: Previous implementation used heavy library (possibly `@sparticuz/chromium` or similar) but failed on Netlify. Migrated to pdf-lib for reliability and smaller bundle (~100KB vs 50MB+).

## When Modifying Certificate Design

**Workflow** (established Nov 2025):
1. Design certificate in Canva with A4 Landscape format (297mm x 210mm)
2. Leave blank spaces for dynamic content (course name, student name, instructor, QR)
3. Export as PDF → save as `lib/certificateTemplate.pdf` in repo
4. Update coordinates in `lib/generatePDF.ts`:
   - Measure positions in Canva (convert mm to pts: 1mm ≈ 2.83pts)
   - Adjust x/y coordinates and font sizes
   - Remember: origin is bottom-left, not top-left
5. Test with sample data: `npm run dev` → visit `/curso/12112663` with test email
6. Verify: text doesn't overflow, QR code fits, Spanish characters (ñ, á, é) render correctly
7. Commit both `certificateTemplate.pdf` AND updated `generatePDF.ts`

**DO NOT**: Try to modify PDF content directly. Always export fresh PDF from design tool.

## Deployment (Netlify)

- Build: `npm run build` (configured in `netlify.toml`)
- Uses `@netlify/plugin-nextjs` for Next.js 16 support  
- All environment variables must be set in Netlify dashboard (Site settings → Environment variables)
- Serverless functions automatically deployed from `/api` routes
- **No fixed IP address**: Netlify Functions run on AWS Lambda with rotating IPs. Cannot whitelist for Canvas API.

### Testing vs Production Workflow

**Desired setup** (to be configured):
- **Production branch**: `main` → deploys to certificados.itschool.com.ar (shows placeholder homepage)
- **Testing branch**: `testing` or `dev` → separate Netlify site for testing changes
- Netlify supports **branch deploys**: configure in Site settings → Build & deploy → Branch deploys

<<<<<<< HEAD
**Current test course**: Course ID `12112663` ("Optimizaciones de Procesos y Herramientas IA")

### Testing vs Production Workflow

**Desired setup** (to be configured):
- **Production branch**: `main` → deploys to certificados.itschool.com.ar (shows placeholder homepage)
- **Testing branch**: `testing` or `dev` → separate Netlify site for testing changes
- Netlify supports **branch deploys**: configure in Site settings → Build & deploy → Branch deploys

**Current test course**: Course ID `12112663` ("Optimizaciones de Procesos y Herramientas IA")
- **No fixed IP address**: Netlify Functions run on AWS Lambda with rotating IPs. Cannot whitelist for Canvas API.

=======
**Current test course**: Course ID `12112663` ("Optimización de procesos con herramientas de IA")
- Test email: morena.caparros@grupokelsoft.com
- Instructor: Morena Caparrós
- **No fixed IP address**: Netlify Functions run on AWS Lambda with rotating IPs. Cannot whitelist for Canvas API.

## ITSCHOOL Brand Colors

Use these colors throughout the application (UI, validation page, error messages):

**Primary Colors (from logo)**:
| Usage | Color | Hex Code | Description |
|-------|-------|----------|-------------|
| **Primary (Brand)** | Celeste | `#4285F4` | Main brand color. Use for buttons, headings, links, important UI elements. |
| **Secondary (Brand)** | Azul | `#393185` | Secondary brand color. Use for gradients, alternate buttons, dark accents. |
| **Contrast (Dark Text)** | Gris Oscuro/Negro Suave | `#1A1A1A` | Primary text on light backgrounds. |
| **Base (Light Background)** | Blanco Puro | `#FFFFFF` | Main background color for certificates and UI. |
| **Text/Secondary Details** | Gris Neutro | `#666666` | Secondary text, hints, dates, instructor names, dividing lines. |

**Accent Colors (less prominent)**:
- Yellow: `#FABB05` - Warnings or highlights
- Red: `#E94235` - Errors or important warnings
- Green: `#34A853` - Success states or confirmations

**Certificate text color**: Uses `#4285F4` (Celeste) for all certificate text overlays, matching the primary brand color.

**Assets**: 
- ITSCHOOL logo: `Logo Original a color.svg` (use in validation page and UI)
- Rocket icon: `lib/rocket-icon.png` (35x35pts, transparent background)

>>>>>>> testing
## Recent Architectural Decisions (Nov 2025)

1. **PDF Generation**: Puppeteer → pdf-lib
   - **Why**: Puppeteer with `@sparticuz/chromium` failed on Netlify ("brotli files not found")
   - **Tradeoff**: Lost HTML/CSS flexibility, gained reliability and 500x smaller bundle
   - **Impact**: Must update coordinates manually instead of tweaking HTML

2. **Pagination Fix**: Added to all Canvas queries
   - **Why**: Students beyond position 100 were failing validation (victoriatofalo@gmail.com bug)
   - **Fix**: Implemented `while (hasNextPage)` loops in `validateStudentInCourse()` and `getStudentSubmission()`
   - **Impact**: All courses now support 100+ students

3. **Filename Normalization**: Added accent removal and sanitization
   - **Why**: PDFs downloading with token hash instead of descriptive names
   - **Fix**: `normalize('NFD').replace(/[\u0300-\u036f]/g, '')` + alphanumeric filter
   - **Format**: `Certificado-CourseName-StudentName.pdf` (course name limited to 50 chars)

## TypeScript Types Reference

All core types in `lib/types.ts`:
- `CertificateData` - Full certificate metadata stored in Redis
- `CourseConfig` - Google Sheets configuration row
- `CanvasStudent` / `CanvasSubmission` - Canvas API response shapes
- `ValidationResponse` / `CertificateResponse` - API endpoint responses

Use these types for all new API routes or data transformations.
