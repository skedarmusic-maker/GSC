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
    // 2. Obter código do layout e design
    // 2A. Primeiro tenta usar os dados salvos no banco (ideal para quando estiver rodando na Vercel)
    let layoutCode = client?.design_context?.layout || '';
    let designTokens = client?.design_context?.designTokens || '';
    let homeCode = client?.design_context?.homePage || '';
    let hasLocalFiles = !!layoutCode || !!homeCode;

    // 2B. Se o banco estiver vazio, tenta ler os arquivos reais do projeto (se rodando em localhost:3000)
    if (!hasLocalFiles && localPath && fs.existsSync(localPath)) {
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

      // Tentar ler a page.tsx da Home para ver se Navbar/Footer estão importados nela
      const homeContent = tryReadFile([
        path.join(localPath, 'src', 'app', 'page.tsx'),
        path.join(localPath, 'app', 'page.tsx'),
        path.join(localPath, 'website', 'src', 'app', 'page.tsx'),
        path.join(localPath, 'website', 'app', 'page.tsx'),
      ], 8000);

      if (homeContent) {
        homeCode = homeContent;
        hasLocalFiles = true;
      }

      // Tentar ler globals.css para variáveis de cor e fonte
      const globalsCss = tryReadFile([
        path.join(localPath, 'src', 'app', 'globals.css'),
        path.join(localPath, 'app', 'globals.css'),
        path.join(localPath, 'website', 'src', 'app', 'globals.css'),
        path.join(localPath, 'website', 'src', 'globals.css'),
        path.join(localPath, 'website', 'globals.css'),
      ], 6000);

      // Tentar ler tailwind.config para tokens de design
      const tailwindConfig = tryReadFile([
        path.join(localPath, 'tailwind.config.ts'),
        path.join(localPath, 'tailwind.config.js'),
        path.join(localPath, 'website', 'tailwind.config.ts'),
        path.join(localPath, 'website', 'tailwind.config.js'),
      ], 6000);

      designTokens = [globalsCss, tailwindConfig].filter(Boolean).join('\n\n');
    }

    // 3. Montar o prompt contextualizado para o Gemini
    const layoutSection = hasLocalFiles
      ? `
${layoutCode ? `CÓDIGO DO LAYOUT ATUAL DO SITE (layout.tsx REAL do projeto):
\`\`\`tsx
${layoutCode}
\`\`\`
` : ''}

${homeCode ? `CÓDIGO DA PÁGINA INICIAL DO SITE (page.tsx REAL do projeto):
\`\`\`tsx
${homeCode}
\`\`\`
` : ''}

⚠️ REGRA CRÍTICA DE IDENTIDADE VISUAL:
Analise o código layout.tsx e o código page.tsx acima com atenção máxima.
- Identifique EXATAMENTE quais componentes de Header/Navbar e Footer o site usa (ex: import { Navbar } from "@/components/Navbar", import { Footer } from "@/components/Footer", etc.)
- Os componentes de Header e Footer do site podem estar no layout.tsx ou diretamente na page.tsx da Home. 
- Copie os imports exatos desses componentes de Navbar, Header e Footer para a nova página.
- A nova página DEVE usar os mesmos componentes de Header e Footer que já existem no projeto.
- NÃO invente, NÃO crie novos headers ou footers, NÃO modifique o logo.
- O usuário vai comparar a nova página com o site original, então Header e Footer devem ser IDÊNTICOS.

⚠️ ALERTA CONTRA DUPLICAÇÃO DE CONTEÚDO DA HOME:
- NÃO CLONE ou duplique as seções internas de corpo da página inicial (como a lista de serviços da Home, depoimentos da Home, etc.).
- A page.tsx da Home serve APENAS para você entender a paleta de cores (Tailwind), o espaçamento dos contêineres, as classes de tipografia e os imports de Navbar/Footer.
- Você DEVE descartar as seções de conteúdo do corpo da Home e criar um layout de conteúdo corporativo TOTALMENTE NOVO e focado na palavra-chave "${opp.keyword}".
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

TEXTO/COPY DA PÁGINA (USE ESTE CONTEÚDO NA ÍNTEGRA, esta é a razão de ser da página):
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
6. IMPORTANTE (Navbar/Footer): Se o layout.tsx fornecido já contiver o Header/Navbar e Footer principais do projeto (definidos de forma global), a página gerada NÃO DEVE renderizar nem importar novos componentes de Header, Navbar ou Footer, focando estritamente no conteúdo útil do corpo da página para evitar duplicidades visuais no site original. Caso contrário, se o layout.tsx não contiver esses elementos globais ou não houver arquivos locais, crie um header e footer conforme as regras do manual de design do cliente.
7. O corpo principal da página DEVE incluir de forma INTEGRAL e FIEL o texto fornecido em "TEXTO/COPY DA PÁGINA". Não resuma, não encurte e não invente substitutos.
8. Diagramação Premium e Identidade de Marca: Aplique rigorosamente a identidade visual descrita no "MANUAL DA MARCA DO CLIENTE" e os padrões estéticos observados nos componentes da Home (como classes de inclinação -skew-x-12 nos botões/badges contendo elementos com skew-x-12 para compensar, glows neon nos cards, efeitos de flare radial gradient em hover, contornos com a classe .border-text ou .border-text-primary, e fontes nos tamanhos adequados). A página deve parecer uma extensão premium e agressiva do site original, não uma página genérica de template. Divida o texto do copy em seções com Hero impactante, blocos estéticos de diferenciais e serviços, FAQs e CTAs proeminentes para WhatsApp.
9. NÃO use imagens externas. Use fundos coloridos com Tailwind ou SVGs inline simples se necessário. NÃO importe nenhuma biblioteca externa como lucide-react, heroicons, react-icons ou similar. Se precisar de ícones, defina-os como componentes SVG inline diretamente no arquivo.
10. O código deve compilar sem erros em um projeto Next.js 14 com Tailwind CSS sem nenhuma dependência adicional além das já existentes no projeto.
11. O código gerado deve ser limpo, estruturado de forma concisa e direta. Evite redundâncias extremas de componentes e ícones repetidos para garantir que o código total tenha menos de 10.000 caracteres, prevenindo problemas de truncamento na transmissão e mantendo a alta fidelidade estética.`;

    // 4. Chamar o Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
