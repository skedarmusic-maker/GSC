/**
 * Corrige o arquivo page.tsx:
 * 1. Remove BOM UTF-8 se existir
 * 2. Normaliza todos os finais de linha para \r\n (padrão Windows/CRLF)
 * 3. Garante que não haja caracteres de controle inválidos
 */
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Tamanho original:', content.length, 'bytes');
console.log('Tem BOM?', content.charCodeAt(0) === 0xFEFF ? 'SIM - REMOVENDO' : 'Não');

// 1. Remove BOM se existir
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
  console.log('BOM removido.');
}

// 2. Detectar caracteres de controle inválidos (exceto \r, \n, \t)
const invalidChars = [];
for (let i = 0; i < content.length; i++) {
  const code = content.charCodeAt(i);
  if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
    invalidChars.push({ pos: i, code, hex: code.toString(16) });
  }
}

if (invalidChars.length > 0) {
  console.log('\n=== CARACTERES DE CONTROLE INVÁLIDOS ENCONTRADOS ===');
  invalidChars.slice(0, 20).forEach(c => {
    // Mostrar contexto em volta do caractere
    const start = Math.max(0, c.pos - 30);
    const end = Math.min(content.length, c.pos + 30);
    const ctx = content.slice(start, end).replace(/[\r\n]/g, '↵');
    console.log(`  Posição ${c.pos}, hex: 0x${c.hex} >> ...${ctx}...`);
  });
  
  // Remove os caracteres inválidos
  content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  console.log(`\n${invalidChars.length} caractere(s) inválido(s) removido(s).`);
} else {
  console.log('Nenhum caractere de controle inválido encontrado.');
}

// 3. Normalizar finais de linha para LF puro (\n) - padrão do Next.js/SWC
const original = content;
content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const changedLineEndings = (original !== content);
console.log('Finais de linha normalizados para LF:', changedLineEndings ? 'SIM' : 'Já estavam OK');

// 4. Salvar
fs.writeFileSync(filePath, content, 'utf8');
console.log('\nArquivo salvo com sucesso!');
console.log('Tamanho final:', content.length, 'bytes');
