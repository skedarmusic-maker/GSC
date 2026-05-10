
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;

async function scrapeInstagram(username) {
    console.log(`--- Iniciando Scraper de Instagram para @${username} ---`);
    
    try {
        // Usando o ator apify/instagram-scraper
        const runUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}`;
        
        const response = await axios.post(runUrl, {
            "usernames": [username],
            "resultsLimit": 10,
            "scrapeType": "posts"
        });

        const runId = response.data.data.id;
        const datasetId = response.data.data.defaultDatasetId;
        
        console.log(`🚀 Execução iniciada! Run ID: ${runId}`);
        console.log(`⌛ Aguardando resultados (isso pode levar uns 2 minutos)...`);
        
        // Polling simples para ver se terminou
        let finished = false;
        while (!finished) {
            const statusRes = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
            const status = statusRes.data.data.status;
            console.log(`Status atual: ${status}`);
            if (status === 'SUCCEEDED') finished = true;
            else if (status === 'FAILED' || status === 'ABORTED') throw new Error(`Scraper falhou com status: ${status}`);
            else await new Promise(r => setTimeout(r, 10000)); // Espera 10s
        }

        // Buscar resultados
        const resultsRes = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`);
        const items = resultsRes.data;

        console.log(`✅ Sucesso! ${items.length} posts encontrados.`);
        
        // Extrair apenas o texto (caption) para o nosso treinamento
        const captions = items.map(item => item.caption).filter(c => c).join('\n\n---\n\n');
        
        console.log('--- CONTEÚDO CAPTURADO ---');
        console.log(captions.substring(0, 500) + '...');

        return captions;
    } catch (err) {
        console.error('❌ Erro no Apify:', err.message);
    }
}

scrapeInstagram('paganicustomfloripa');
