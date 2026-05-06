import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Falta o termo de busca' }, { status: 400 });
    }

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave SerpApi não configurada' }, { status: 500 });
    }

    // 1. Busca pela empresa específica
    const searchUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.local_results || searchData.local_results.length === 0) {
      return NextResponse.json({ error: 'Empresa não encontrada no Google Maps' }, { status: 404 });
    }

    const business = searchData.local_results[0]; // Assume que o primeiro é o alvo principal
    const category = business.type || 'Empresa Local';
    const city = business.address ? business.address.split(',')[1]?.trim() : '';

    // 2. Busca pelo segmento para Benchmark
    const segmentQuery = `${category} em ${city || query}`;
    const segmentUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(segmentQuery)}&api_key=${apiKey}`;
    const segmentRes = await fetch(segmentUrl);
    const segmentData = await segmentRes.json();

    let competitors = [];
    let avgReviews = 0;
    let avgRating = 0;

    if (segmentData.local_results) {
      competitors = segmentData.local_results.slice(0, 10).map((c: any) => ({
        name: c.title,
        reviews: c.reviews || 0,
        rating: c.rating || 0,
        isTarget: c.place_id === business.place_id || c.title === business.title
      }));

      const totalReviews = competitors.reduce((acc: number, c: any) => acc + c.reviews, 0);
      const totalRatings = competitors.reduce((acc: number, c: any) => acc + c.rating, 0);
      avgReviews = competitors.length > 0 ? Math.round(totalReviews / competitors.length) : 0;
      avgRating = competitors.length > 0 ? parseFloat((totalRatings / competitors.length).toFixed(1)) : 0;
    }

    // 3. Montar a Análise de Saúde (Health Check)
    const audit = {
      target: {
        name: business.title,
        address: business.address,
        rating: business.rating || 0,
        reviews: business.reviews || 0,
        category: category,
        gps: business.gps_coordinates,
        thumbnail: business.thumbnail,
      },
      benchmark: {
        avgReviews,
        avgRating,
        top10: competitors
      },
      checks: [
        {
          id: 'reviews_count',
          name: 'Quantidade de Avaliações',
          description: `O negócio possui ${business.reviews || 0} avaliações. A média do segmento é ${avgReviews}.`,
          status: (business.reviews || 0) >= avgReviews ? 'Bom' : (business.reviews || 0) > 0 ? 'Razoável' : 'Fraco',
          passed: (business.reviews || 0) >= avgReviews
        },
        {
          id: 'rating_avg',
          name: 'Média de Avaliações',
          description: `A nota atual é ${business.rating || 0}. A média do segmento é ${avgRating}.`,
          status: (business.rating || 0) >= 4.5 ? 'Bom' : (business.rating || 0) >= 4.0 ? 'Razoável' : 'Fraco',
          passed: (business.rating || 0) >= 4.5
        },
        {
          id: 'phone',
          name: 'Número de Telefone',
          description: 'O número de telefone é uma das informações chave para o seu negócio.',
          status: business.phone ? 'Bom' : 'Fraco',
          passed: !!business.phone
        },
        {
          id: 'website',
          name: 'Website',
          description: 'Ter um website transmite credibilidade.',
          status: business.website ? 'Bom' : 'Fraco',
          passed: !!business.website
        },
        {
          id: 'hours',
          name: 'Horário de Funcionamento',
          description: 'É uma informação chave para que os clientes saibam quando visitá-lo.',
          status: business.operating_hours ? 'Bom' : 'Fraco',
          passed: !!business.operating_hours
        }
      ]
    };

    // Calcular o Score final (0 a 100)
    let passedCount = audit.checks.filter(c => c.status === 'Bom').length;
    let partialCount = audit.checks.filter(c => c.status === 'Razoável').length;
    audit.score = Math.round(((passedCount * 20) + (partialCount * 10)));
    if (audit.score > 100) audit.score = 100;

    return NextResponse.json(audit);

  } catch (error: any) {
    console.error('Erro na geração da auditoria de prospecção:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
