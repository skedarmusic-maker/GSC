require('dotenv').config({ path: '.env' });

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID.trim(),
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET.trim(),
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN.trim(),
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function listLocations() {
  try {
    const accessToken = await getAccessToken();
    const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    const accountsData = await accountsRes.json();
    console.log('Accounts:', accountsData.accounts.length);

    for (const account of accountsData.accounts) {
      console.log('Fetching locations for:', account.name);
      const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,websiteUri`;
      const locationsRes = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
      const locData = await locationsRes.json();
      console.log('Locations output:', JSON.stringify(locData, null, 2));
    }

  } catch(e) {
    console.error('ERROR:', e.message);
  }
}
listLocations();
