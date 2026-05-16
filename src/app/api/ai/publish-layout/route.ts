import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
      .select('*, clients(name, project_folder, gsc_url, design_context)')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opp) return NextResponse.json({ success: false, error: 'Oportunidade não encontrada' });
    if (!opp.layout_draft) return NextResponse.json({ success: false, error: 'Layout não gerado ainda' });

    const projectFolder = opp.clients?.project_folder || opp.clients?.design_context?.project_folder;
    if (!projectFolder) {
      return NextResponse.json({ success: false, error: 'O cliente não possui a "Pasta do Projeto" configurada nas definições do GSC.' });
    }

    // 2. Definir o caminho (GSC está ao lado da pasta do cliente)
    // Criamos o slug da URL com base na keyword
    const slug = opp.keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Caminho dinâmico baseado na configuração do cliente!
    const baseDir = path.join(process.cwd(), '..', projectFolder, 'src', 'app', slug);
    const filePath = path.join(baseDir, 'page.tsx');

    // 3. Escrever o arquivo físico
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    fs.writeFileSync(filePath, opp.layout_draft, 'utf8');

    // 4. Atualizar o banco de dados
    // Vamos gerar uma URL limpa baseada no nome do projeto se não tivermos o domínio exato, ou melhor, usamos a gsc_url se possível.
    const baseUrl = opp.clients?.gsc_url ? opp.clients.gsc_url.replace(/\/$/, '') : `https://${projectFolder.replace(/\s+/g, '').toLowerCase()}.com.br`;
    const publishedUrl = `${baseUrl}/${slug}`;
    
    await supabase
      .from('oportunidades_seo')
      .update({ status: 'publicada', published_url: publishedUrl })
      .eq('id', opportunityId);

    return NextResponse.json({ success: true, url: publishedUrl });
  } catch (error: any) {
    console.error('Erro na API publish-layout:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
