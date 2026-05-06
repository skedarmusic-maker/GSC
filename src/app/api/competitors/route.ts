import { NextResponse } from 'next/server';
import { getLocationDetails } from '@/lib/business';

export async function POST(req: Request) {
  try {
    const { locationId, accountId, keyword, businessName } = await req.json();

    const locationName = `accounts/${accountId}/locations/${locationId}`;
    const details = await getLocationDetails(locationName);
    
    const lat = details?.latlng?.latitude;
    const lng = details?.latlng?.longitude;
    const center = lat && lng ? `@${lat},${lng},14z` : '';

    // Buscar no Google Maps via SerpApi
    const serpRes = await fetch(`https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(keyword)}&ll=${center}&api_key=${process.env.SERPAPI_KEY}`);
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
      isUs: c.title.toLowerCase().includes(businessName.toLowerCase())
    }));

    // Se a nossa empresa não estiver no Top 3, adicionamos ela ao final para comparação
    if (!competitors.find(c => c.isUs) && ourPlace) {
      competitors.push({
        title: ourPlace.title,
        rating: ourPlace.rating || 0,
        reviews: ourPlace.reviews || 0,
        type: ourPlace.type || 'N/A',
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
