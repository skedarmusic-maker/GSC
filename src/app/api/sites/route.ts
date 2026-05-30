import { NextResponse } from 'next/server';
import { listSites } from '@/lib/gsc';
import { listLocations, getAccessToken } from '@/lib/business';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function listSitesOAuth(accessToken: string) {
  try {
    const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    return data.siteEntry || [];
  } catch (e) {
    console.error('Erro ao listar sites GSC via OAuth:', e);
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const urlObj = new URL(req.url);
    const forceSync = urlObj.searchParams.get('sync') === 'true';

    console.log(`🔍 DIAGNÓSTICO VERCEL: Tentando conectar em ${url.substring(0, 20)}...`);

    let dbClients: any[] | null = [];
    let dbError: any = null;

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    if (token) {
      // 1. Identificar usuário autenticado
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );

      const { data: { user }, error: userError } = await userSupabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
      }

      // 2. Verificar se o usuário é Super Admin
      const { data: roleData } = await adminSupabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const isSuperAdmin = roleData?.role === 'super_admin';

      // 3. Buscar clientes: Ambos (Super Admin e Usuários Comuns) veem APENAS seus próprios clientes no painel de uso cotidiano.
      console.log(`👤 Carregando clientes do usuário (${user.email}).`);
      const { data, error } = await adminSupabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      dbClients = data;
      dbError = error;

        // Se o banco de dados não contiver nenhum cliente conectado (GBP/GSC) ou estiver totalmente vazio, tenta a descoberta automática.
        const hasConnectedClients = dbClients?.some(c => c.gbp_location_id || c.gsc_url);

        if (forceSync || (!dbError && (!dbClients || dbClients.length === 0 || !hasConnectedClients))) {
          console.log(`🔄 Descoberta ${forceSync ? 'forçada (sincronização)' : 'automática'} de perfis para o usuário: ${user.email} (Total clientes: ${dbClients?.length || 0}, Conectados: ${hasConnectedClients ? 'Sim' : 'Não'})`);
          try {
            const accessToken = await getAccessToken(token).catch(() => null);
            if (accessToken) {
              const [gscSites, gbpLocations] = await Promise.all([
                listSitesOAuth(accessToken).catch(() => []),
                listLocations(token).catch(() => [])
              ]);

              console.log(`🔍 Descoberta: Encontrado ${gscSites.length} sites GSC e ${gbpLocations.length} locais GBP.`);

              const unified: any[] = [];

              // Mapear GBP
              for (const loc of gbpLocations) {
                // Evitar duplicar locais que já existam no banco
                const exists = dbClients?.some(c => c.gbp_location_id === loc.name.replace('locations/', ''));
                if (exists) continue;

                unified.push({
                  name: loc.title,
                  gbp_account_id: loc.accountId,
                  gbp_location_id: loc.name.replace('locations/', ''),
                  website_url: loc.websiteUri,
                  gsc_url: null,
                  user_id: user.id
                });
              }

              // Mapear GSC e vincular
              for (const site of gscSites) {
                if (!site.siteUrl) continue;
                
                // Evitar duplicar sites GSC já existentes
                const exists = dbClients?.some(c => c.gsc_url === site.siteUrl);
                if (exists) continue;

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
                    website_url: site.siteUrl.startsWith('http') ? site.siteUrl : null,
                    user_id: user.id
                  });
                }
              }

              // Inserir no banco via adminSupabase
              if (unified.length > 0) {
                const { data: inserted, error: insertError } = await adminSupabase
                  .from('clients')
                  .insert(unified)
                  .select();
                
                if (insertError) throw insertError;
                dbClients = [...(dbClients || []), ...inserted];
                console.log(`✅ Descoberta automática concluída: ${inserted.length} novos clientes vinculados ao usuário ${user.email}.`);
              }
            } else {
              console.log(`📡 Usuário ${user.email} ainda não integrou sua conta do Google na central.`);
            }
          } catch (err) {
            console.error(`Erro ao fazer descoberta automática para ${user.email}:`, err);
          }
        }
    } else {
      // Sem token de usuário logado (ex: acessos diretos/anônimos): Bloqueia por completo por motivos de segurança!
      console.log('📡 API SITES: Tentativa de acesso anônimo bloqueada por segurança.');
      return NextResponse.json({ error: 'Não autorizado. Token de sessão ausente.' }, { status: 401 });
    }

    if (dbError) throw dbError;
    
    console.log(`📡 API SITES: ${dbClients?.length || 0} clientes encontrados no banco.`);

    // 2. Se o banco estiver vazio, fazemos o seeding automático (Primeiro Acesso)
    if (!dbClients || dbClients.length === 0) {
      // Evitamos seed automático de outro e-mail para usuário não-admin
      const isUserFlow = !!token;
      if (isUserFlow) {
        return NextResponse.json([]); // Retorna vazio se não tiver clientes cadastrados
      }

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
      type: client.gsc_url && client.gbp_location_id ? 'HYBRID' : client.gbp_location_id ? 'GBP_ONLY' : client.gsc_url ? 'GSC_ONLY' : 'PROSPECT',
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
      stitchPrompt: client.stitch_prompt,
      seoEnabled: client.seo_enabled ?? false
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
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    let updateResult: any = null;
    let updateError: any = null;

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    if (token) {
      // 1. Identificar usuário autenticado
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );

      const { data: { user }, error: userError } = await userSupabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
      }

      // 2. Verificar se o usuário é Super Admin
      const { data: roleData } = await adminSupabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const isSuperAdmin = roleData?.role === 'super_admin';

      // 3. Atualizar com restrição rígida de proprietário para usuários comuns
      if (isSuperAdmin) {
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
          
        updateResult = data;
        updateError = error;
      } else {
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
          .eq('user_id', user.id) // Restrição absoluta de posse
          .select();
          
        updateResult = data;
        updateError = error;
      }
    } else {
      return NextResponse.json({ error: 'Não autorizado. Token de sessão ausente.' }, { status: 401 });
    }

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, data: updateResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome do cliente é obrigatório.' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Se a requisição contiver gbpLocationId ou gscUrl, é o fluxo 1 (Cadastro de cliente conectado oficial via RLS)
    const isIntegrationFlow = 'gbpLocationId' in body || 'gscUrl' in body;

    if (isIntegrationFlow) {
      // Fluxo 1: Cadastro de cliente conectado com RLS
      const { gscUrl, gbpAccountId, gbpLocationId, websiteUrl } = body;

      if (!token) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
      }

      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );

      const { data: userResponse } = await userSupabase.auth.getUser();
      const userId = userResponse.user?.id;

      if (!userId) {
        return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 });
      }

      const { data, error } = await userSupabase
        .from('clients')
        .insert([
          {
            name,
            gsc_url: gscUrl || null,
            gbp_account_id: gbpAccountId || null,
            gbp_location_id: gbpLocationId || null,
            website_url: websiteUrl || null,
            user_id: userId
          }
        ])
        .select();

      if (error) throw error;

      return NextResponse.json({ success: true, data });
    } else {
      // Fluxo 2: Cadastro de Prospecção Enriquecida com Gemini
      const { website_url, phone, category, opportunities } = body;

      const adminSupabase = (await import('@supabase/supabase-js')).createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );

      // Tenta obter o user_id do usuário logado se houver token, para atrelar a prospecção ao usuário certo
      let userId: string | null = null;
      if (token) {
        try {
          const userSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            }
          );
          const { data: userResponse } = await userSupabase.auth.getUser();
          userId = userResponse.user?.id || null;
        } catch (e) {
          console.error('Erro ao mapear user para prospecção:', e);
        }
      }

      let businessContext = 'Empresa em prospecção ativa local.';
      let stitchPrompt = 'Estilo visual limpo, moderno e profissional.';

      // Gemini IA
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

      const firstWord = name.toLowerCase().split(/[^a-z0-9]+/i)[0] || 'cliente';
      
      const { data: client, error: insertError } = await adminSupabase
        .from('clients')
        .insert([{
          name,
          website_url: website_url || null,
          business_context: `[Telefone: ${phone || 'N/A'}] [Categoria: ${category || 'N/A'}] ${businessContext}`,
          stitch_prompt: stitchPrompt,
          user_id: userId,
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

      const formatted = {
        id: client.id, 
        name: client.name,
        type: 'PROSPECT',
        gscUrl: null,
        gbpData: null,
        localPath: null,
        businessContext: client.business_context,
        designContext: client.design_context || {},
        projectFolder: null,
        stitchPrompt: client.stitch_prompt,
        seoEnabled: false
      };

      return NextResponse.json({ success: true, client: formatted });
    }
  } catch (error: any) {
    console.error('❌ Erro na inserção do cliente (POST):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

