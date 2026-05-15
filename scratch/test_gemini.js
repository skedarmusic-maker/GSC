
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Carrega o .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function testGemini() {
  console.log('--- TESTANDO GEMINI (v1beta) ---');
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY não encontrada no .env.local');
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Olá, diga apenas "Conexão OK" se estiver me ouvindo.' }] }]
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCESSO:', data.candidates[0].content.parts[0].text);
    } else {
      console.error('❌ ERRO NA API:', JSON.stringify(data.error));
    }
  } catch (error) {
    console.error('❌ FALHA NA REQUISIÇÃO:', error.message);
  }
}

testGemini();
