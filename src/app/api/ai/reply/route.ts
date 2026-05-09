import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { reviewText, reviewerName, rating, businessName } = await req.json();

    const prompt = `
      Você é um gerente de suporte ao cliente profissional e empático da empresa "${businessName}".
      Seu objetivo é responder a uma avaliação no Google Maps de forma cordial, personalizada e que incentive o cliente a voltar.

      DADOS DA AVALIAÇÃO:
      - Cliente: ${reviewerName}
      - Nota: ${rating} estrelas
      - Comentário: "${reviewText || '(Sem comentário, apenas nota)'}"

      DIRETRIZES DA RESPOSTA:
      1. PROPORCIONALIDADE (CRÍTICO): Se o comentário do cliente for curto (menos de 5 palavras) ou inexistente (apenas nota), a resposta DEVE ser curta, direta e amigável (máximo 1 ou 2 frases). Ex: "Obrigado pelas estrelas, [Nome]! Ficamos felizes que gostou."
      2. TOM HUMANO: Evite palavras rebuscadas como "magnânima", "preclaro", "imensamente honrado", "sua preferência é nosso combustível". Use linguagem do dia a dia, como se estivesse conversando com um cliente na sua loja.
      3. PERSONALIZAÇÃO: Comece saudando pelo nome. Se houver comentário, mencione algo do que ele disse. Se não houver, apenas agradeça a avaliação positiva.
      4. NOTAS BAIXAS: Para 1 a 3 estrelas, seja empático, não se defenda, peça desculpas e peça para entrar em contato para resolver (sem prometer mundos e fundos).
      5. FORMATO: Sem introduções. Apenas o texto da resposta. Responda em Português Brasileiro.
    `;

    // Usando o nome exato do modelo disponível na sua conta (gemini-flash-latest)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();
    
    if (response.status === 429) {
      return NextResponse.json({ error: 'Limite de cota atingido. O Google está processando seu faturamento. Tente novamente em alguns minutos.' }, { status: 429 });
    }

    if (data.error) {
      console.error('Resposta de erro do Google Gemini:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar resposta com IA.";

    return NextResponse.json({ reply: aiReply.trim() });
  } catch (error) {
    console.error('Erro na IA:', error);
    return NextResponse.json({ error: 'Falha ao processar IA' }, { status: 500 });
  }
}
