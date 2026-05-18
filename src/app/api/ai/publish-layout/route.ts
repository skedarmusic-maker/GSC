import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Normaliza uma keyword para gerar um slug de URL limpo.
 */
function toSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Descobre o diretório base do app (src/app ou app) dentro de um projeto Next.js.
 */
function findAppDir(projectRoot: string): string | null {
  const candidates = [
    path.join(projectRoot, 'src', 'app'),
    path.join(projectRoot, 'app'),
    path.join(projectRoot, 'website', 'src', 'app'),
    path.join(projectRoot, 'website', 'app'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { opportunityId } = await request.json();

    // 1. Buscar oportunidade + dados do cliente
    const { data: opp, error: oppError } = await supabase
      .from('oportunidades_seo')
      .select('*, clients(*)')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opp) {
      return NextResponse.json({ success: false, error: 'Oportunidade não encontrada' });
    }

    if (!opp.layout_draft) {
      return NextResponse.json({ success: false, error: 'Layout não gerado ainda. Gere o layout primeiro.' });
    }

    const client = opp.clients;
    const slug = toSlug(opp.keyword);
    const localPath = client?.local_path || client?.localPath;
    const baseUrl = client?.gsc_url
      ? client.gsc_url.replace(/\/$/, '')
      : `https://${(client?.name || 'cliente').replace(/\s+/g, '').toLowerCase()}.com.br`;

    const publishedUrl = `${baseUrl}/${slug}`;

    // 2. Tentar injetar o arquivo no projeto local do cliente
    let localWritten = false;
    let localFilePath = '';
    let writeError = '';

    if (localPath) {
      try {
        const appDir = findAppDir(localPath);
        if (appDir) {
          const pageDir = path.join(appDir, slug);
          const pageFile = path.join(pageDir, 'page.tsx');

          // Criar a pasta do slug se não existir
          if (!fs.existsSync(pageDir)) {
            fs.mkdirSync(pageDir, { recursive: true });
          }

          // Escrever o arquivo page.tsx gerado pela IA
          fs.writeFileSync(pageFile, opp.layout_draft, 'utf8');
          localWritten = true;
          localFilePath = pageFile;
        } else {
          writeError = `Não foi possível encontrar a pasta src/app ou app dentro de "${localPath}".`;
        }
      } catch (fsError: any) {
        // Em produção (Vercel serverless), o disco é read-only. Apenas registramos o aviso.
        writeError = fsError.message;
        console.warn('Gravação local ignorada (ambiente serverless):', fsError.message);
      }
    } else {
      writeError = 'O caminho local do projeto (localPath) não está configurado para este cliente.';
    }

    // 3. Atualizar status no Supabase
    await supabase
      .from('oportunidades_seo')
      .update({
        status: 'publicada',
        published_url: publishedUrl
      })
      .eq('id', opportunityId);

    // 4. Montar resposta com mensagem amigável
    const message = localWritten
      ? `✅ Página injetada com sucesso!\n\nArquivo criado em:\n${localFilePath}\n\nAgora basta fazer o commit e o deploy do projeto "${client?.name}".`
      : `⚠️ O código foi salvo no banco de dados, mas não foi possível gravar no disco local.\n\nMotivo: ${writeError}\n\nSolução: Use o script de sincronização local (sync_sites.js) para injetar a página na pasta do projeto.`;

    return NextResponse.json({
      success: true,
      url: publishedUrl,
      localWritten,
      localFilePath: localFilePath || null,
      message
    });

  } catch (error: any) {
    console.error('Erro na API publish-layout:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
