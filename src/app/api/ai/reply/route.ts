import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { reviewText, reviewerName, rating, businessName } = await req.json();

    // Usar apenas o primeiro nome para personalização mais natural
    const firstName = (reviewerName || '').trim().split(/\s+/)[0] || reviewerName || 'Cliente';

    const hasComment = reviewText && reviewText.trim().length > 0;
    const commentLength = hasComment ? reviewText.trim().split(/\s+/).length : 0;

    // Calcular período do dia no fuso de Brasília (UTC-3) para saudações temporais
    const nowBRT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const hour = nowBRT.getHours();
    let timeGreeting = 'Bom dia';
    if (hour >= 12 && hour < 18) {
      timeGreeting = 'Boa tarde';
    } else if (hour >= 18 || hour < 5) {
      timeGreeting = 'Boa noite';
    }

    // Define o tamanho esperado da resposta com base no contexto
    let sizeInstruction = '';
    if (!hasComment) {
      sizeInstruction = 'TAMANHO: Máximo 1 a 2 frases curtas. Um agradecimento simples, caloroso e direto.';
    } else if (commentLength <= 10) {
      sizeInstruction = 'TAMANHO: 2 frases. Resposta concisa e objetiva.';
    } else {
      sizeInstruction = 'TAMANHO: 2 a 3 frases. Resposta completa, citando pontualmente o feedback do cliente.';
    }

    const prompt = `Você é o gestor de atendimento da empresa "${businessName}". Sua missão é criar uma resposta 100% humanizada, calorosa e DIVERSIFICADA para a avaliação de um cliente no Google Maps.

DADOS DA AVALIAÇÃO:
- Cliente: ${firstName} (Nome completo: ${reviewerName || 'Cliente'})
- Nota: ${rating}/5 estrelas
- Comentário do Cliente: ${hasComment ? `"${reviewText}"` : '(nenhum comentário, apenas avaliou com estrelas)'}
- Período do Dia Atual: ${timeGreeting}

REGRAS CRÍTICAS DE HUMANIZAÇÃO E DIVERSIDADE (MANDATÓRIO):
1. 🚨 PROIBIÇÃO DE PADRÕES REPETITIVOS: É ESTRITAMENTE PROIBIDO responder sempre com a mesma saudação! Varie o estilo de abertura a cada resposta.
   - NUNCA use saudações duplicadas ou estranhas como "Olá.. Olá" ou "Olá Olá".
   - Alterne de forma natural entre estes estilos de abertura em Português:
     * Estilo Informal/Amigável: "Oi, ${firstName}!", "Olá, ${firstName}, tudo bem?", "Tudo bem, ${firstName}?"
     * Estilo Temporal: "${timeGreeting}, ${firstName}!" ou "${timeGreeting}, tudo bem?"
     * Estilo Cordial/Respeitoso: "Prezado(a) ${firstName},", "Prezado cliente,"
     * Estilo Direto de Agradecimento: "Muito obrigado pelo carinho, ${firstName}!", "Ficamos super felizes com sua avaliação, ${firstName}!", "Que satisfação ler seu comentário, ${firstName}!", "Valeu demais pelo feedback, ${firstName}!"
2. IDIOMA DA RESPOSTA: Responda no MESMO IDIOMA do comentário do cliente. Se a avaliação não possuir comentário (apenas estrelas), responda em Português (ou Inglês se o nome do cliente for claramente internacional).
3. ADAPTAÇÃO AO CONTEÚDO E NOTA:
   - Respostas de 4-5 estrelas: Mostre alegria sincera, agradeça pela preferência e reforce a satisfação em atendê-lo.
   - Respostas de 1-3 estrelas: Seja empático, humilde, sem tom defensivo, e convide o cliente para conversar em canal privado (ex: WhatsApp ou telefone) para solucionar o problema.
4. ${sizeInstruction}
5. Escreva APENAS o texto final da resposta, sem aspas, sem saudações genéricas repetidas, sem introdução de IA.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2000,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    const data = await response.json();

    if (response.status === 429) {
      return NextResponse.json({ error: 'Limite de cota atingido. Tente novamente em alguns minutos.' }, { status: 429 });
    }

    if (data.error) {
      console.error('❌ ERRO GEMINI:', JSON.stringify(data.error));
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    let aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiReply) {
      return NextResponse.json({ error: 'A IA não retornou uma resposta válida.' }, { status: 500 });
    }

    // Limpeza de possíveis artefatos de duplicação de saudação no início
    aiReply = aiReply.trim().replace(/^(Olá[\.\,\s]*)+/i, 'Olá, ');
    if (aiReply.startsWith('Olá, Olá')) {
      aiReply = aiReply.replace(/^Olá,\s*Olá,?\s*/i, 'Olá, ');
    }

    return NextResponse.json({ reply: aiReply.trim() });
  } catch (error) {
    console.error('Erro na IA:', error);
    return NextResponse.json({ error: 'Falha ao processar IA' }, { status: 500 });
  }
}
