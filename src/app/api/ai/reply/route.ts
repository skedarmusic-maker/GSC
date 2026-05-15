import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { reviewText, reviewerName, rating, businessName } = await req.json();

    const prompt = `
      Você é o responsável pelo atendimento da empresa "${businessName}".
      Sua missão é responder a avaliações do Google Maps de forma PROFISSIONAL, HUMANA e VARIADA.
      O tom deve ser respeitoso e acolhedor (jamais use gírias como "valeu", "curtiu", "parceria", "mano", "tmj"), sem usar linguagem robótica ou clichês corporativos ultrapassados.

      DADOS:
      - Cliente: ${reviewerName}
      - Nota: ${rating} estrelas
      - Comentário: "${reviewText || '(Sem comentário, apenas nota)'}"

      DIRETRIZES OBRIGATÓRIAS:
      1. SE NÃO HÁ COMENTÁRIO (apenas nota): A resposta DEVE ter no MÁXIMO 12 palavras. Seja ultra-breve e direto. Ex: "Obrigado pela nota, ${reviewerName}! Ficamos à disposição."
      2. NOTA BAIXA (1-3): Seja cordial e empático. Ex: "Olá, ${reviewerName}, sinto muito que sua experiência não tenha sido ideal. Por favor, entre em contato conosco para resolvermos."
      3. VARIAÇÃO: Não comece todas as respostas com "Agradecemos". Use aberturas como "Olá, ${reviewerName}", "Que excelente feedback", "Ficamos felizes em saber".
      4. SEM CLICHÊS: Proibido usar "Sua preferência é nosso combustível", "Ficamos imensamente felizes", "Conte conosco".
      5. DIRETO AO PONTO: Escreva apenas o texto final da resposta, sem introduções.
    `;

    // Usando gemini-2.5-flash (modelo mais recente disponível)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500, // Respostas de review não precisam de 2048 tokens
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
      console.error('❌ LIMITE DE COTA GEMINI EXCEDIDO');
      return NextResponse.json({ error: 'Limite de cota atingido. Tente novamente em alguns minutos.' }, { status: 429 });
    }

    if (data.error) {
      console.error('❌ ERRO GEMINI API:', JSON.stringify(data.error));
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiReply) {
      console.error('❌ RESPOSTA VAZIA DO GEMINI:', JSON.stringify(data));
      return NextResponse.json({ error: 'A IA não retornou uma resposta válida.' }, { status: 500 });
    }

    return NextResponse.json({ reply: aiReply.trim() });
  } catch (error) {
    console.error('Erro na IA:', error);
    return NextResponse.json({ error: 'Falha ao processar IA' }, { status: 500 });
  }
}
