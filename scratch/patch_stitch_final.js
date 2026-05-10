
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Iniciando Patch de Integração Stitch ---');

// 1. Restaurar handleSyncDesign se eu quebrei
const brokenSync = "const res = await fetch('/api/sites', {";
const fixedSync = "const res = await fetch('/api/sites/sync-design', {";
if (content.includes(brokenSync)) {
    content = content.replace(brokenSync, fixedSync);
    console.log('✅ handleSyncDesign restaurado!');
}

// 2. Adicionar handleApproveOpportunity e handleViewLayout
const searchPoint = "  const handleGenerateAI = async (review: any) => {";
const insertion = `  const handleApproveOpportunity = async (id: string) => {
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
  };

  const handleViewLayout = async (opp: any) => {
    alert('🎨 Antigravity está gerando o layout no Stitch baseado neste rascunho. Aguarde alguns segundos...');
    try {
        const res = await fetch('/api/ai/generate-layout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ opportunityId: opp.id, clientId: selectedClient.id, content: opp.content_draft })
        });
        const data = await res.json();
        if (data.success) {
            alert('✨ Layout gerado no Stitch! O Antigravity vai te mostrar a prévia em instantes.');
        }
    } catch (e) { console.error(e); }
  };

  const handleGenerateAI = async (review: any) => {`;

if (content.includes(searchPoint) && !content.includes('handleViewLayout')) {
    content = content.replace(searchPoint, insertion);
    console.log('✅ Funções de Aprovação e Layout adicionadas!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('--- Patch Finalizado ---');
