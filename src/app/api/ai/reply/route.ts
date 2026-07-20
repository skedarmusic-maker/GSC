import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { reviewText, reviewerName, rating, businessName } = await req.json();

    // Extração do primeiro nome limpo
    const firstName = (reviewerName || '').trim().split(/\s+/)[0] || reviewerName || 'Cliente';

    const hasComment = reviewText && reviewText.trim().length > 0;
    const commentLength = hasComment ? reviewText.trim().split(/\s+/).length : 0;

    // Calcular período do dia no fuso de Brasília (UTC-3)
    const nowBRT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const hour = nowBRT.getHours();
    let timeGreeting = 'Bom dia';
    if (hour >= 12 && hour < 18) {
      timeGreeting = 'Boa tarde';
    } else if (hour >= 18 || hour < 5) {
      timeGreeting = 'Boa noite';
    }

    const numericRating = Number(rating) || 5;
    let selectedGreeting = '';

    if (numericRating <= 3) {
      const negativeGreetings = [
        `Olá, ${firstName}.`,
        `Olá, ${firstName}, tudo bem?`,
        `Prezado(a) ${firstName},`,
        `${timeGreeting}, ${firstName}.`,
        `Lamentamos por essa experiência, ${firstName}.`,
        `Pedimos desculpas pelo transtorno, ${firstName}.`
      ];
      selectedGreeting = negativeGreetings[Math.floor(Math.random() * negativeGreetings.length)];
    } else {
      const positiveGreetings = [
        `Oi, ${firstName}!`,
        `Oi, ${firstName}, tudo bem?`,
        `Olá, ${firstName}!`,
        `Olá, ${firstName}, tudo bem?`,
        `Tudo bem, ${firstName}?`,
        `${timeGreeting}, ${firstName}!`,
        `${timeGreeting}, ${firstName}, tudo bem?`,
        `Prezado(a) ${firstName},`,
        `Muito obrigado pelo carinho, ${firstName}!`,
        `Ficamos radiantes com a sua avaliação, ${firstName}!`,
        `Que satisfação ler seu comentário, ${firstName}!`,
        `Valeu demais pelo feedback, ${firstName}!`,
        `Agradecemos imensamente suas palavras, ${firstName}!`,
        `Que notícia excelente, ${firstName}!`,
        `Muito obrigado pela confiança, ${firstName}!`,
        `É uma alegria enorme ter seu feedback, ${firstName}!`,
        `Sensacional a sua avaliação, ${firstName}!`,
        `A equipe toda agradece o carinho, ${firstName}!`,
        `Que privilégio atender você, ${firstName}!`,
        `Muito bom saber da sua satisfação, ${firstName}!`,
        `Agradecemos de coração, ${firstName}!`,
        `Que energia boa ler seu recado, ${firstName}!`
      ];
      selectedGreeting = positiveGreetings[Math.floor(Math.random() * positiveGreetings.length)];
    }

    // Define o tamanho esperado para o CORPO da resposta
    let sizeInstruction = '';
    if (!hasComment) {
      sizeInstruction = 'Tamanho do corpo: Apenas 1 frase curta complementando a saudação com carinho e colocando a empresa à disposição.';
    } else if (commentLength <= 10) {
      sizeInstruction = 'Tamanho do corpo: 1 a 2 frases curtas complementando o feedback do cliente.';
    } else {
      sizeInstruction = 'Tamanho do corpo: 2 frases completas comentando especificamente os pontos citados pelo cliente.';
    }

    const prompt = `Você é o gestor de atendimento da empresa "${businessName}". Sua missão é escrever APENAS O CORPO COMPLEMENTAR de uma resposta a uma avaliação no Google Maps.

DADOS DA AVALIAÇÃO:
- Cliente: ${firstName}
- Nota: ${numericRating}/5 estrelas
- Comentário do Cliente: ${hasComment ? `"${reviewText}"` : '(nenhum comentário, apenas avaliou com estrelas)'}

REGRAS DE CONTEÚDO (CRÍTICO - LEIA COM ATENÇÃO):
1. 🚨 NÃO INCLUA NENHUMA SAUDAÇÃO OU NOME DO CLIENTE! A saudação inicial (como "Oi", "Olá", "Bom dia", "Prezado", "Muito obrigado") JÁ FOI INSERIDA SEPARADAMENTE PELO SISTEMA.
2. 🚨 PROIBIÇÃO DE CLICHÊS INICIAIS: É ESTRITAMENTE PROIBIDO começar o seu texto com as expressões "Ficamos felizes", "Ficamos muito felizes", "Agradecemos", "É um prazer", "Olá" ou "Oi". Comece DIRETO na frase de ação ou comentário sobre a experiência.
3. Se a nota for 4-5 estrelas:
   - Se houver comentário: destaque o compromisso da equipe com o ponto elogiado pelo cliente.
   - Se não houver comentário: mencione que a casa/empresa está sempre de portas abertas para recebê-lo de novo.
4. Se a nota for 1-3 estrelas: mostre empatia, afirme que a prioridade é a excelência no atendimento e convide o cliente para conversar em canal privado para resolver.
5. ${sizeInstruction}
6. Escreva APENAS o texto do corpo, sem aspas, sem saudações.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.95,
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

    let aiBody = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!aiBody) {
      return NextResponse.json({ error: 'A IA não retornou uma resposta válida.' }, { status: 500 });
    }

    // Limpeza de qualquer clichê ou saudação acidental que a IA possa ter colocado no início do corpo
    aiBody = aiBody.replace(/^(Ficamos (muito )?felizes|Agradecemos( muito| imensamente)?|É um prazer|Olá|Oi|Bom dia|Boa tarde|Boa noite|Prezado\(a\)?)[^.!\n,]*[,.!\n]?\s*/i, '');

    // Garantir primeira letra maiúscula após a limpeza
    if (aiBody.length > 0) {
      aiBody = aiBody.charAt(0).toUpperCase() + aiBody.slice(1);
    }

    // Unir a saudação sorteada em TypeScript com o corpo da IA
    const finalReply = `${selectedGreeting} ${aiBody}`;

    return NextResponse.json({ reply: finalReply.trim() });
  } catch (error) {
    console.error('Erro na IA:', error);
    return NextResponse.json({ error: 'Falha ao processar IA' }, { status: 500 });
  }
}
