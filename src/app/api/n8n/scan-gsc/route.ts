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
        const keyword = opp.keys?.[0] || 'unknown';
        const impressions = opp.impressions || 0;
        const clicks = opp.clicks || 0;
        const ctr = ((opp.ctr || 0) * 100).toFixed(2);
        const position = (opp.position || 0).toFixed(1);

        // Verificar duplicata (Termo + Cliente)
        const { data: existing } = await supabase
          .from('oportunidades_seo')
          .select('id')
          .eq('client_id', client.id)
          .eq('keyword', keyword)
          .single();

        if (!existing) {
          await supabase.from('oportunidades_seo').insert({
            client_id: client.id,
            keyword: keyword,
            impressions: impressions,
            clicks: clicks,
            ctr: ctr,
            position: position,
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
