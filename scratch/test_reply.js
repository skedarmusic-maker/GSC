
require('dotenv').config({ path: '.env.local' });

async function testReply(scenario, reviewText, rating) {
  const reviewerName = 'Leandro Camara';
  const businessName = 'Chaveiro Urgente 24h';
  const hasComment = reviewText && reviewText.trim().length > 0;
  const commentLength = hasComment ? reviewText.trim().split(/\s+/).length : 0;

  let sizeInstruction = '';
  if (!hasComment) {
    sizeInstruction = 'TAMANHO: Máximo 1 frase curta (até 10 palavras). Apenas um agradecimento simples e direto.';
  } else if (commentLength <= 10) {
    sizeInstruction = 'TAMANHO: 1 a 2 frases. Resposta curta e na medida.';
  } else {
    sizeInstruction = 'TAMANHO: 2 a 3 frases. Resposta completa mas sem exageros.';
  }

  const prompt = `Você responde avaliações do Google Maps para a empresa "${businessName}".

AVALIAÇÃO RECEBIDA:
- Cliente: ${reviewerName}
- Nota: ${rating}/5
- Comentário: ${hasComment ? `"${reviewText}"` : '(nenhum comentário, apenas a nota)'}

REGRAS:
1. Tom: profissional e caloroso. Nunca robotizado, nunca gírias.
2. ${sizeInstruction}
3. Proibido começar com: "Agradecemos", "Ficamos imensamente", "Sua preferência é".
4. Use variações naturais de abertura: "Olá, ${reviewerName}!", "Obrigado, ${reviewerName}!", "Que ótimo, ${reviewerName}!", etc.
5. Se nota for 1-3: seja empático e convide para resolver. Sem defender a empresa.
6. Se nota for 4-5 sem comentário: agradeça simplesmente. Nada mais.
7. Escreva APENAS o texto da resposta, sem aspas, sem introdução.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } },
      }),
    }
  );
  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ERRO: ' + JSON.stringify(data.error);
  console.log(`\n--- ${scenario} ---`);
  console.log('RESPOSTA:', reply);
}

async function run() {
  await testReply('⭐⭐⭐⭐⭐ SEM COMENTÁRIO', '', 5);
  await testReply('⭐ SEM COMENTÁRIO', '', 1);
  await testReply('⭐⭐⭐⭐⭐ COMENTÁRIO CURTO', 'Serviço de qualidade e muito profissionalismo!', 5);
  await testReply('⭐⭐⭐⭐⭐ COMENTÁRIO LONGO', 'Fui atendido rapidamente, o chaveiro chegou em menos de 15 minutos, muito profissional e simpático. O preço foi justo. Recomendo!', 5);
  await testReply('⭐ RECLAMAÇÃO', 'Péssimo atendimento, me deixaram esperando 2 horas.', 1);
}

run().catch(console.error);
