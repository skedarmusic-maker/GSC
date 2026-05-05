// Motor com nomes de métricas oficiais da API v1

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!.trim(),
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!.trim(),
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

const MY_LOCATIONS = [
  {
    id: "12629358229101559118",
    accountId: "117500726461334844641",
    title: "Militz Podologia",
    website: "simonemilitzpodologa.com.br"
  }
];

export async function listLocations() {
  return MY_LOCATIONS.map(loc => ({
    name: `locations/${loc.id}`,
    accountId: loc.accountId,
    title: loc.title,
    websiteUri: `https://${loc.website}`
  }));
}

async function fetchSingleMetric(
  locationName: string,
  accessToken: string,
  metric: string,
  start: Date,
  end: Date
): Promise<number> {
  const params = new URLSearchParams({
    'dailyMetric': metric,
    'dailyRange.startDate.year': String(start.getFullYear()),
    'dailyRange.startDate.month': String(start.getMonth() + 1),
    'dailyRange.startDate.day': String(start.getDate()),
    'dailyRange.endDate.year': String(end.getFullYear()),
    'dailyRange.endDate.month': String(end.getMonth() + 1),
    'dailyRange.endDate.day': String(end.getDate()),
  });

  const url = `https://businessprofileperformance.googleapis.com/v1/${locationName}:getDailyMetricsTimeSeries?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    // Silencia o log de erro se for apenas dado inexistente
    if (res.status !== 400) {
        console.error(`❌ Erro Maps [${metric}] (${res.status}):`, errText.substring(0, 200));
    }
    return 0;
  }

  const data = await res.json();
  const values = data.timeSeries?.datedValues || [];
  return values.reduce((acc: number, v: any) => acc + (parseInt(v.value) || 0), 0);
}

export async function getLocationPerformance(locationName: string, days: number = 28) {
  try {
    const accessToken = await getAccessToken();
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    // Nomes oficiais: BUSINESS_CONVERSIONS_CALLS, BUSINESS_CONVERSIONS_DIRECTIONS, BUSINESS_CONVERSIONS_WEBSITE_CLICKS
    const [calls, directions, websiteClicks] = await Promise.all([
      fetchSingleMetric(locationName, accessToken, 'BUSINESS_CONVERSIONS_CALLS', start, end),
      fetchSingleMetric(locationName, accessToken, 'BUSINESS_CONVERSIONS_DIRECTIONS', start, end),
      fetchSingleMetric(locationName, accessToken, 'BUSINESS_CONVERSIONS_WEBSITE_CLICKS', start, end),
    ]);

    console.log(`✅ Maps OK → Chamadas: ${calls} | Rotas: ${directions} | Cliques: ${websiteClicks}`);

    return { calls, directions, websiteClicks };
  } catch (error) {
    console.error('Falha no motor de Maps:', error);
    return null;
  }
}

// === NOVAS FUNÇÕES: GESTÃO DO PERFIL ===

// 1. Buscar Avaliações
export async function getReviews(accountId: string, locationId: string) {
  try {
    const accessToken = await getAccessToken();
    // A API v4 exige o caminho completo: accounts/{accountId}/locations/{locationId}/reviews
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`;
    
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!res.ok) {
        console.error('Erro ao buscar reviews:', await res.text());
        return null;
    }
    const data = await res.json();
    return data.reviews || [];
  } catch (error) {
    console.error(error);
    return null;
  }
}

// 2. Responder a uma Avaliação
export async function replyToReview(reviewName: string, replyText: string) {
  try {
    const accessToken = await getAccessToken();
    // reviewName já vem no formato 'accounts/*/locations/*/reviews/*'
    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
    
    const res = await fetch(url, { 
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: replyText })
    });
    
    if (!res.ok) {
        console.error('Erro ao responder review:', await res.text());
        return false;
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// 3. Criar Postagem (Update)
export async function createLocalPost(accountId: string, locationId: string, postText: string) {
  try {
    const accessToken = await getAccessToken();
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`;
    
    const res = await fetch(url, { 
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            languageCode: 'pt-BR',
            summary: postText,
            state: 'PUBLISHED',
            topicType: 'STANDARD'
        })
    });
    
    if (!res.ok) {
        console.error('Erro ao criar post:', await res.text());
        return false;
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
