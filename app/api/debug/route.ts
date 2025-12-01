import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// BUILD_ID único para trackear deploys
const BUILD_ID = `diagnostico-${new Date().toISOString()}`;
const BUILD_TIMESTAMP = Date.now();

export async function GET(request: NextRequest) {
  try {
    console.log(`🔍🔍🔍 [DEBUG] Endpoint diagnóstico llamado - BUILD_ID: ${BUILD_ID}`);

    // Buscar certificateTemplateV2.pdf en múltiples ubicaciones posibles
    const possiblePaths = [
      join(process.cwd(), 'lib', 'certificateTemplateV2.pdf'),
      join(process.cwd(), '.next', 'server', 'app', 'lib', 'certificateTemplateV2.pdf'),
      join(process.cwd(), '.netlify', 'functions', 'certificateTemplateV2.pdf'),
      '/var/task/lib/certificateTemplateV2.pdf', // Netlify Lambda path
      '/var/task/.next/server/app/lib/certificateTemplateV2.pdf',
    ];

    const templateInfo: any = {
      searchedPaths: possiblePaths,
      found: null,
      size: null,
      error: null,
    };

    for (const path of possiblePaths) {
      try {
        if (existsSync(path)) {
          const stats = statSync(path);
          templateInfo.found = path;
          templateInfo.size = stats.size;
          console.log(`✅ Template encontrado en: ${path} (${stats.size} bytes)`);
          break;
        }
      } catch (err) {
        // Path no existe o no accesible, continuar
      }
    }

    if (!templateInfo.found) {
      console.error('❌ certificateTemplateV2.pdf NO encontrado en ninguna ubicación');
      templateInfo.error = 'Template file not found in any expected location';
    }

    // Información del entorno
    const debugInfo = {
      buildId: BUILD_ID,
      buildTimestamp: BUILD_TIMESTAMP,
      buildDate: new Date(BUILD_TIMESTAMP).toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        context: process.env.CONTEXT, // Netlify context (production, deploy-preview, branch-deploy)
        awsLambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME, // Running in Lambda?
        netlify: !!process.env.NETLIFY, // Running in Netlify?
      },
      paths: {
        cwd: process.cwd(),
        execPath: process.execPath,
        platform: process.platform,
      },
      template: templateInfo,
      packageVersions: {
        pdfLib: require('pdf-lib/package.json').version,
        qrcode: require('qrcode/package.json').version,
        next: require('next/package.json').version,
      },
      requestInfo: {
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      },
    };

    console.log('📊 Debug info:', JSON.stringify(debugInfo, null, 2));

    return NextResponse.json(debugInfo, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ Error en endpoint debug:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        buildId: BUILD_ID,
      },
      { status: 500 }
    );
  }
}
