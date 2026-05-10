const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');

let braces = 0, parens = 0, brackets = 0;
let inString = false, strChar = '';
let inLineComment = false, inBlockComment = false;
const problems = [];

for (let i = 0; i < Math.min(670, lines.length); i++) {
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
      if (ch === strChar) inString = false;
      continue;
    }

    if (ch === '/' && next === '/') { inLineComment = true; break; }
    if (ch === '/' && next === '*') { inBlockComment = true; j++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inString = true; strChar = ch; continue; }

    if (ch === '{') braces++;
    else if (ch === '}') { braces--; }
    else if (ch === '(') parens++;
    else if (ch === ')') { parens--; }
    else if (ch === '[') brackets++;
    else if (ch === ']') { brackets--; }

    if (braces < 0 || parens < 0 || brackets < 0) {
      problems.push(`DESEQUILÍBRIO linha ${i + 1}: {=${braces} (=${parens} [=${brackets} >> ${line.trim().substring(0, 80)}`);
      braces = Math.max(braces, 0);
      parens = Math.max(parens, 0);
      brackets = Math.max(brackets, 0);
    }
  }
}

if (problems.length > 0) {
  console.log('=== PROBLEMAS ENCONTRADOS ===');
  problems.forEach(p => console.log(p));
} else {
  console.log('Nenhum desequilíbrio detectado linha a linha.');
}

console.log('\n=== SALDO FINAL (linhas 1-670) ===');
console.log('Chaves {}:       ' + braces + '  (esperado: 1 = dentro de Dashboard)');
console.log('Parênteses ():   ' + parens + '  (esperado: 0)');
console.log('Colchetes []:    ' + brackets + '  (esperado: 0)');

// Exibir as linhas ao redor da 665-671 para análise visual
console.log('\n=== CONTEXTO LINHAS 662-671 ===');
for (let i = 661; i < 671; i++) {
  console.log((i + 1) + ': ' + lines[i]);
}
