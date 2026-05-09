import { NextResponse } from 'next/server';
import { getDetailedInsights } from '@/lib/gsc';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Validar Chave de API
    const authHeader = req.headers.get('x-api-key');
    const expectedKey = process.env.N8N_API_KEY;
    
    if (!expectedKey) {
      return NextResponse.json({ error: 'Configuração ausente: N8N_API_KEY não definida na Vercel' }, { status: 500 });
    }

    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Criar cliente admin para ignorar RLS
    const adminSupabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { clientId } = await req.json();

    // 2. Testar Conexão Supabase
    console.log('--- DIAGNÓSTICO: Testando Supabase ---');
    const { data: clients, error: clientError } = await adminSupabase
      .from('clients')
      .select('*')
      .not('gsc_url', 'is', null);

    if (clientError) {
      console.error('ERRO SUPABASE:', clientError);
      return NextResponse.json({ error: 'Falha ao conectar no Supabase', details: clientError }, { status: 500 });
    }

    console.log(`--- DIAGNÓSTICO: ${clients?.length || 0} clientes encontrados ---`);

    const results = [];

    for (const client of (clients || [])) {
      console.log(`🔍 Escaneando GSC para: ${client.name} (${client.gsc_url})...`);
      
      let insights;
      try {
        insights = await getDetailedInsights(client.gsc_url, 28);
      } catch (gscError: any) {
        console.error(`ERRO GSC (${client.name}):`, gscError.message);
        results.push({ client: client.name, status: 'error', error: gscError.message });
        continue;
      }
      
      // Filtro de TESTE TOTAL: Qualquer palavra com impressão entra
      const opportunities = insights.keywords.filter((k: any) => 
        k.impressions > 1
      );

      console.log(`✨ ${client.name}: Encontradas ${opportunities.length} oportunidades (Threshold Mínimo).`);

      let addedCount = 0;

      for (const opp of opportunities) {
        const keyword = opp.keys?.[0] || 'unknown';
        const impressions = opp.impressions || 0;
        const clicks = opp.clicks || 0;
        const ctr = ((opp.ctr || 0) * 100).toFixed(2);
        const position = (opp.position || 0).toFixed(1);

        // Verificar duplicata (Termo + Cliente) usando adminSupabase
        const { data: existing } = await adminSupabase
          .from('oportunidades_seo')
          .select('id')
          .eq('client_id', client.id)
          .eq('keyword', keyword)
          .maybeSingle();

        if (!existing) {
          const { error: insertError } = await adminSupabase.from('oportunidades_seo').insert({
            client_id: client.id,
            keyword: keyword,
            impressions: impressions,
            clicks: clicks,
            ctr: parseFloat(ctr),
            position: parseFloat(position),
            status: 'pendente'
          });
          
          if (insertError) {
            console.error(`❌ Erro ao inserir palavra '${keyword}':`, insertError.message);
          } else {
            addedCount++;
          }
        }
      }

      results.push({
        client: client.name,
        totalKeywords: insights.keywords.length,
        opportunitiesFound: opportunities.length,
        newAdded: addedCount
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Escaneamento concluído', 
      summary: results 
    });

  } catch (error: any) {
    console.error('ERRO DETALHADO SCAN GSC:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
