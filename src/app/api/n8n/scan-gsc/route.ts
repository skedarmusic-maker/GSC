import { NextResponse } from 'next/server';
import { getDetailedInsights } from '@/lib/gsc';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Validar Chave de API
    const authHeader = req.headers.get('x-api-key');
    if (authHeader !== process.env.N8N_API_KEY) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { clientId } = await req.json();

    // 2. Buscar Clientes (Um específico ou todos com GSC)
    let query = supabase.from('clients').select('*').not('gsc_url', 'is', null);
    if (clientId) query = query.eq('id', clientId);

    const { data: clients, error: clientError } = await query;
    if (clientError) throw clientError;

    const results = [];

    for (const client of (clients || [])) {
      console.log(`🔍 Escaneando GSC para: ${client.name}...`);
      
      const insights = await getDetailedInsights(client.gsc_url, 28);
      
      // Filtro: Impressões > 500 e CTR < 1.5% (Ajustável)
      const opportunities = insights.keywords.filter((k: any) => 
        k.impressions > 500 && (k.ctr * 100) < 1.5
      );

      let addedCount = 0;

      for (const opp of opportunities) {
        // Verificar duplicata (Termo + Cliente)
        const { data: existing } = await supabase
          .from('oportunidades_seo')
          .select('id')
          .eq('client_id', client.id)
          .eq('keyword', opp.keys[0])
          .single();

        if (!existing) {
          await supabase.from('oportunidades_seo').insert({
            client_id: client.id,
            keyword: opp.keys[0],
            impressions: opp.impressions,
            clicks: opp.clicks,
            ctr: (opp.ctr * 100).toFixed(2),
            position: opp.position.toFixed(1),
            status: 'pendente'
          });
          addedCount++;
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
    console.error('ERRO SCAN GSC:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
