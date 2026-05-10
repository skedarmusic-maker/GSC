
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Iniciando Patch de Limpeza Final ---');

// 1. Procurar o final de handleGenerateAI
const generateAIStart = "const handleGenerateAI = async (review: any) => {";
const replyStart = "const handleReply = async (reviewName: string) => {";

// Vamos reconstruir todo o meio entre handleSelectClient e o final de handleReply
const selectClientMarker = "fetchScheduledPosts(locationId);";
const replyEndMarker = "catch(e) { alert('Erro ao responder a avaliação.'); }";

const startIdx = content.indexOf(selectClientMarker);
const endIdx = content.indexOf(replyEndMarker) + replyEndMarker.length + 6; // +6 para pegar o }; final

if (startIdx !== -1 && endIdx !== -1) {
    const head = content.substring(0, startIdx + selectClientMarker.length);
    const tail = content.substring(endIdx);
    
    const cleanBlock = `
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
  };

  const handleReply = async (reviewName: string) => {
    const text = replyText[reviewName];
    if (!text) return;
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewName, replyText: text })
      });
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);
      alert('Resposta enviada com sucesso ao Google Maps!');
      setReplyText({ ...replyText, [reviewName]: '' });
      if (data?.maps) fetchLocalProfile(data.maps.accountId, data.maps.locationId);
    } catch(e) { alert('Erro ao responder a avaliação.'); }
  };`;

    content = head + cleanBlock + tail;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Tudo limpo e reconstruído com sucesso!');
} else {
    console.log('❌ Marcadores não encontrados!');
}
