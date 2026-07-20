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

    // Sorteio matemático da saudação em TypeScript para garantir 100% de diversidade a cada requisição
    let selectedGreeting = '';
    const numericRating = Number(rating) || 5;

    if (numericRating <= 3) {
      const negativeGreetings = [
        `Olá, ${firstName}.`,
        `Olá, ${firstName}, tudo bem?`,
        `Prezado(a) ${firstName},`,
        `${timeGreeting}, ${firstName}.`,
        `Lamentamos por essa experiência, ${firstName}.`
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
        `Ficamos muito felizes com a sua avaliação, ${firstName}!`,
        `Que satisfação ler seu comentário, ${firstName}!`,
        `Valeu demais pelo feedback, ${firstName}!`,
        `Agradecemos imensamente suas palavras, ${firstName}!`,
        `Que notícia excelente, ${firstName}!`,
        `Muito obrigado pela confiança, ${firstName}!`
      ];
      selectedGreeting = positiveGreetings[Math.floor(Math.random() * positiveGreetings.length)];
    }

    // Define o tamanho esperado da resposta
    let sizeInstruction = '';
    if (!hasComment) {
      sizeInstruction = 'Tamanho: 1 frase curta após a saudação, apenas complementando o agradecimento.';
    } else if (commentLength <= 10) {
      sizeInstruction = 'Tamanho: 1 a 2 frases curtas após a saudação.';
    } else {
      sizeInstruction = 'Tamanho: 2 frases completas após a saudação, comentando o feedback do cliente.';
    }

    const prompt = `Você é o gestor de atendimento da empresa "${businessName}". Sua missão é escrever o complemento de uma resposta humanizada para a avaliação de um cliente no Google Maps.

DADOS DA AVALIAÇÃO:
- Cliente: ${firstName}
- Nota: ${numericRating}/5 estrelas
- Comentário do Cliente: ${hasComment ? `"${reviewText}"` : '(nenhum comentário, apenas avaliou com estrelas)'}

SAUDAÇÃO DE ABERTURA SELECIONADA (OBRIGATÓRIO):
"${selectedGreeting}"

REGRAS RÍGIDAS DE GERAÇÃO:
1. A resposta FINAL DEVE COMEÇAR EXATAMENTE com a saudação "${selectedGreeting}".
2. Após essa saudação predefinida, desenvolva a mensagem de acordo com a nota e o comentário.
3. NÃO repita a saudação nem o nome do cliente novamente no meio ou no fim do texto.
4. ${sizeInstruction}
5. Escreva APENAS o texto completo da resposta final (saudação + complemento), pronto para publicar. Sem aspas ou explicações.`;

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

    let aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!aiReply) {
      return NextResponse.json({ error: 'A IA não retornou uma resposta válida.' }, { status: 500 });
    }

    // Garantir que a saudação sorteada seja o início exato do texto
    if (!aiReply.startsWith(selectedGreeting)) {
      // Remove qualquer saudação duplicada no início gerada pela IA
      aiReply = aiReply.replace(/^(Olá|Oi|Bom dia|Boa tarde|Boa noite|Prezado\(a\)|Prezado|Muito obrigado|Ficamos|Que satisfação|Valeu|Agradecemos)[^.!\n]*[.!\n]?\s*/i, '');
      aiReply = `${selectedGreeting} ${aiReply}`;
    }

    return NextResponse.json({ reply: aiReply.trim() });
  } catch (error) {
    console.error('Erro na IA:', error);
    return NextResponse.json({ error: 'Falha ao processar IA' }, { status: 500 });
  }
}
