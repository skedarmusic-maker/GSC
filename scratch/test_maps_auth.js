
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testMapsAuth() {
  console.log("--- TESTANDO CONEXÃO GOOGLE MAPS (GBP) ---");
  
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("❌ Erro: Faltam credenciais no .env.local");
    return;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        refresh_token: refreshToken.trim(),
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();
    
    if (data.access_token) {
      console.log("✅ Sucesso! O Refresh Token ainda é válido.");
      console.log("Token gerado:", data.access_token.substring(0, 15) + "...");
    } else {
      console.error("❌ Erro ao renovar token:", data);
      console.log("\n💡 Dica: Se o erro for 'invalid_grant', você precisará gerar um novo Refresh Token no OAuth Playground.");
    }
  } catch (err) {
    console.error("❌ Falha na conexão:", err);
  }
}

testMapsAuth();
