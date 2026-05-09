import { NextResponse } from 'next/server';
import { listSites } from '@/lib/gsc';
import { listLocations } from '@/lib/business';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Tentar buscar do banco de dados (Supabase)
    let { data: dbClients, error: dbError } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (dbError) throw dbError;
    
    console.log(`📡 API SITES: ${dbClients?.length || 0} clientes encontrados no banco.`);

    // 2. Se o banco estiver vazio, fazemos o seeding automático (Primeiro Acesso)
    if (!dbClients || dbClients.length === 0) {
      console.log('🔄 Banco de dados vazio. Iniciando sincronização inicial...');
      
      const [gscSites, gbpLocations] = await Promise.all([
        listSites().catch(() => []), 
        listLocations().catch(() => [])
      ]);

      const unified: any[] = [];

      // Mapear GBP
      for (const loc of gbpLocations) {
        unified.push({
          name: loc.title,
          gbp_account_id: loc.accountId,
          gbp_location_id: loc.name.replace('locations/', ''),
          website_url: loc.websiteUri,
          gsc_url: null 
        });
      }

      // Mapear GSC e vincular
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

      // Inserir no Supabase
      if (unified.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('clients')
          .insert(unified)
          .select();
        
        if (insertError) throw insertError;
        dbClients = inserted;
      }
    }

    // 3. Formatar para o frontend (Manter compatibilidade com a estrutura anterior)
    const formattedList = dbClients?.map(client => ({
      id: client.id, 
      name: client.name,
      type: client.gsc_url && client.gbp_location_id ? 'HYBRID' : client.gbp_location_id ? 'GBP_ONLY' : 'GSC_ONLY',
      gscUrl: client.gsc_url,
      gbpData: client.gbp_location_id ? {
        id: `locations/${client.gbp_location_id}`,
        name: client.name,
        accountId: client.gbp_account_id,
        websiteUri: client.website_url
      } : null
    }));

    return NextResponse.json(formattedList || []);
  } catch (error: any) {
    console.error('ERRO API SITES:', error);
    return NextResponse.json({ error: error.message || 'Falha ao buscar clientes' }, { status: 500 });
  }
}
