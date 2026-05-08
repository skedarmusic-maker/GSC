import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getLocationDetails } from '@/lib/business';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('locationId');

  if (!locationId) return NextResponse.json({ error: 'Location ID missing' }, { status: 400 });

  // Buscar palavras-chave e seus históricos
  const { data: keywords, error } = await supabase
    .from('tracked_keywords')
    .select('*, rank_history(*)')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(keywords);
}

export async function POST(req: Request) {
  try {
    const { locationId, businessName, keyword, accountId, zoom } = await req.json();

    // 1. Salvar a palavra-chave no banco
    const { data: kw, error } = await supabase
      .from('tracked_keywords')
      .insert([{ location_id: locationId, business_name: businessName, keyword }])
      .select()
      .single();

    if (error) throw error;

    // 2. Disparar a primeira busca na SerpApi imediatamente
    const locationName = `accounts/${accountId}/locations/${locationId}`;
    const details = await getLocationDetails(locationName);
    
    // Pegar coordenadas para precisão total (Geolocalização Local)
    const lat = details?.latlng?.latitude;
    const lng = details?.latlng?.longitude;
    const ll = lat && lng ? `${lat},${lng}` : '';

    const currentZoom = zoom || '15z';
    const serpRes = await fetch(`https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(keyword)}${ll ? `&ll=@${ll},${currentZoom}` : ''}&api_key=${process.env.SERPAPI_KEY}`);
    const serpData = await serpRes.json();

    let position = 99; // 99 significa que não foi encontrado no top 20
    
    if (serpData.local_results) {
      const idx = serpData.local_results.findIndex((r: any) => 
        r.title.toLowerCase().includes(businessName.toLowerCase()) || 
        r.place_id === details?.name // Tentativa de bater pelo ID (nem sempre vem da SerpApi)
      );
      if (idx !== -1) position = idx + 1;
    }

    // 3. Salvar o primeiro registro de posição
    await supabase
      .from('rank_history')
      .insert([{ keyword_id: kw.id, position }]);

    return NextResponse.json({ success: true, position });

  } catch (error: any) {
    console.error('Erro no Rank Tracking:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
