import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Tenta ler um arquivo a partir de uma lista de caminhos possíveis.
 * Retorna o conteúdo do primeiro que encontrar, ou null.
 */
function tryReadFile(paths: string[], maxChars = 8000): string | null {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf8').slice(0, maxChars);
      }
    } catch {}
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { opportunityId } = await request.json();

    // 1. Buscar oportunidade + dados completos do cliente
    const { data: opp, error: oppError } = await supabase
      .from('oportunidades_seo')
      .select('*, clients(*)')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opp) {
      return NextResponse.json({ success: false, error: 'Oportunidade não encontrada' });
    }

    if (!opp.content_draft || opp.content_draft.length < 50) {
      return NextResponse.json({
        success: false,
        error: 'O texto (rascunho) desta oportunidade está vazio. Gere o texto primeiro antes de criar o layout.'
      });
    }

    const client = opp.clients;
    const clientName = client?.name || 'Cliente';
    const localPath = client?.local_path || client?.localPath;
    const stitchPrompt = client?.stitch_prompt || client?.design_context?.stitch_prompt || '';
    const businessContext = client?.business_context || '';

    // 2. Ler arquivos reais do projeto do cliente no disco local
    let layoutCode = '';
    let designTokens = '';
    let hasLocalFiles = false;

    if (localPath && fs.existsSync(localPath)) {
      // Tentar ler o layout.tsx (raiz do design, contém Header e Footer reais)
      const layoutContent = tryReadFile([
        path.join(localPath, 'src', 'app', 'layout.tsx'),
        path.join(localPath, 'app', 'layout.tsx'),
        path.join(localPath, 'website', 'src', 'app', 'layout.tsx'),
        path.join(localPath, 'website', 'app', 'layout.tsx'),
      ], 8000);

      if (layoutContent) {
        layoutCode = layoutContent;
        hasLocalFiles = true;
      }

      // Tentar ler globals.css para variáveis de cor e fonte
      const globalsCss = tryReadFile([
        path.join(localPath, 'src', 'app', 'globals.css'),
        path.join(localPath, 'app', 'globals.css'),
        path.join(localPath, 'website', 'src', 'app', 'globals.css'),
      ], 3000);

      // Tentar ler tailwind.config para tokens de design
      const tailwindConfig = tryReadFile([
        path.join(localPath, 'tailwind.config.ts'),
        path.join(localPath, 'tailwind.config.js'),
        path.join(localPath, 'website', 'tailwind.config.ts'),
        path.join(localPath, 'website', 'tailwind.config.js'),
      ], 3000);

      designTokens = [globalsCss, tailwindConfig].filter(Boolean).join('\n\n');
    }

    // 3. Montar o prompt contextualizado para o Gemini
    const layoutSection = hasLocalFiles
      ? `
CÓDIGO DO LAYOUT ATUAL DO SITE (layout.tsx REAL do projeto):
\`\`\`tsx
${layoutCode}
\`\`\`

⚠️ REGRA CRÍTICA DE IDENTIDADE VISUAL:
Analise o código layout.tsx acima com atenção máxima.
- Identifique EXATAMENTE quais componentes de Header/Navbar e Footer o site usa (ex: <Header />, <Navbar />, <Footer />, etc.)
- Copie os imports exatos desses componentes para a nova página.
- A nova página DEVE usar os mesmos componentes de Header e Footer que já existem no projeto.
- NÃO invente, NÃO crie novos headers ou footers, NÃO modifique o logo.
- O usuário vai comparar a nova página com o site original, então Header e Footer devem ser IDÊNTICOS.
`
      : `
⚠️ ATENÇÃO: O caminho local do projeto não foi encontrado ou não foi configurado.
Crie um Header e Footer coerentes com o Manual da Marca fornecido abaixo.
`;

    const designSection = designTokens
      ? `
TOKENS DE DESIGN DO SITE (globals.css / tailwind.config):
\`\`\`
${designTokens}
\`\`\`
Use as mesmas variáveis de cor, fontes e estilos definidos acima para garantir consistência visual.
`
      : '';

    const brandSection = stitchPrompt
      ? `
MANUAL DA MARCA DO CLIENTE (regras que nunca podem ser quebradas):
${stitchPrompt}
`
      : '';

    const knowledgeSection = businessContext
      ? `
CONTEXTO DO NEGÓCIO DO CLIENTE:
${businessContext}
`
      : '';

    const prompt = `Você é um expert em Next.js 14 e TypeScript especializado em criar páginas de alta conversão para sites locais brasileiros.

Sua tarefa é criar uma nova página (page.tsx) para o site do cliente "${clientName}".

PALAVRA-CHAVE FOCO DA PÁGINA: "${opp.keyword}"

TEXTO/COPY DA PÁGINA (USE ESTE CONTEÚDO NA ÍNTEGRA, esta é a razão da página existir):
---
${opp.content_draft}
---
${layoutSection}
${designSection}
${brandSection}
${knowledgeSection}

REGRAS OBRIGATÓRIAS DE DESENVOLVIMENTO:
1. Retorne APENAS o código TypeScript/TSX puro. Sem crases de markdown, sem explicações, sem comentários.
2. O arquivo deve ser uma page.tsx válida para Next.js 14 App Router.
3. Exporte a função como: export default function Page() { ... }
4. Inclua metadados SEO: export const metadata = { title: "...", description: "..." } usando a palavra-chave "${opp.keyword}" no título e na descrição.
5. Use Tailwind CSS para toda estilização.
6. ${hasLocalFiles ? 'OBRIGATÓRIO: Importe e renderize o Header/Navbar e Footer do projeto exatamente como estão no layout.tsx acima.' : 'Crie um header e footer seguindo o manual da marca.'}
7. O conteúdo principal deve incluir FIELMENTE o texto fornecido na seção "TEXTO/COPY DA PÁGINA".
8. Estruture o conteúdo visualmente em: (1) Hero com o título da palavra-chave, (2) Seções do conteúdo, (3) CTA final de contato ou serviço.
9. NÃO use imagens externas. Use fundos coloridos com Tailwind ou SVGs inline simples se necessário.
10. O código deve compilar sem erros em um projeto Next.js 14 com Tailwind CSS.`;

    // 4. Chamar o Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok || geminiData.error) {
      console.error('Erro Gemini generate-layout:', geminiData);
      return NextResponse.json({
        success: false,
        error: `Erro do Gemini: ${geminiData.error?.message || 'Resposta inválida da API'}`
      });
    }

    let generatedCode = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!generatedCode || generatedCode.length < 100) {
      return NextResponse.json({ success: false, error: 'O Gemini não retornou código suficiente. Tente novamente.' });
    }

    // Limpar marcações de markdown que o modelo insiste em incluir
    generatedCode = generatedCode
      .replace(/^```(?:tsx?|typescript|jsx?)?\n?/m, '')
      .replace(/```\s*$/m, '')
      .trim();

    // 5. Salvar no banco de dados
    const { error: updateError } = await supabase
      .from('oportunidades_seo')
      .update({ layout_draft: generatedCode, status: 'layout_gerado' })
      .eq('id', opportunityId);

    if (updateError) {
      console.error('Erro ao salvar layout no Supabase:', updateError);
      return NextResponse.json({ success: false, error: updateError.message });
    }

    return NextResponse.json({
      success: true,
      layout_draft: generatedCode,
      debug: {
        usedLocalFiles: hasLocalFiles,
        localPath: localPath || 'não configurado',
        codeLength: generatedCode.length
      }
    });

  } catch (error: any) {
    console.error('Erro crítico na API generate-layout:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
