import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getLocationDetails } from '@/lib/business';

// Endpoint chamado pelo Vercel Cron Job toda semana (segunda-feira, 8h)
// Configuração em vercel.json
export async function GET(req: Request) {
  // Verificação de segurança: o Vercel envia um header especial nos cron jobs
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Buscar todas as keywords de todos os usuários
    const { data: keywords, error } = await supabase
      .from('tracked_keywords')
      .select('id, location_id, keyword, business_name, account_id');

    if (error) throw error;
    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ message: 'Nenhuma keyword para atualizar.' });
    }

    let updated = 0;
    let failed = 0;

    for (const kw of keywords) {
      try {
        const locationName = `accounts/${kw.account_id}/locations/${kw.location_id}`;
        const details = await getLocationDetails(locationName);

        const lat = details?.latlng?.latitude;
        const lng = details?.latlng?.longitude;
        const center = lat && lng ? `@${lat},${lng},14z` : '';

        const serpRes = await fetch(
          `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(kw.keyword)}&ll=${center}&api_key=${process.env.SERPAPI_KEY}`,
          { cache: 'no-store' }
        );
        const serpData = await serpRes.json();

        let position = 99;
        if (serpData.local_results) {
          const idx = serpData.local_results.findIndex((r: any) =>
            r.title.toLowerCase().includes(kw.business_name.toLowerCase())
          );
          if (idx !== -1) position = idx + 1;
        }

        await supabase
          .from('rank_history')
          .insert([{ keyword_id: kw.id, position }]);

        updated++;
      } catch (e) {
        console.error(`Erro ao atualizar keyword ${kw.keyword}:`, e);
        failed++;
      }
    }

    return NextResponse.json({
      message: `Cron executado com sucesso.`,
      updated,
      failed,
      total: keywords.length,
    });

  } catch (error: any) {
    console.error('Erro no cron de rank:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
