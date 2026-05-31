import { NextResponse } from 'next/server';
import { getLocationPerformance } from '@/lib/business';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is exported here, or maybe from @supabase/auth-helpers-nextjs?

export async function POST(request: Request) {
  try {
    const { locationId, clientId, locationName } = await request.json();
    
    if (!locationName || !clientId || !locationId) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Calcular data atual e 18 meses atrás
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 18);

    // Chamar a API do Google Maps para puxar os últimos 18 meses
    const perf = await getLocationPerformance(
      locationName,
      undefined, // days não será usado pois passaremos start e end
      start.toISOString(),
      end.toISOString(),
      token
    );
    
    if (!perf || !perf.chartData || perf.chartData.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum dado retornado da API do Google' });
    }

    // Preparar os dados para inserir no Supabase (period_type = 'DAILY')
    const records = perf.chartData.map((dayData: any) => ({
      client_id: clientId,
      location_id: locationId,
      date: dayData.date,
      period_type: 'DAILY',
      calls: dayData.calls || 0,
      directions: dayData.directions || 0,
      website_clicks: dayData.websiteClicks || 0,
      views_maps: dayData.views_maps || 0,
      views_search: dayData.views_search || 0
    }));

    // Upsert no banco (precisamos do supabase admin ou service role, ou cliente com RLS publico)
    const { error: dbError } = await supabase
      .from('gbp_metrics_history')
      .upsert(records, { onConflict: 'location_id, date, period_type' });

    if (dbError) {
      console.error('Erro ao inserir no Supabase:', dbError);
      return NextResponse.json({ success: false, error: dbError.message });
    }

    return NextResponse.json({ success: true, count: records.length });
  } catch (error: any) {
    console.error('Erro em sync-history:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
