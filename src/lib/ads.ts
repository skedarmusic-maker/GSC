// Tentativa Final: v17 + searchStream (Mais moderno)

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

export async function getAdsPerformance(days: number = 28) {
  const token = await getAccessToken();
  const customerId = "3409898107";
  const loginId = "1102084899";
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!.trim();

  // searchStream é mais resiliente em algumas contas
  const url = `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'developer-token': devToken,
      'login-customer-id': loginId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      query: `SELECT ad_group_criterion.keyword.text, metrics.clicks, metrics.impressions, metrics.cost_micros FROM keyword_view WHERE segments.date DURING LAST_30_DAYS AND metrics.impressions > 0` 
    }),
  });

  const text = await res.text();
  
  if (!res.ok) {
     throw new Error(`Ads Error ${res.status}: ${text.slice(0, 100)}`);
  }

  // searchStream retorna um array de objetos, onde cada um tem um campo "results"
  const json = JSON.parse(text);
  const rows: any[] = [];
  
  if (Array.isArray(json)) {
      json.forEach(batch => {
          if (batch.results) {
              batch.results.forEach((r: any) => {
                  rows.push({
                      keyword: r.adGroupCriterion?.keyword?.text || 'Termo',
                      clicks: Number(r.metrics?.clicks || 0),
                      impressions: Number(r.metrics?.impressions || 0),
                      cost: Number(r.metrics?.costMicros || 0) / 1000000,
                  });
              });
          }
      });
  }

  return rows;
}
