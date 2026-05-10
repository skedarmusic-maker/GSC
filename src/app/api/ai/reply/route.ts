import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { reviewText, reviewerName, rating, businessName } = await req.json();

    const prompt = `
      Você é o dono da empresa "${businessName}".
      Responda a esta avaliação do Google Maps de forma ultra-direta, humana e casual, como se estivesse mandando um WhatsApp rápido para um cliente.

      DADOS:
      - Cliente: ${reviewerName}
      - Nota: ${rating} estrelas
      - Comentário: "${reviewText || '(Sem comentário, apenas nota)'}"

      REGRAS DE OURO (Siga à risca):
      1. SE NÃO HÁ COMENTÁRIO (Apenas nota): Responda em NO MÁXIMO 10 PALAVRAS. Ex: "Valeu pelas 5 estrelas, ${reviewerName}! Volte sempre." ou "Obrigado pela nota, ${reviewerName}!"
      2. PROIBIDO: Não use "Ficamos imensamente felizes", "Sua preferência é nosso combustível", "Conte conosco", "Cordialmente".
      3. TOM: Casual e amigável. Use "Valeu", "Obrigado", "Que bom que curtiu".
      4. NOTA BAIXA (1-3): Seja direto. "Puxa, ${reviewerName}, sinto muito. O que houve? Chama a gente no privado pra resolvermos."
      5. SEM ENROLAÇÃO: Não faça introduções. Escreva apenas o texto da resposta.
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
