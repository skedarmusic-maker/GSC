import { NextResponse } from 'next/server';
import { getLocationDetails } from '@/lib/business';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function POST(req: Request) {
  try {
    const { locationId, accountId, keyword, businessName, zoom } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const locationName = `accounts/${accountId}/locations/${locationId}`;
    const details = await getLocationDetails(locationName, token);
    
    const lat = details?.latlng?.latitude;
    const lng = details?.latlng?.longitude;
    const ll = lat && lng ? `${lat},${lng}` : '';

    const city = details?.storefrontAddress?.locality || '';
    const queryWithLocation = ll ? keyword : (city ? `${keyword} em ${city}` : keyword);

    const currentZoom = zoom || '15z';
    const serpUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(queryWithLocation)}${ll ? `&ll=@${ll},${currentZoom}` : ''}&hl=pt&gl=br&api_key=${process.env.SERPAPI_KEY}`;
    console.log(`🌐 Chamando SerpApi Competitors: ${serpUrl}`);

    const serpRes = await fetch(serpUrl);
    const serpData = await serpRes.json();

    if (!serpData.local_results) {
      return NextResponse.json({ error: 'Nenhum resultado encontrado para esta palavra-chave' }, { status: 404 });
    }

    // Mapear limites de raio baseados no zoom selecionado
    let maxDistanceKm = 5.5; // Padrão 5 km (margem de tolerância inclusa)
    if (currentZoom === '16z') maxDistanceKm = 3.5; // Raio de 3 km
    else if (currentZoom === '14z') maxDistanceKm = 11.0; // Raio de 10 km

    // Filtrar os resultados da busca para manter apenas os que estão dentro do raio
    let filteredResults = serpData.local_results || [];
    if (lat && lng) {
      filteredResults = filteredResults.filter((r: any) => {
        const cLat = r.gps_coordinates?.latitude;
        const cLng = r.gps_coordinates?.longitude;
        if (!cLat || !cLng) return true; // Mantém se não tiver as coordenadas do concorrente
        const dist = getDistanceKm(lat, lng, cLat, cLng);
        return dist <= maxDistanceKm;
      });
    }

    // Se o filtro for muito agressivo e zerar a lista, caímos para os resultados originais
    const finalResults = filteredResults.length > 0 ? filteredResults : serpData.local_results;

    // Identificar a nossa empresa nos resultados finais
    const ourPlace = finalResults.find((r: any) => 
      r.title.toLowerCase().includes(businessName.toLowerCase())
    );
    const ourPosition = ourPlace ? finalResults.indexOf(ourPlace) + 1 : null;

    // Pegar os Top 3 reais do Google (sem inventar posição artificial para o cliente)
    const competitors = finalResults.slice(0, 3).map((c: any) => {
      let distanceKm = 'N/A';
      if (lat && lng && c.gps_coordinates?.latitude && c.gps_coordinates?.longitude) {
        distanceKm = getDistanceKm(lat, lng, c.gps_coordinates.latitude, c.gps_coordinates.longitude).toFixed(1) + ' km';
      }
      return {
        title: c.title,
        rating: c.rating || 0,
        reviews: c.reviews || 0,
        type: c.type || 'N/A',
        place_id: c.place_id,
        isUs: c.title.toLowerCase().includes(businessName.toLowerCase()),
        distanceKm
      };
    });

    return NextResponse.json({
      keyword,
      competitors,
      ourPosition // posição real do cliente nos resultados (null = fora do top 20)
    });

  } catch (error: any) {
    console.error('Erro no Competitor Analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
