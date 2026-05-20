import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { clientId, localPath, manualCode } = await req.json();

    if (!clientId || (!localPath && !manualCode)) {
      return NextResponse.json({ error: 'Dados insuficientes. Informe o caminho local ou cole o código manual.' }, { status: 400 });
    }

    // Normalizar o caminho para evitar erros de barra no Windows
    const normalizedPath = localPath ? path.normalize(localPath) : null;

    // 1. Tentar ler os arquivos de design do projeto
    let designContext = manualCode || "";
    let layoutContent = "";
    let homeContent = "";

    if (!designContext && normalizedPath) {
      // Possíveis locais do Tailwind
      const tailwindVariants = [
        path.join(normalizedPath, 'tailwind.config.ts'),
        path.join(normalizedPath, 'tailwind.config.js'),
        path.join(normalizedPath, 'tailwind.config.mjs'),
        path.join(normalizedPath, 'tailwind.config.cjs'),
        path.join(normalizedPath, 'website', 'tailwind.config.ts'),
        path.join(normalizedPath, 'website', 'tailwind.config.js'),
        path.join(normalizedPath, 'website', 'tailwind.config.mjs'),
        path.join(normalizedPath, 'website', 'tailwind.config.cjs')
      ];

      // Possíveis locais do CSS
      const cssVariants = [
        path.join(normalizedPath, 'src', 'app', 'globals.css'),
        path.join(normalizedPath, 'src', 'globals.css'),
        path.join(normalizedPath, 'globals.css'),
        path.join(normalizedPath, 'src', 'index.css'),
        path.join(normalizedPath, 'index.css'),
        path.join(normalizedPath, 'website', 'src', 'app', 'globals.css'),
        path.join(normalizedPath, 'website', 'src', 'globals.css'),
        path.join(normalizedPath, 'website', 'globals.css'),
        path.join(normalizedPath, 'website', 'src', 'index.css'),
        path.join(normalizedPath, 'website', 'index.css')
      ];

      const layoutVariants = [
        path.join(normalizedPath, 'src', 'app', 'layout.tsx'),
        path.join(normalizedPath, 'app', 'layout.tsx'),
        path.join(normalizedPath, 'website', 'src', 'app', 'layout.tsx'),
        path.join(normalizedPath, 'website', 'app', 'layout.tsx')
      ];

      const homePageVariants = [
        path.join(normalizedPath, 'src', 'app', 'page.tsx'),
        path.join(normalizedPath, 'app', 'page.tsx'),
        path.join(normalizedPath, 'website', 'src', 'app', 'page.tsx'),
        path.join(normalizedPath, 'website', 'app', 'page.tsx')
      ];

      for (const p of tailwindVariants) {
        if (fs.existsSync(p)) {
          designContext += `\n--- TAILWIND CONFIG ---\n${fs.readFileSync(p, 'utf8')}`;
          break;
        }
      }

      for (const p of cssVariants) {
        if (fs.existsSync(p)) {
          designContext += `\n--- GLOBALS CSS ---\n${fs.readFileSync(p, 'utf8')}`;
          break;
        }
      }

      for (const p of layoutVariants) {
        if (fs.existsSync(p)) {
          layoutContent = fs.readFileSync(p, 'utf8');
          break;
        }
      }

      for (const p of homePageVariants) {
        if (fs.existsSync(p)) {
          homeContent = fs.readFileSync(p, 'utf8');
          break;
        }
      }

      if (!designContext && !layoutContent && !homeContent) {
        console.error('❌ Arquivos não encontrados em:', normalizedPath);
        return NextResponse.json({
          error: 'Não foi possível encontrar arquivos de design, layout ou página inicial. Verifique se o caminho está correto e se você está rodando o sistema LOCALMENTE (localhost:3000).'
        }, { status: 404 });
      }
    }

    // 2. Pedir para a IA resumir o manual da marca (via Gemini 2.5 Pro)
    const prompt = `Analise o seguinte código de configuração de design (Tailwind/CSS) e resuma as "Regras de Ouro" visuais para um desenvolvedor.
FOCO EM: Cores principais (hexadecimais), estilo (brutalista, minimalista, etc), fontes e espaçamentos.
Retorne apenas um parágrafo curto e direto que sirva de guia para gerar novas páginas idênticas a essa.

CÓDIGO:
${designContext.substring(0, 10000)}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4000 }
        })
      }
    );

    const geminiData = await geminiRes.json();
    const stitchPrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Design sincronizado, mas não foi possível gerar resumo.';

    // 3. Salvar no Banco de Dados
    await supabase
      .from('clients')
      .update({
        stitch_prompt: stitchPrompt,
        project_folder: normalizedPath ? path.basename(normalizedPath) : 'Manual',
        design_context: {
          layout: layoutContent,
          designTokens: designContext,
          homePage: homeContent
        }
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
