import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { reviewText, reviewerName, rating, businessName } = await req.json();

    // Usar apenas o primeiro nome para personalização mais natural e preservar privacidade
    const firstName = (reviewerName || '').trim().split(/\s+/)[0] || reviewerName;

    const hasComment = reviewText && reviewText.trim().length > 0;
    const commentLength = hasComment ? reviewText.trim().split(/\s+/).length : 0;

    // Define o tamanho esperado da resposta com base no contexto
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
- Cliente: ${firstName}
- Nota: ${rating}/5
- Comentário: ${hasComment ? `"${reviewText}"` : '(nenhum comentário, apenas a nota)'}

REGRAS:
1. IDIOMA DA RESPOSTA: Você deve gerar a resposta obrigatoriamente no MESMO IDIOMA do comentário do cliente. Se a avaliação não possuir comentário (apenas estrelas), tente deduzir pelo nome do cliente ou use Inglês caso pareça ser de fora do Brasil.
2. Tom: profissional e caloroso. Nunca robotizado, nunca gírias. Adapte ao contexto cultural do idioma correspondente.
3. ${sizeInstruction}
4. Para respostas em Português, é proibido começar com: "Agradecemos", "Ficamos imensamente", "Sua preferência é". Use variações naturais de abertura como: "Olá, ${firstName}!", "Obrigado, ${firstName}!", "Que ótimo, ${firstName}!".
5. Para respostas em Inglês ou outros idiomas, use aberturas naturais correspondentes (ex: "Hi, ${firstName}!", "Thanks, ${firstName}!", "Hello, ${firstName}!").
6. Se nota for 1-3: seja empático e convide para resolver. Sem defender a empresa.
7. Se nota for 4-5 sem comentário: agradeça de forma simples e direta.
8. Escreva APENAS o texto da resposta final, sem aspas, sem introdução.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 4000,
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

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiReply) {
      return NextResponse.json({ error: 'A IA não retornou uma resposta válida.' }, { status: 500 });
    }

    return NextResponse.json({ reply: aiReply.trim() });
  } catch (error) {
    console.error('Erro na IA:', error);
    return NextResponse.json({ error: 'Falha ao processar IA' }, { status: 500 });
  }
}
