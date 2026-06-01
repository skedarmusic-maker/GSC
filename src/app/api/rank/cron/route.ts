import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getLocationDetails } from '@/lib/business';

export const maxDuration = 300; // Permite rodar ate 5 minutos na Vercel (se o plano permitir)

// Endpoint chamado pelo Vercel Cron Job toda semana (segunda-feira, 8h)
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: keywords, error } = await supabase
      .from('tracked_keywords')
      .select('id, location_id, keyword, business_name, account_id');

    if (error) throw error;
    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ message: 'Nenhuma keyword para atualizar.' });
    }

    let updated = 0;
    let failed = 0;

    // Processar em chunks de 5 para nao estourar limite de conexoes,
    // mas ser rapido o suficiente para nao dar timeout na Vercel
    const CHUNK_SIZE = 5;
    for (let i = 0; i < keywords.length; i += CHUNK_SIZE) {
      const chunk = keywords.slice(i, i + CHUNK_SIZE);
      
      await Promise.all(chunk.map(async (kw) => {
        try {
          const locationName = `accounts/${kw.account_id}/locations/${kw.location_id}`;
          const details = await getLocationDetails(locationName);

          const lat = details?.latlng?.latitude;
          const lng = details?.latlng?.longitude;
          const ll = lat && lng ? `${lat},${lng}` : '';
          const city = details?.storefrontAddress?.locality || '';
          const queryWithLocation = ll ? kw.keyword : (city ? `${kw.keyword} em ${city}` : kw.keyword);
          
          const currentZoom = '15z'; // padrao para o cron
          const serpUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(queryWithLocation)}${ll ? `&ll=@${ll},${currentZoom}` : ''}&hl=pt&gl=br&api_key=${process.env.SERPAPI_KEY}`;
          
          const serpRes = await fetch(serpUrl, { cache: 'no-store' });
          const serpData = await serpRes.json();

          let position = 99;
          if (serpData.local_results) {
            const results = serpData.local_results;
            let filteredResults = results;
            
            if (lat && lng) {
              const maxDistanceKm = 5.5; // padrao 15z
              const filtered = results.filter((r: any) => {
                const cLat = r.gps_coordinates?.latitude;
                const cLng = r.gps_coordinates?.longitude;
                if (!cLat || !cLng) return true;
                const dLat = (cLat - lat) * Math.PI / 180;
                const dLon = (cLng - lng) * Math.PI / 180;
                const a = Math.sin(dLat/2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(cLat * Math.PI / 180) * Math.sin(dLon/2) ** 2;
                const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return distKm <= maxDistanceKm;
              });
              
              const filteredHasUs = filtered.some((r: any) => r.title.toLowerCase().includes(kw.business_name.toLowerCase()));
              if (filteredHasUs) filteredResults = filtered;
            }

            const idx = filteredResults.findIndex((r: any) =>
              r.title.toLowerCase().includes(kw.business_name.toLowerCase()) ||
              r.place_id === details?.metadata?.placeId
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
      }));
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
