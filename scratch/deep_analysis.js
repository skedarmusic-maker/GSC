/**
 * Análise profunda de sintaxe TypeScript/TSX do page.tsx
 * Foca em detectar problemas específicos que o SWC detectaria
 */
const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');

console.log('Total de linhas:', lines.length);

// Estratégia: usar o próprio Node para tentar transpilar (sem JSX)
// E usar análise de padrões conhecidos problemáticos

// 1. Detectar arrow functions sem corpo fechado corretamente
console.log('\n=== VERIFICAÇÃO DE TEMPLATE LITERALS NÃO FECHADOS ===');
let templateCount = 0;
let inString = false;
let strChar = '';
let inLineComment = false;
let inBlockComment = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  inLineComment = false;
  
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    const next = line[j + 1];
    
    if (inBlockComment) {
      if (ch === '*' && next === '/') { inBlockComment = false; j++; }
      continue;
    }
    if (inLineComment) break;
    
    if (inString) {
      if (ch === '\\') { j++; continue; }
      if (ch === strChar && strChar !== '`') { inString = false; strChar = ''; }
      else if (ch === '`') { 
        templateCount--;
        inString = false; 
        strChar = ''; 
      }
      continue;
    }
    
    if (ch === '/' && next === '/') { inLineComment = true; break; }
    if (ch === '/' && next === '*') { inBlockComment = true; j++; continue; }
    if (ch === '"') { inString = true; strChar = '"'; continue; }
    if (ch === "'") { inString = true; strChar = "'"; continue; }
    if (ch === '`') { 
      inString = true; 
      strChar = '`'; 
      templateCount++;
      continue;
    }
  }
  
  // Reportar se temos templates abertos ao final de uma linha (pode ser OK, mas vale checar)
  if (i > 440 && i < 670 && templateCount > 0) {
    process.stdout.write(`Linha ${i+1}: ${templateCount} template(s) aberto(s) | `);
    console.log(line.trim().substring(0, 60));
  }
}

console.log('\n=== PADRÕES PROBLEMÁTICOS CONHECIDOS ===');

// 2. Procurar por return statements dentro de funções não-componentes
// que poderiam enganar o parser sobre o contexto JSX
const returnJsxPattern = /^\s+return\s*\(/;
const functionPattern = /^\s*(const|function|async function)\s+\w+/;

let inFunctionContext = [];
for (let i = 440; i < 680; i++) {
  const line = lines[i];
  if (!line) continue;
  
  if (functionPattern.test(line)) {
    const match = line.match(/\s+(const|function|async function)\s+(\w+)/);
    if (match) {
      inFunctionContext.push({ name: match[2], line: i + 1 });
    }
  }
  
  if (returnJsxPattern.test(line)) {
    console.log(`RETURN JSX na linha ${i + 1}: ${line.trim()}`);
    console.log(`  Contexto de funções abertas: ${inFunctionContext.map(f => f.name + ':L' + f.line).join(', ')}`);
  }
}

// 3. Verificar se há um activeTab definido fora do lugar
console.log('\n=== VERIFICAÇÃO ESPECÍFICA - activeTab ===');
for (let i = 440; i < 670; i++) {
  const line = lines[i];
  if (line && line.includes('activeTab')) {
    console.log(`Linha ${i + 1}: ${line.trim().substring(0, 80)}`);
  }
}

// 4. Verificar as últimas 10 linhas antes do return para garantir que não há nada suspeito
console.log('\n=== LINHAS 655-671 (contexto completo antes do return) ===');
for (let i = 654; i < 671; i++) {
  const l = lines[i];
  // Mostrar código hexadecimal dos primeiros chars se suspeito
  const hex = Array.from(l.slice(0, 5)).map(c => c.charCodeAt(0).toString(16)).join(' ');
  console.log(`${i + 1} [${hex}]: ${l}`);
}
