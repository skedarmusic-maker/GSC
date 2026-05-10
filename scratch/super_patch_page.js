
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Iniciando Super Patch de Correção ---');

// 1. Corrigir handleSyncDesign (estava apontando para /api/sites erroneamente)
const badSync = "const res = await fetch('/api/sites', {";
const goodSync = "const res = await fetch('/api/sites/sync-design', {";
if (content.includes(badSync)) {
    content = content.replace(badSync, goodSync);
}

// 2. Corrigir o bloco corrompido entre handleSelectClient e handleGenerateAI
// Vamos procurar o final do handleSelectClient (que termina no fetchScheduledPosts e fechar as chaves)
const selectClientEnd = "fetchScheduledPosts(locationId);";
const corruptedStart = "        body: JSON.stringify({";
const corruptedEnd = "alert('Erro ao gerar resposta com IA.');";

const startIdx = content.indexOf(selectClientEnd);
const endIdx = content.indexOf(corruptedEnd) + corruptedEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
    const head = content.substring(0, startIdx + selectClientEnd.length);
    const tail = content.substring(endIdx + 5); // +5 para pegar o fim do bloco
    
    const fixedBlock = `
     }
  };

  const handleApproveOpportunity = async (id: string) => {
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

  const handleGenerateAI = async (review: any) => {
    setGeneratingAI(prev => ({ ...prev, [review.name]: true }));
    try {
      const res = await fetch('/api/ai/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.comment,
          reviewerName: review.reviewer.displayName,
          rating: review.starRating,
          businessName: data?.maps?.title || 'nossa empresa'
        })
      });
      const result = await res.json();
      if (result.reply) {
        setReplyText(prev => ({ ...prev, [review.name]: result.reply }));
      }
    } catch (e) {
      alert('Erro ao gerar resposta com IA.');
    } finally {
      setGeneratingAI(prev => ({ ...prev, [review.name]: false }));
    }
  };`;

    content = head + fixedBlock + tail;
    console.log('✅ Bloco corrompido corrigido e funções adicionadas!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('--- Super Patch Finalizado ---');
