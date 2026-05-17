import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { opportunityId } = await request.json();
    
    // 1. Puxar a oportunidade e a configuração do cliente
    const { data: opp, error: oppError } = await supabase
      .from('oportunidades_seo')
      .select('*, clients(*)')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opp) return NextResponse.json({ success: false, error: 'Oportunidade não encontrada' });
    if (!opp.layout_draft) return NextResponse.json({ success: false, error: 'Layout não gerado ainda' });

    const designContext = opp.clients?.design_context || {};
    const deployType = opp.clients?.cms_type || designContext.deploy_type || 'ftp';
    
    const slug = opp.keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const baseUrl = opp.clients?.gsc_url ? opp.clients.gsc_url.replace(/\/$/, '') : `https://${opp.clients?.name?.replace(/\s+/g, '').toLowerCase()}.com.br`;
    const publishedUrl = `${baseUrl}/${slug}`;

    // 2. Se for deploy via FTP (Hostinger / Servidor Compartilhado)
    if (deployType === 'ftp') {
      const ftpHost = designContext.ftp_host;
      const ftpUser = designContext.ftp_user;
      const ftpPass = designContext.ftp_pass;

      if (!ftpHost || !ftpUser || !ftpPass) {
        return NextResponse.json({ 
          success: false, 
          error: `As credenciais de FTP do cliente '${opp.clients?.name}' não estão configuradas. Por favor, cadastre as credenciais de FTP na aba de configurações do cliente.` 
        }, { status: 400 });
      }

      const bodyContent = opp.layout_draft.match(/return \(([\s\S]*)\);/)?.[1] || opp.layout_draft;
      
      const staticHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${opp.keyword}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
            </style>
        </head>
        <body class="bg-black text-white font-sans antialiased">
            ${bodyContent}
        </body>
        </html>
      `;

      const client = new ftp.Client();
      client.ftp.verbose = false;

      try {
        await client.access({
          host: ftpHost,
          user: ftpUser,
          password: ftpPass,
          secure: false
        });

        // 2A. Subir arquivo final na raiz como slug.html
        await client.cd("/");
        const fileName = `${slug}.html`;
        const os = require('os');
        const tempPath = path.join(os.tmpdir(), fileName);

        fs.writeFileSync(tempPath, staticHtml, 'utf8');
        await client.uploadFrom(tempPath, fileName);
        fs.unlinkSync(tempPath);

        // 2B. Garantir ou atualizar o .htaccess para URL limpa
        const htaccessContent = `RewriteEngine On
RewriteCond %{THE_REQUEST} ^[A-Z]{3,9}\ /([^.]+)\.html\ HTTP [NC]
RewriteRule ^([^.]+)\.html$ /$1 [R=301,L]
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}\.html -f
RewriteRule ^([^/]+)$ /$1.html [L]`;

        const htaccessPath = path.join(os.tmpdir(), '.htaccess');
        fs.writeFileSync(htaccessPath, htaccessContent, 'utf8');
        await client.uploadFrom(htaccessPath, ".htaccess");
        fs.unlinkSync(htaccessPath);

        // 3. Atualizar no Supabase
        await supabase
          .from('oportunidades_seo')
          .update({ status: 'publicada', published_url: publishedUrl })
          .eq('id', opportunityId);

        return NextResponse.json({ success: true, url: publishedUrl });

      } catch (ftpError: any) {
        console.error('Erro de FTP na Publicação:', ftpError);
        return NextResponse.json({ success: false, error: 'Erro ao conectar no FTP na publicação: ' + ftpError.message });
      } finally {
        client.close();
      }

      // 4. Se for deploy via NextJS puro (Vercel/Local)
      const projectFolder = opp.clients?.project_folder || designContext.project_folder;
      if (!projectFolder) {
        return NextResponse.json({ success: false, error: 'O cliente não possui a "Pasta do Projeto" configurada.' });
      }

      // Constrói o caminho de injeção direta no disco local do cliente
      // Lida de forma inteligente se a pasta do projeto informada já contém 'website' ou subpastas
      let baseDir = path.join(process.cwd(), '..', projectFolder);
      
      // Se a pasta src/app não estiver diretamente no caminho montado, tenta entrar na pasta /src/app ou /website/src/app
      if (!fs.existsSync(path.join(baseDir, 'src', 'app')) && fs.existsSync(path.join(baseDir, 'website', 'src', 'app'))) {
        baseDir = path.join(baseDir, 'website', 'src', 'app', slug);
      } else {
        baseDir = path.join(baseDir, 'src', 'app', slug);
      }
      
      const filePath = path.join(baseDir, 'page.tsx');
      let localWritten = false;

      try {
        // Cria a subpasta da palavra-chave no projeto do cliente
        if (!fs.existsSync(baseDir)) {
          fs.mkdirSync(baseDir, { recursive: true });
        }
        // Injeta o arquivo .tsx inteiro com o layout da IA
        fs.writeFileSync(filePath, opp.layout_draft, 'utf8');
        localWritten = true;
      } catch (localWriteError: any) {
        console.warn('Gravação em disco local ignorada (ambiente Serverless ou sem acesso à pasta física):', localWriteError.message);
      }

      await supabase
        .from('oportunidades_seo')
        .update({ status: 'publicada', published_url: publishedUrl })
        .eq('id', opportunityId);

      return NextResponse.json({ 
        success: true, 
        url: publishedUrl,
        message: localWritten 
          ? `Sucesso! Página injetada diretamente na pasta '${projectFolder}' com sucesso.` 
          : `Sucesso! Página gravada no banco de dados centralizado. Use o script de sincronização local para salvá-la em disco.`
      });
    }

  } catch (error: any) {
    console.error('Erro na API publish-layout:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
