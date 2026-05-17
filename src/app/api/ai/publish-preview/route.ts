import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as ftp from 'basic-ftp';
import path from 'path';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { opportunityId } = await req.json();

    // 1. Buscar dados da oportunidade e do cliente dono dela
    const { data: opp, error: oppError } = await supabase
      .from('oportunidades_seo')
      .select('*, clients(*)')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opp) return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 });

    const layoutCode = opp.layout_draft;
    if (!layoutCode) return NextResponse.json({ error: 'Layout final ainda não gerado' }, { status: 400 });

    const slug = opp.keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // 2. Extrair o contexto de design e deploy do cliente
    const designContext = opp.clients?.design_context || {};
    const deployType = opp.clients?.cms_type || designContext.deploy_type || 'ftp';
    
    // Obter credenciais dinâmicas do banco
    const ftpHost = designContext.ftp_host;
    const ftpUser = designContext.ftp_user;
    const ftpPass = designContext.ftp_pass;

    // Se for do tipo FTP mas as credenciais dinâmicas estiverem vazias, bloqueia para não enviar para o cliente errado!
    if (deployType === 'ftp' && (!ftpHost || !ftpUser || !ftpPass)) {
      return NextResponse.json({ 
        error: `As credenciais de FTP do cliente '${opp.clients?.name}' não estão configuradas. Por favor, cadastre as credenciais de FTP na aba de configurações do cliente.` 
      }, { status: 400 });
    }

    // 3. Preparar o HTML Estático para o Preview (Criação de Casca)
    // Extrai apenas o miolo do return se for código TSX/Next.js
    const bodyContent = layoutCode.match(/return \(([\s\S]*)\);/)?.[1] || layoutCode;
    
    const staticHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PREVIEW: ${opp.keyword}</title>
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

    // 4. Se for deploy via FTP, faz a transmissão para o preview do servidor do cliente
    if (deployType === 'ftp') {
      const client = new ftp.Client();
      client.ftp.verbose = false;

      try {
        await client.access({
          host: ftpHost,
          user: ftpUser,
          password: ftpPass,
          secure: false
        });

        // Garante a subpasta /preview
        await client.ensureDir("public_html/preview");
        
        const fileName = `${slug}.html`;
        const os = require('os');
        const tempPath = path.join(os.tmpdir(), fileName);
        
        fs.writeFileSync(tempPath, staticHtml, 'utf8');
        await client.uploadFrom(tempPath, fileName);
        
        // Limpar arquivo local temporário
        fs.unlinkSync(tempPath);

        const baseUrl = opp.clients?.gsc_url ? opp.clients.gsc_url.replace(/\/$/, '') : `https://${opp.clients?.name?.replace(/\s+/g, '').toLowerCase()}.com.br`;
        const previewUrl = `${baseUrl}/preview/${fileName}`;

        // 5. Atualizar o status da oportunidade no banco
        await supabase.from('oportunidades_seo').update({ 
          published_url: previewUrl,
          status: 'layout_gerado' 
        }).eq('id', opportunityId);

        return NextResponse.json({ success: true, previewUrl });

      } catch (ftpError: any) {
        console.error('Erro de FTP:', ftpError);
        return NextResponse.json({ error: 'Falha ao conectar no FTP do Cliente: ' + ftpError.message }, { status: 500 });
      } finally {
        client.close();
      }
    } else {
      // Caso o deploy do cliente seja em NextJS puro (sem FTP)
      const previewUrl = `/preview/${slug}`;
      await supabase.from('oportunidades_seo').update({ 
        published_url: previewUrl,
        status: 'layout_gerado' 
      }).eq('id', opportunityId);

      return NextResponse.json({ success: true, previewUrl });
    }

  } catch (err: any) {
    console.error('Erro na API de Preview:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
