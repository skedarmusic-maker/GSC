import { NextResponse } from 'next/server';

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
      1. Comece saudando o cliente pelo nome.
      2. Se a nota for 4 ou 5 estrelas, seja alegre e agradeça a confiança.
      3. Se a nota for 1, 2 ou 3 estrelas, seja empático, peça desculpas se necessário e convide o cliente a conversar no privado para resolver.
      4. Use um tom humano, não pareça um robô.
      5. A resposta deve ter no máximo 3 ou 4 frases.
      6. Responda sempre em Português Brasileiro.

      Gere apenas o texto da resposta, sem introduções ou explicações.
    `;

    // Usando a configuração EXATA que funciona no seu projeto da Samsung
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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
