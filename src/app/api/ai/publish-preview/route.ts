
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as ftp from 'basic-ftp';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { opportunityId } = await req.json();

    // 1. Buscar dados da oportunidade e do cliente
    const { data: opp, error: oppError } = await supabase
      .from('seo_opportunities')
      .select('*, clients(*)')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opp) return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 });

    const layoutCode = opp.layout_draft;
    const slug = opp.keyword.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // 2. Preparar o HTML Estático para o Preview (Tailwind CDN)
    // Extraímos apenas o que está dentro do return () do componente React
    const bodyContent = layoutCode.match(/return \(([\s\S]*)\);/)?.[1] || layoutCode;
    
    const staticHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PREVIEW: ${opp.keyword}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
              body { font-family: 'Inter', sans-serif; }
              /* Reset de estilos para simular Next.js */
              .motion-safe\\:animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
              @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
          </style>
      </head>
      <body>
          ${bodyContent}
      </body>
      </html>
    `;

    // 3. Conectar ao FTP da Hostinger (Dados que pegamos do final_deploy.js)
    const client = new ftp.Client();
    client.ftp.verbose = false;

    // TODO: No futuro, pegar do banco. Por agora, fixo para o Chaveiro Rafael como no Pagani.
    try {
      await client.access({
        host: "147.93.14.87",
        user: "u786839041.chaveirorafael",
        password: "1q2w3e4r@@@SK",
        secure: false
      });

      // 4. Garantir pasta /preview e subir arquivo
      await client.ensureDir("public_html/preview");
      
      const fileName = `${slug}.html`;
      const tempPath = path.join(process.cwd(), 'scratch', fileName);
      
      // Criar arquivo temporário localmente para o upload
      import fs from 'fs';
      fs.writeFileSync(tempPath, staticHtml);

      await client.uploadFrom(tempPath, fileName);
      
      // Limpar arquivo temporário
      fs.unlinkSync(tempPath);

      const previewUrl = `https://chaveiro24hribeiraopreto.com.br/preview/${fileName}`;

      // 5. Atualizar o status no banco (opcional, para controle)
      await supabase.from('seo_opportunities').update({ 
        published_url: previewUrl,
        status: 'layout_gerado' 
      }).eq('id', opportunityId);

      return NextResponse.json({ success: true, previewUrl });

    } catch (ftpError: any) {
      console.error('Erro de FTP:', ftpError);
      return NextResponse.json({ error: 'Falha ao conectar no FTP da Hostinger: ' + ftpError.message }, { status: 500 });
    } finally {
      client.close();
    }

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
