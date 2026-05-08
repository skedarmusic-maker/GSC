require('dotenv').config();

async function testAI() {
  const key = process.env.GEMINI_API_KEY;
  console.log('--- TESTE REAL DE IA ---');
  console.log('Chave:', key?.substring(0, 10) + '...');
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  
  for (const model of models) {
    console.log(`\nTestando modelo: ${model}...`);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Oi' }] }] })
      });
      const data = await res.json();
      
      if (res.ok) {
        console.log(`✅ SUCESSO com ${model}!`);
        console.log('Resposta:', data.candidates?.[0]?.content?.parts?.[0]?.text);
        return;
      } else {
        console.log(`❌ ERRO com ${model}:`, data.error?.message || data.error);
      }
    } catch (e) {
      console.error(`Falha técnica no teste do ${model}:`, e.message);
    }
  }
}

testAI();
