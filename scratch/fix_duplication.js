
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Corrigindo Definição Duplicada ---');

// Vamos remover a versão duplicada que eu adicionei (por volta da linha 421)
// A versão correta é a que está no topo do arquivo (linha 159)
const duplicateToSearch = `  const handleApproveOpportunity = async (id: string) => {
    try {
        const res = await fetch('/api/opportunities', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'aprovada' })
        });
        if (res.ok) {
            setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: 'aprovada' } : o));
        }
    } catch (e) { console.error(e); }
  };`;

if (content.includes(duplicateToSearch)) {
    content = content.replace(duplicateToSearch, '');
    console.log('✅ Definição duplicada removida!');
} else {
    console.log('⚠️ Não encontrei a duplicidade exata. Vou tentar uma busca mais flexível.');
    // Tenta uma busca mais simples se a exata falhar
    const startMarker = "const handleApproveOpportunity = async (id: string) => {";
    const endMarker = "} catch (e) { console.error(e); }\n  };";
    const startIdx = content.lastIndexOf(startMarker); // Pega a ÚLTIMA ocorrência (a duplicada)
    if (startIdx !== -1) {
        const tempTail = content.substring(startIdx);
        const endIdx = tempTail.indexOf(endMarker) + endMarker.length;
        content = content.substring(0, startIdx) + tempTail.substring(endIdx);
        console.log('✅ Definição duplicada removida via busca flexível!');
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('--- Correção Finalizada ---');
