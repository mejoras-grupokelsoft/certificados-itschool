/**
 * Script para extraer y organizar correos de un archivo MBOX
 * Genera un documento limpio y legible para el área de negocios
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Email {
  subject: string;
  date: string;
  from: string;
  to: string;
  cc?: string;
  body: string;
  messageId: string;
  inReplyTo?: string;
  references?: string;
  attachments?: Attachment[];
}

interface Attachment {
  filename: string;
  contentType: string;
  size?: string;
}

interface Thread {
  subject: string;
  emails: Email[];
  participants: Set<string>;
  firstDate: Date;
}

function parseEmails(mboxContent: string): Email[] {
  const emails: Email[] = [];
  
  // Dividir por "From " al inicio de línea (formato MBOX)
  const emailBlocks = mboxContent.split(/\nFrom /);
  
  console.log(`📧 Encontrados ${emailBlocks.length} bloques de correo`);
  
  for (let i = 0; i < emailBlocks.length; i++) {
    const block = i === 0 ? emailBlocks[i] : 'From ' + emailBlocks[i];
    
    if (block.trim().length < 100) continue; // Ignorar bloques muy pequeños
    
    try {
      const email = parseEmailBlock(block);
      if (email) {
        emails.push(email);
      }
    } catch (error) {
      console.warn(`⚠️ Error parseando email ${i + 1}:`, error);
    }
  }
  
  console.log(`✅ Parseados ${emails.length} correos exitosamente`);
  return emails;
}

function parseEmailBlock(block: string): Email | null {
  const lines = block.split('\n');
  
  let subject = '';
  let date = '';
  let from = '';
  let to = '';
  let cc = '';
  let messageId = '';
  let inReplyTo = '';
  let references = '';
  let bodyStartIndex = -1;
  
  // Parsear headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === '' && bodyStartIndex === -1) {
      bodyStartIndex = i + 1;
      break;
    }
    
    if (line.startsWith('Subject: ')) {
      subject = line.substring(9).trim();
      // Manejar subject multi-línea
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith(' ')) {
        subject += ' ' + lines[j].trim();
        j++;
        i = j - 1;
      }
    } else if (line.startsWith('Date: ')) {
      date = line.substring(6).trim();
    } else if (line.startsWith('From: ')) {
      from = line.substring(6).trim();
    } else if (line.startsWith('To: ')) {
      to = line.substring(4).trim();
      // Manejar To multi-línea
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith(' ')) {
        to += ' ' + lines[j].trim();
        j++;
        i = j - 1;
      }
    } else if (line.startsWith('Cc: ')) {
      cc = line.substring(4).trim();
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith(' ')) {
        cc += ' ' + lines[j].trim();
        j++;
        i = j - 1;
      }
    } else if (line.startsWith('Message-ID: ') || line.startsWith('Message-Id: ')) {
      messageId = line.substring(line.indexOf(':') + 1).trim();
    } else if (line.startsWith('In-Reply-To: ')) {
      inReplyTo = line.substring(13).trim();
    } else if (line.startsWith('References: ')) {
      references = line.substring(12).trim();
    }
  }
  
  if (!subject || !from) {
    return null; // Email inválido
  }
  
  // Extraer cuerpo del mensaje y detectar adjuntos
  let body = '';
  const attachments: Attachment[] = [];
  
  if (bodyStartIndex !== -1) {
    const bodyLines = lines.slice(bodyStartIndex);
    let skipTechnical = false;
    let currentAttachment: Partial<Attachment> | null = null;
    
    for (let i = 0; i < bodyLines.length; i++) {
      const line = bodyLines[i];
      
      // Detectar adjuntos
      if (line.startsWith('Content-Disposition:') && line.includes('attachment')) {
        const filenameMatch = line.match(/filename="?([^";\n]+)"?/i);
        if (filenameMatch) {
          currentAttachment = { filename: filenameMatch[1] };
        }
        skipTechnical = true;
        continue;
      }
      
      if (currentAttachment && line.startsWith('Content-Type:')) {
        const contentTypeMatch = line.match(/Content-Type:\s*([^;\n]+)/i);
        if (contentTypeMatch) {
          currentAttachment.contentType = contentTypeMatch[1].trim();
        }
        continue;
      }
      
      // Detectar inicio de sección técnica (Content-Type, boundaries, etc.)
      if (line.startsWith('--') || 
          line.startsWith('Content-Type:') || 
          line.startsWith('Content-Transfer-Encoding:')) {
        
        // Guardar adjunto si estábamos procesando uno
        if (currentAttachment && currentAttachment.filename && currentAttachment.contentType) {
          attachments.push(currentAttachment as Attachment);
          currentAttachment = null;
        }
        
        skipTechnical = true;
        continue;
      }
      
      // Detectar fin de sección técnica
      if (skipTechnical && line.trim() === '') {
        skipTechnical = false;
        continue;
      }
      
      if (!skipTechnical) {
        body += line + '\n';
      }
    }
    
    // Guardar último adjunto si existe
    if (currentAttachment && currentAttachment.filename && currentAttachment.contentType) {
      attachments.push(currentAttachment as Attachment);
    }
  }
  
  // Limpiar body de quoted-printable y otros encodings
  body = cleanBody(body);
  
  return {
    subject: decodeHeader(subject),
    date,
    from: cleanEmail(from),
    to: cleanEmail(to),
    cc: cc ? cleanEmail(cc) : undefined,
    body: body.trim(),
    messageId,
    inReplyTo,
    references,
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}

function cleanEmail(email: string): string {
  // Remover < > y limpiar
  return email.replace(/<[^>]+>/g, '').replace(/"/g, '').trim();
}

function decodeHeader(header: string): string {
  // Decodificar =?UTF-8?...?= encoding
  return header.replace(/=\?[^?]+\?[BQ]\?([^?]+)\?=/gi, (match, encoded) => {
    try {
      return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch {
      return encoded;
    }
  });
}

function cleanBody(body: string): string {
  // Remover quoted-printable encoding (=XX)
  body = body.replace(/=([0-9A-F]{2})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Remover soft line breaks (= al final de línea)
  body = body.replace(/=\n/g, '');
  
  // Remover código base64 (PDFs, imágenes embebidas, etc.)
  // Detectar líneas largas de base64 (más de 100 caracteres alfanuméricos/+/=)
  body = body.replace(/^[A-Za-z0-9+/=]{100,}$/gm, '[ARCHIVO EMBEBIDO REMOVIDO]');
  
  // Remover bloques base64 (múltiples líneas seguidas)
  body = body.replace(/(\n[A-Za-z0-9+/=]{60,}\n){3,}/g, '\n[ARCHIVO EMBEBIDO REMOVIDO]\n');
  
  // Remover tags HTML
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<[^>]+>/g, ' ');
  
  // Decodificar entidades HTML comunes
  body = body.replace(/&nbsp;/g, ' ');
  body = body.replace(/&amp;/g, '&');
  body = body.replace(/&lt;/g, '<');
  body = body.replace(/&gt;/g, '>');
  body = body.replace(/&quot;/g, '"');
  body = body.replace(/&#39;/g, "'");
  
  // Arreglar codificación UTF-8 mal decodificada
  body = fixUTF8Encoding(body);
  
  // Limpiar exceso de espacios
  body = body.replace(/  +/g, ' ');
  body = body.replace(/\n +/g, '\n');
  body = body.replace(/ +\n/g, '\n');
  
  // Limpiar exceso de líneas vacías
  body = body.replace(/\n{3,}/g, '\n\n');
  
  return body.trim();
}

function fixUTF8Encoding(text: string): string {
  // Arreglar caracteres UTF-8 mal decodificados (común en emails)
  const replacements: { [key: string]: string } = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã\x81': 'Á', 'Ã\x89': 'É', 'Ã\x8d': 'Í', 'Ã\x93': 'Ó', 'Ã\x9a': 'Ú',
    'Ã±': 'ñ', 'Ã\x91': 'Ñ',
    'Ã¼': 'ü', 'Ã\x9c': 'Ü',
    'Â¿': '¿', 'Â¡': '¡',
    'Â': '', // Remover caracteres Â solos (basura de codificación)
  };
  
  for (const [wrong, correct] of Object.entries(replacements)) {
    text = text.split(wrong).join(correct);
  }
  
  return text;
}

function groupIntoThreads(emails: Email[]): Thread[] {
  const threads: Map<string, Thread> = new Map();
  
  for (const email of emails) {
    // Normalizar subject (remover Re:, Fwd:, etc.)
    const normalizedSubject = email.subject
      .replace(/^(Re:|RE:|Fwd:|FW:|Fw:)\s*/gi, '')
      .trim();
    
    let threadKey = normalizedSubject;
    
    // Buscar si pertenece a un thread existente por referencias
    if (email.inReplyTo || email.references) {
      for (const [key, thread] of threads) {
        if (thread.emails.some(e => 
          e.messageId === email.inReplyTo || 
          (email.references && email.references.includes(e.messageId))
        )) {
          threadKey = key;
          break;
        }
      }
    }
    
    if (!threads.has(threadKey)) {
      threads.set(threadKey, {
        subject: normalizedSubject,
        emails: [],
        participants: new Set(),
        firstDate: new Date(email.date || Date.now()),
      });
    }
    
    const thread = threads.get(threadKey)!;
    thread.emails.push(email);
    thread.participants.add(email.from);
    if (email.to) thread.participants.add(email.to);
    if (email.cc) thread.participants.add(email.cc);
  }
  
  // Ordenar threads por fecha
  const threadsArray = Array.from(threads.values());
  threadsArray.sort((a, b) => b.firstDate.getTime() - a.firstDate.getTime());
  
  // Ordenar emails dentro de cada thread por fecha
  threadsArray.forEach(thread => {
    thread.emails.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateA - dateB;
    });
  });
  
  return threadsArray;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function generateMarkdown(threads: Thread[]): string {
  let markdown = '# Resumen de Correos Electrónicos\n\n';
  markdown += `**Fecha de generación:** ${new Date().toLocaleDateString('es-AR')}\n\n`;
  markdown += `**Total de hilos de conversación:** ${threads.length}\n\n`;
  markdown += `---\n\n`;
  
  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    
    markdown += `## ${i + 1}. ${thread.subject}\n\n`;
    markdown += `**Participantes:** ${Array.from(thread.participants).join(', ')}\n\n`;
    markdown += `**Cantidad de mensajes:** ${thread.emails.length}\n\n`;
    markdown += `---\n\n`;
    
    for (let j = 0; j < thread.emails.length; j++) {
      const email = thread.emails[j];
      
      markdown += `### Mensaje ${j + 1} - ${formatDate(email.date)}\n\n`;
      markdown += `**De:** ${email.from}\n\n`;
      markdown += `**Para:** ${email.to}\n\n`;
      if (email.cc) {
        markdown += `**CC:** ${email.cc}\n\n`;
      }
      
      if (email.attachments && email.attachments.length > 0) {
        markdown += `**📎 Archivos adjuntos (${email.attachments.length}):**\n\n`;
        for (const att of email.attachments) {
          markdown += `- ${att.filename} (${att.contentType})${att.size ? ` - ${att.size}` : ''}\n`;
        }
        markdown += `\n`;
      }
      
      markdown += `**Contenido:**\n\n`;
      markdown += `${email.body}\n\n`;
      markdown += `---\n\n`;
    }
    
    markdown += `\n\n`;
  }
  
  return markdown;
}

async function main() {
  const mboxPath = process.argv[2];
  
  if (!mboxPath) {
    console.error('❌ Error: Debes proporcionar la ruta al archivo MBOX');
    console.log('Uso: npm run extract:emails <ruta-al-archivo.mbox>');
    process.exit(1);
  }
  
  console.log('📂 Leyendo archivo MBOX...');
  const mboxContent = readFileSync(mboxPath, 'utf-8');
  console.log(`✅ Archivo leído: ${(mboxContent.length / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n📧 Parseando correos...');
  const emails = parseEmails(mboxContent);
  
  console.log('\n🧵 Agrupando en hilos de conversación...');
  const threads = groupIntoThreads(emails);
  
  console.log('\n📝 Generando documento...');
  const markdown = generateMarkdown(threads);
  
  const outputPath = join(process.cwd(), 'resumen-correos.md');
  writeFileSync(outputPath, markdown, 'utf-8');
  
  console.log(`\n✅ ¡Documento generado exitosamente!`);
  console.log(`📄 Ubicación: ${outputPath}`);
  console.log(`📊 Estadísticas:`);
  console.log(`   - Total de correos: ${emails.length}`);
  console.log(`   - Total de hilos: ${threads.length}`);
  console.log(`   - Tamaño del documento: ${(markdown.length / 1024).toFixed(2)} KB`);
}

main();
