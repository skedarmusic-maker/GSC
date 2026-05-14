require('dotenv').config();

async function testGoogleAuth() {
    console.log("🔍 INICIANDO DIAGNÓSTICO DE CONEXÃO GOOGLE...\n");

    // 1. Testar Google Business Profile (Maps)
    console.log("--- Testando Google Business Profile (OAuth2) ---");
    try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_ADS_CLIENT_ID?.trim() || '',
                client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET?.trim() || '',
                refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim() || '',
                grant_type: 'refresh_token',
            }),
        });
        const data = await res.json();
        if (data.access_token) {
            console.log("✅ OAuth2: Token de acesso gerado com sucesso!");
        } else {
            console.error("❌ OAuth2 Erro:", data);
        }
    } catch (e) {
        console.error("❌ OAuth2 Falha Crítica:", e.message);
    }

    // 2. Testar Google Search Console (Service Account)
    console.log("\n--- Testando Google Search Console (Service Account) ---");
    try {
        const { getGSCClient } = require('./src/lib/gsc');
        const gsc = await getGSCClient();
        const response = await gsc.sites.list();
        console.log(`✅ Search Console: Conectado! ${response.data.siteEntry?.length || 0} sites encontrados.`);
    } catch (e) {
        console.error("❌ Search Console Erro:", e.message);
    }
}

testGoogleAuth();
