
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) { process.env[k] = envConfig[k]; }

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`);
  const data = await response.json();
  
  console.log('--- MODELOS COM SUPORTE A generateContent ---');
  const valid = (data.models || []).filter(m => 
    m.supportedGenerationMethods?.includes('generateContent') &&
    m.name.includes('gemini')
  );
  
  valid.forEach(m => console.log(`✅ ${m.name}  →  "${m.displayName}"`));
  console.log(`\nTotal: ${valid.length} modelos disponíveis`);
}

listModels().catch(console.error);
