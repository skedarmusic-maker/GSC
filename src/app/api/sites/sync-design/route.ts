import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { clientId, localPath } = await req.json();

        if (!clientId || !localPath) {
            return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
        }

        // 1. Tentar ler os arquivos de design do projeto
        let designContext = "";
        const tailwindPath = path.join(localPath, 'tailwind.config.ts');
        const tailwindPathJs = path.join(localPath, 'tailwind.config.js');
        const cssPath = path.join(localPath, 'src', 'app', 'globals.css');

        if (fs.existsSync(tailwindPath)) designContext += fs.readFileSync(tailwindPath, 'utf8');
        else if (fs.existsSync(tailwindPathJs)) designContext += fs.readFileSync(tailwindPathJs, 'utf8');
        
        if (fs.existsSync(cssPath)) designContext += fs.readFileSync(cssPath, 'utf8');

        if (!designContext) {
            return NextResponse.json({ error: 'Não foi possível encontrar arquivos de design (tailwind.config ou globals.css) na pasta especificada.' }, { status: 404 });
        }

        // 2. Pedir para a IA resumir o manual da marca (via fetch nativo — sem SDK)
        const prompt = `Analise o seguinte código de configuração de design (Tailwind/CSS) e resuma as "Regras de Ouro" visuais para um desenvolvedor.
FOCO EM: Cores principais (hexadecimais), estilo (brutalista, minimalista, etc), fontes e espaçamentos.
Retorne apenas um parágrafo curto e direto que sirva de guia para gerar novas páginas idênticas a essa.

CÓDIGO:
${designContext.substring(0, 5000)}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );
        const geminiData = await geminiRes.json();
        const stitchPrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Design sincronizado, mas não foi possível gerar resumo.';

        // 3. Salvar no Banco de Dados
        await supabase
            .from('clients')
            .update({ 
              stitch_prompt: stitchPrompt,
              project_folder: path.basename(localPath) 
            })
            .eq('id', clientId);
        
        return NextResponse.json({ 
            success: true, 
            stitchPrompt,
            message: 'Design sincronizado com sucesso!'
        });
    } catch (err: any) {
        console.error('Erro ao sincronizar design:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

