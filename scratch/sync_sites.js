const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://rhnlcrhmcieuogtbwppp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPages() {
  console.log('🔄 Iniciando sincronização local de páginas aprovadas do Supabase...');
  
  try {
    // 1. Puxar todas as oportunidades cujo status é layout_gerado ou publicada
    const { data: opps, error } = await supabase
      .from('oportunidades_seo')
      .select('*, clients(*)')
      .in('status', ['layout_gerado', 'publicada']);

    if (error) throw error;
    if (!opps || opps.length === 0) {
      console.log('✅ Nenhuma página pendente de sincronização encontrada no banco.');
      return;
    }

    let syncCount = 0;

    for (const opp of opps) {
      const client = opp.clients;
      if (!client) continue;

      const deployType = client.cms_type || 'ftp';
      if (deployType !== 'nextjs') {
        // Ignora clientes do tipo FTP (Hostinger puro), pois eles são enviados via FTP diretamente
        continue;
      }

      const projectFolder = client.project_folder;
      if (!projectFolder) {
        console.warn(`⚠️ O cliente '${client.name}' não possui a pasta de projeto local configurada.`);
        continue;
      }

      const slug = opp.keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Constrói o caminho físico local subindo um nível a partir de GSC (ia - sites)
      let baseDir = path.join(__dirname, '..', '..', projectFolder);

      // Trata a estrutura especial da FocusArts se a pasta src/app estiver dentro de 'website'
      if (!fs.existsSync(path.join(baseDir, 'src', 'app')) && fs.existsSync(path.join(baseDir, 'website', 'src', 'app'))) {
        baseDir = path.join(baseDir, 'website', 'src', 'app', slug);
      } else {
        baseDir = path.join(baseDir, 'src', 'app', slug);
      }

      const filePath = path.join(baseDir, 'page.tsx');

      console.log(`⏳ Sincronizando página [${opp.keyword}] para: ${filePath}`);

      // Cria a pasta da palavra-chave localmente
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      // Grava o arquivo físico .tsx com o layout final gerado pelo Stitch
      fs.writeFileSync(filePath, opp.layout_draft, 'utf8');
      
      // Atualiza o status no banco de dados para publicada
      if (opp.status !== 'publicada') {
        const baseUrl = client.gsc_url ? client.gsc_url.replace(/\/$/, '') : `https://${client.name.replace(/\s+/g, '').toLowerCase()}.com.br`;
        const publishedUrl = `${baseUrl}/${slug}`;
        
        await supabase
          .from('oportunidades_seo')
          .update({ status: 'publicada', published_url: publishedUrl })
          .eq('id', opp.id);
      }

      syncCount++;
    }

    console.log(`\n🎉 Sincronização concluída com sucesso! Total de páginas sincronizadas fisicamente: ${syncCount}`);

  } catch (err) {
    console.error('❌ Ocorreu um erro durante a sincronização:', err.message);
  }
}

syncPages();
