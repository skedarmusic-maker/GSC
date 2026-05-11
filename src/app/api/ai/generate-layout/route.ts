import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { opportunityId } = await request.json();
    
    // 1. Puxar a oportunidade e os dados do cliente dono dela
    const { data: opp, error: oppError } = await supabase
      .from('oportunidades_seo')
      .select('*, clients(name, design_context)')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opp) return NextResponse.json({ success: false, error: 'Oportunidade não encontrada' });

    const clientName = opp.clients?.name || 'Cliente';
    const stitchPrompt = opp.clients?.stitch_prompt || opp.clients?.design_context?.stitch_prompt || 'Design limpo, profissional e moderno.';

    // 2. Gerar o Layout (Stitch Automático + Dinâmico)
    const prompt = `Você é o "Stitch", um expert em desenvolvimento Next.js e design UI.
Você deve criar o código fonte de uma página para a keyword "${opp.keyword}" do cliente "${clientName}".
Aqui está o texto base que foi gerado: 
${opp.content_draft}

REGRAS DE DESIGN ESPECÍFICAS DESTE CLIENTE:
${stitchPrompt}

- Use componentes tailwind.
- Crie a estrutura de uma page.tsx do Next.js (export default function Page() { ... }) com metadados SEO.

Retorne APENAS o código TSX completo, sem markdown, sem crases, apenas o código bruto para ser salvo no arquivo.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const geminiData = await geminiRes.json();
    let layoutCode = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Limpar crases caso o modelo teimoso inclua
    layoutCode = layoutCode.replace(/^```tsx?\n/, '').replace(/^```\n/, '').replace(/```$/, '');

    // 3. Salvar no Banco
    // Nota: Requer a coluna layout_draft criada no Supabase!
    const { error: updateError } = await supabase
      .from('oportunidades_seo')
      .update({ layout_draft: layoutCode, status: 'layout_gerado' })
      .eq('id', opportunityId);

    if (updateError) {
      console.error('Erro ao salvar layout no Supabase:', updateError);
      return NextResponse.json({ success: false, error: updateError.message });
    }

    return NextResponse.json({ success: true, layout_draft: layoutCode });
  } catch (error: any) {
    console.error('Erro na API generate-layout:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
