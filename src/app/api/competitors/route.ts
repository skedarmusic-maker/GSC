import { NextResponse } from 'next/server';
import { getLocationDetails } from '@/lib/business';

export async function POST(req: Request) {
  try {
    const { locationId, accountId, keyword, businessName } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const locationName = `accounts/${accountId}/locations/${locationId}`;
    const details = await getLocationDetails(locationName, token);
    
    const lat = details?.latlng?.latitude;
    const lng = details?.latlng?.longitude;
    const ll = lat && lng ? `${lat},${lng}` : '';

    const city = details?.storefrontAddress?.locality || '';
    const queryWithLocation = ll ? keyword : (city ? `${keyword} em ${city}` : keyword);

    const currentZoom = '14z';
    const serpUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(queryWithLocation)}${ll ? `&ll=@${ll},${currentZoom}` : ''}&hl=pt&gl=br&api_key=${process.env.SERPAPI_KEY}`;
    console.log(`🌐 Chamando SerpApi Competitors: ${serpUrl}`);

    const serpRes = await fetch(serpUrl);
    const serpData = await serpRes.json();

    if (!serpData.local_results) {
      return NextResponse.json({ error: 'Nenhum resultado encontrado para esta palavra-chave' }, { status: 404 });
    }

    // Identificar a nossa empresa nos resultados (se estiver no top 20)
    const ourPlace = serpData.local_results.find((r: any) => 
      r.title.toLowerCase().includes(businessName.toLowerCase())
    );

    // Pegar os Top 3 (Concorrentes)
    const competitors = serpData.local_results.slice(0, 3).map((c: any) => ({
      title: c.title,
      rating: c.rating || 0,
      reviews: c.reviews || 0,
      type: c.type || 'N/A',
      place_id: c.place_id,
      isUs: c.title.toLowerCase().includes(businessName.toLowerCase())
    }));

    // Se a nossa empresa não estiver no Top 3, adicionamos ela ao final para comparação
    if (!competitors.find((c: any) => c.isUs) && ourPlace) {
      competitors.push({
        title: ourPlace.title,
        rating: ourPlace.rating || 0,
        reviews: ourPlace.reviews || 0,
        type: ourPlace.type || 'N/A',
        place_id: ourPlace.place_id,
        isUs: true
      });
    }

    return NextResponse.json({
      keyword,
      competitors
    });

  } catch (error: any) {
    console.error('Erro no Competitor Analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
