import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { opportunityId } = await req.json();

    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunityId é obrigatório' }, { status: 400 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // 1. Buscar detalhes da oportunidade e do cliente
    const { data: opp, error: oppError } = await adminSupabase
      .from('oportunidades_seo')
      .select('*, client:clients(*)')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opp) {
      return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 });
    }

    const client = opp.client;

    // 2. Buscar Base de Conhecimento (opcional)
    const { data: kb } = await adminSupabase
      .from('knowledge_base')
      .select('*')
      .eq('client_id', client.id);

    const context = kb?.map(k => `${k.title}: ${k.content}`).join('\n') || 'Sem contexto adicional.';

    // 3. Montar Prompt para o Gemini
    const prompt = `
      Você é um especialista em SEO e Copywriting profissional.
      Seu objetivo é criar um rascunho de postagem ou conteúdo otimizado para o Google para o cliente "${client.name}".

      PALAVRA-CHAVE FOCO: "${opp.keyword}"
      CONTEXTO DO NEGÓCIO: ${client.business_context || 'Negócio local'}
      BASE DE CONHECIMENTO ADICIONAL:
      ${context}

      INSTRUÇÕES DE REDAÇÃO:
      1. Use um tom de voz profissional, amigável e focado em conversão.
      2. Inclua a palavra-chave foco naturalmente no título e no corpo do texto.
      3. Crie um conteúdo que responda à intenção de busca do usuário para essa palavra.
      4. O formato deve ser um rascunho de post (Título + Corpo).
      5. Responda apenas com o texto final, sem comentários.
    `;

    // 4. Chamar Gemini (Usando Flash para maior velocidade e estabilidade)
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    });


    const geminiData = await geminiRes.json();
    
    // Log para diagnóstico caso falhe
    if (!geminiRes.ok || geminiData.error) {
      console.error('❌ ERRO GEMINI generate-content:', JSON.stringify(geminiData));
      return NextResponse.json({ error: `Erro do Gemini: ${geminiData.error?.message || 'desconhecido'}` }, { status: 500 });
    }

    const aiContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Falha ao gerar conteúdo.";

    // 5. Salvar o rascunho no banco
    await adminSupabase
      .from('oportunidades_seo')
      .update({ 
        content_draft: aiContent,
        status: 'rascunho_gerado'
      })
      .eq('id', opportunityId);

    return NextResponse.json({ success: true, draft: aiContent });

  } catch (error: any) {
    console.error('ERRO AI GENERATOR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
