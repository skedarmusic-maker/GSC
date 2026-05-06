require('dotenv').config({ path: '.env' });

async function test() {
  const resToken = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID.trim(),
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET.trim(),
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN.trim(),
      grant_type: 'refresh_token',
    }),
  });
  const dataToken = await resToken.json();
  const accessToken = dataToken.access_token;
  
  const metric = 'WEBSITE_CLICKS';
  const url = `https://businessprofileperformance.googleapis.com/v1/locations/7943859216770695216:getDailyMetricsTimeSeries?dailyMetric=${metric}&dailyRange.startDate.year=2026&dailyRange.startDate.month=4&dailyRange.startDate.day=6&dailyRange.endDate.year=2026&dailyRange.endDate.month=5&dailyRange.endDate.day=6`;

  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
