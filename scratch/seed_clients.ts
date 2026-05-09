import { createClient } from '@supabase/supabase-js';
import { listSites } from './src/lib/gsc';
import { listLocations } from './src/lib/business';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente manualmente se necessário (ajuste o caminho se estiver no root)
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🚀 Iniciando seeding de clientes...');
  
  try {
    const [gscSites, gbpLocations] = await Promise.all([
      listSites().catch(() => []),
      listLocations().catch(() => [])
    ]);

    const unified: any[] = [];

    // Lógica de unificação (mesma do api/sites/route.ts)
    for (const loc of gbpLocations) {
      unified.push({
        name: loc.title,
        gbp_account_id: loc.accountId,
        gbp_location_id: loc.name.replace('locations/', ''),
        website_url: loc.websiteUri,
        gsc_url: null
      });
    }

    for (const site of gscSites) {
      if (!site.siteUrl) continue;
      const cleanGscUrl = site.siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
      
      let found = false;
      for (const item of unified) {
        if (item.website_url) {
          const cleanLocUrl = item.website_url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
          if (cleanLocUrl === cleanGscUrl || cleanLocUrl.includes(cleanGscUrl) || cleanGscUrl.includes(cleanLocUrl)) {
            item.gsc_url = site.siteUrl;
            found = true;
            break;
          }
        }
      }
      if (!found) {
        unified.push({
          name: site.siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, ''),
          gsc_url: site.siteUrl,
          website_url: site.siteUrl.startsWith('http') ? site.siteUrl : null
        });
      }
    }

    console.log(`📊 Encontrados ${unified.length} clientes potenciais. Inserindo no banco...`);

    for (const client of unified) {
      const { error } = await supabase.from('clients').upsert({
        name: client.name,
        gsc_url: client.gsc_url,
        gbp_account_id: client.gbp_account_id,
        gbp_location_id: client.gbp_location_id,
        website_url: client.website_url
      }, { onConflict: 'name' });
      
      if (error) console.error(`❌ Erro ao inserir ${client.name}:`, error.message);
      else console.log(`✅ Cliente inserido/atualizado: ${client.name}`);
    }

    console.log('✨ Seeding concluído!');
  } catch (e) {
    console.error('💥 Falha crítica no seeding:', e);
  }
}

seed();
