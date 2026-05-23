import { NextResponse } from 'next/server';
import { listSites } from '@/lib/gsc';
import { listLocations } from '@/lib/business';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    console.log(`🔍 DIAGNÓSTICO VERCEL: Tentando conectar em ${url.substring(0, 20)}...`);

    // Criar cliente admin para ignorar RLS e garantir que o Dashboard veja os dados
    const adminSupabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // 1. Tentar buscar do banco de dados (Supabase)
    let { data: dbClients, error: dbError } = await adminSupabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (dbError) throw dbError;
    
    console.log(`📡 API SITES: ${dbClients?.length || 0} clientes encontrados no banco.`);

    // 2. Se o banco estiver vazio, fazemos o seeding automático (Primeiro Acesso)
    if (!dbClients || dbClients.length === 0) {
      console.log('🔄 Banco de dados vazio. Iniciando sincronização inicial...');
      
      const [gscSites, gbpLocations] = await Promise.all([
        listSites().catch(() => []), 
        listLocations().catch(() => [])
      ]);

      const unified: any[] = [];

      // Mapear GBP
      for (const loc of gbpLocations) {
        unified.push({
          name: loc.title,
          gbp_account_id: loc.accountId,
          gbp_location_id: loc.name.replace('locations/', ''),
          website_url: loc.websiteUri,
          gsc_url: null 
        });
      }

      // Mapear GSC e vincular
      for (const site of gscSites) {
        if (!site.siteUrl) continue;
        const cleanGscUrl = site.siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
        
        let found = false;
        for (const item of unified) {
          if (item.website_url) {
            const cleanLocUrl = item.website_url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
            if (cleanLocUrl === cleanGscUrl || cleanLocUrl.includes(cleanGscUrl) || cleanGscUrl.includes(cleanLocUrl)) {
              item.gsc_url = site.siteUrl;
              found = true;
              break;
            }
          }
        }
        if (!found) {
          unified.push({
            name: site.siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, ''),
            gsc_url: site.siteUrl,
            website_url: site.siteUrl.startsWith('http') ? site.siteUrl : null
          });
        }
      }

      // Inserir no Supabase
      if (unified.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('clients')
          .insert(unified)
          .select();
        
        if (insertError) throw insertError;
        dbClients = inserted;
      }
    }

    // 3. Formatar para o frontend (Manter compatibilidade com a estrutura anterior)
    const formattedList = dbClients?.map(client => ({
      id: client.id, 
      name: client.name,
      type: client.gsc_url && client.gbp_location_id ? 'HYBRID' : client.gbp_location_id ? 'GBP_ONLY' : 'GSC_ONLY',
      gscUrl: client.gsc_url,
      gbpData: client.gbp_location_id ? {
        id: `locations/${client.gbp_location_id}`,
        name: client.name,
        accountId: client.gbp_account_id,
        websiteUri: client.website_url
      } : null,
      localPath: client.local_path,
      businessContext: client.business_context,
      designContext: client.design_context || {}, // Mantemos o objeto para compatibilidade
      projectFolder: client.project_folder,
      stitchPrompt: client.stitch_prompt
    }));

    return NextResponse.json(formattedList || []);
  } catch (error: any) {
    console.error('ERRO API SITES:', error);
    return NextResponse.json({ error: error.message || 'Falha ao buscar clientes' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, localPath, businessContext, design_context, projectFolder, stitchPrompt } = await req.json();
    
    const adminSupabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data, error } = await adminSupabase
      .from('clients')
      .update({ 
        local_path: localPath, 
        business_context: businessContext,
        design_context: design_context,
        project_folder: projectFolder,
        stitch_prompt: stitchPrompt
      })
      .eq('id', id)
      .select();


    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, website_url, phone, category, opportunities } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Nome do cliente é obrigatório.' }, { status: 400 });
    }

    const adminSupabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    let businessContext = 'Empresa em prospecção ativa local.';
    let stitchPrompt = 'Estilo visual limpo, moderno e profissional.';

    // ── 1. GERAR CONTEXTO E MANUAL DE MARCA COM IA BASEADO NO LEAD ───────────
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log(`🤖 IA gerando manual de marca e contexto para o novo cliente: "${name}"`);
        
        const prompt = `Você é um consultor estratégico de negócios e marcas. Vamos cadastrar um novo cliente local e precisamos gerar um perfil corporativo inicial e um manual de marca sob medida para o nicho dele.

Lead comercial:
- Nome da Empresa: "${name}"
- Categoria/Nicho: "${category || 'Geral'}"
- Website: "${website_url || 'Nenhum'}"
- Telefone: "${phone || 'Nenhum'}"
- Fraquezas/Problemas da ficha do Google: "${opportunities?.join(', ') || 'Nenhum'}"

Retorne estritamente um objeto JSON válido, sem cercas de markdown (\`\`\`json / \`\`\`), sem explicações textuais extras. A estrutura exata do JSON deve ser:
{
  "businessContext": "Um resumo de 2 a 3 parágrafos sobre a empresa. Fale do mercado local dele, das dores de visibilidade no Google (como a falta de site próprio) e as soluções estratégicas que nós forneceremos.",
  "stitchPrompt": "Manual de design da marca contendo: 1. Cores sugeridas (CSS/Tailwind: ex: azul marinho, verde menta). 2. Tom de voz corporativo (ex: acolhedor e informativo). 3. Instruções visuais de landing page (ex: Hero limpo, seção com 3 diferenciais e CTA via WhatsApp)."
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { 
                temperature: 0.4, 
                maxOutputTokens: 2000,
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          rawText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/```\s*$/m, '').trim();
          
          const parsed = JSON.parse(rawText);
          if (parsed.businessContext) businessContext = parsed.businessContext;
          if (parsed.stitchPrompt) stitchPrompt = parsed.stitchPrompt;
          console.log('✅ Manual e contexto gerados com sucesso!');
        }
      } catch (err) {
        console.error('⚠️ Falha ao enriquecer cliente com IA, usando valores padrão:', err);
      }
    }

    // ── 2. INSERIR NA TABELA CLIENTS DO SUPABASE ─────────────────────────────
    const firstWord = name.toLowerCase().split(/[^a-z0-9]+/i)[0] || 'cliente';
    
    const { data: client, error: insertError } = await adminSupabase
      .from('clients')
      .insert([{
        name,
        website_url: website_url || null,
        // Ignorando colunas que podem não existir no banco de dados do Supabase
        business_context: `[Telefone: ${phone || 'N/A'}] [Categoria: ${category || 'N/A'}] ${businessContext}`,
        stitch_prompt: stitchPrompt,
        design_context: {
          branded_keywords: [firstWord],
          layout: '',
          designTokens: '',
          homePage: ''
        }
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // Retorna formatado igual ao GET para compatibilidade com a lista do frontend
    const formatted = {
      id: client.id, 
      name: client.name,
      type: 'GBP_ONLY',
      gscUrl: null,
      gbpData: null,
      localPath: null,
      businessContext: client.business_context,
      designContext: client.design_context || {},
      projectFolder: null,
      stitchPrompt: client.stitch_prompt
    };

    return NextResponse.json({ success: true, client: formatted });
  } catch (error: any) {
    console.error('❌ Erro na inserção do cliente:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

