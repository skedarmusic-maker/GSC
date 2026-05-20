import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { topic, businessName } = await req.json();

    if (!topic || !businessName) {
      return NextResponse.json({ error: 'Tópico e nome da empresa são obrigatórios.' }, { status: 400 });
    }

    const prompt = `Você atua como um Social Media Estrategista Especializado em Perfil de Empresas no Google (Google Business Profile).
Sua missão é criar uma atualização/postagem de alta conversão para a empresa "${businessName}".

ASSUNTO DO POST / TÓPICO / IDEIA:
"${topic}"

REGRAS:
1. Tom: Profissional, atrativo e focado em engajamento local. Se comunique diretamente com o cliente.
2. Tamanho: Ideal entre 40 a 70 palavras (cerca de 2 a 3 parágrafos curtos). Seja direto.
3. Formatação: Quebre em parágrafos para facilitar a leitura.
4. Emojis: Use de 2 a 3 emojis no máximo, de forma estratégica, para dar vida ao post.
5. Estrutura recomendada: (1) Gancho/Atenção, (2) Valor/Benefício, (3) Convite final para ação (Call to Action sutil).
6. Escreva APENAS o texto da postagem final, sem aspas, sem marcações markdown extra de título. Não insira saudações ao "usuário" ou frases como "Aqui está sua postagem".
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
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
      console.error('❌ ERRO GEMINI POSTS:', JSON.stringify(data.error));
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const aiPost = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiPost) {
      return NextResponse.json({ error: 'A IA não retornou um texto válido.' }, { status: 500 });
    }

    return NextResponse.json({ postText: aiPost.trim() });
  } catch (error) {
    console.error('Erro na IA de Posts:', error);
    return NextResponse.json({ error: 'Falha ao processar IA para postagem' }, { status: 500 });
  }
}
