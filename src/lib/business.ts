// Motor de Performance REAL do Google Business Profile (Pós-Aprovação de Cota)

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

export async function listLocations() {
  try {
    const accessToken = await getAccessToken();
    
    console.log('--- BUSCANDO CONTAS BUSINESS PROFILE ---');
    const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const accountsData = await accountsRes.json();
    
    if (accountsData.error) {
        console.error('Erro ao listar contas:', accountsData.error.message);
        return [];
    }

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      console.log('⚠️ Nenhuma conta de negócio encontrada.');
      return [];
    }

    const locations: any[] = [];
    // Varre todas as contas (Pessoais ou Organizacionais)
    for (const acc of accountsData.accounts) {
        console.log(`Buscando locais para conta: ${acc.accountName || acc.name}`);
        const locRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title,websiteUri`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const locData = await locRes.json();
        if (locData.locations) {
            locData.locations.forEach((l: any) => {
                console.log(`✅ Local encontrado: ${l.title} (${l.websiteUri || 'Sem site'})`);
                locations.push(l);
            });
        }
    }
    return locations;
  } catch (error) {
    console.error('Erro na integração GBP:', error);
    return [];
  }
}

export async function getLocationPerformance(locationName: string, days: number = 28) {
  try {
    const accessToken = await getAccessToken();
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const url = `https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetrics?dailyMetrics=CALLS&dailyMetrics=DIRECTIONS&dailyMetrics=WEBSITE_CLICKS&dailyRange.startDate.year=${start.getFullYear()}&dailyRange.startDate.month=${start.getMonth() + 1}&dailyRange.startDate.day=${start.getDate()}&dailyRange.endDate.year=${end.getFullYear()}&dailyRange.endDate.month=${end.getMonth() + 1}&dailyRange.endDate.day=${end.getDate()}`;
    
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await res.json();

    if (data.error) {
        console.error('Erro de performance GBP:', data.error.message);
        return null;
    }

    const getSum = (metricName: string) => {
        const metric = data.multiDailyMetricValues?.find((m: any) => m.dailyMetric === metricName);
        if (!metric || !metric.dailyMetricValues) return 0;
        return metric.dailyMetricValues.reduce((acc: number, val: any) => acc + (parseInt(val.value) || 0), 0);
    };

    return {
        calls: getSum('CALLS'),
        directions: getSum('DIRECTIONS'),
        websiteClicks: getSum('WEBSITE_CLICKS')
    };
  } catch (error) {
    return null;
  }
}
