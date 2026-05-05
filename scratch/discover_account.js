// Script para descobrir o Account ID automaticamente
const dotenv = require('dotenv');
dotenv.config();

async function discover() {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID.trim(),
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET.trim(),
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN.trim(),
      grant_type: 'refresh_token',
    }),
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  console.log('--- BUSCANDO CONTAS DISPONÍVEIS ---');
  const res = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

discover();
