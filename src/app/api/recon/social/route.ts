
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const { platform, username, limit = 10 } = await req.json();
        const token = process.env.APIFY_TOKEN;

        if (!token) return NextResponse.json({ error: 'Apify Token não configurado' }, { status: 500 });

        let actorId = '';
        if (platform === 'instagram') actorId = 'apify~instagram-scraper';
        else if (platform === 'google-maps') actorId = 'apify~google-maps-scraper';
        else return NextResponse.json({ error: 'Plataforma não suportada' }, { status: 400 });

        console.log(`--- Recon Social Iniciado via API: ${platform} / ${username} ---`);

        const response = await axios.post(`https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`, {
            "usernames": platform === 'instagram' ? [username] : undefined,
            "queries": platform === 'google-maps' ? [username] : undefined,
            "resultsLimit": limit
        });

        return NextResponse.json({ 
            success: true, 
            runId: response.data.data.id,
            datasetId: response.data.data.defaultDatasetId,
            message: 'Varredura iniciada no Apify. O Antigravity processará os resultados em breve.'
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
