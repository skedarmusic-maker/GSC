import { NextResponse } from 'next/server';
import { listLocations } from '@/lib/business';
import { createClient } from '@supabase/supabase-js';

// Rota que sincroniza os IDs do GBP no banco com os dados reais da API Google
export async function POST() {
  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Buscar locais reais da API Google
    const locations = await listLocations();
    if (!locations.length) {
      return NextResponse.json({ error: 'Nenhum local encontrado na API Google' }, { status: 404 });
    }

    // 2. Buscar clientes no banco
    const { data: clients, error } = await adminSupabase
      .from('clients')
      .select('id, name, website_url, gbp_location_id, gbp_account_id');

    if (error) throw error;

    const updates: any[] = [];

    // 3. Cruzar por nome ou URL do site
    for (const loc of locations) {
      const cleanLocUrl = (loc.websiteUri || '')
        .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();

      const match = clients?.find((c: any) => {
        const cleanClientUrl = (c.website_url || '')
          .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
        
        const locNameLower = loc.title?.toLowerCase() || '';
        const clientNameLower = c.name?.toLowerCase() || '';
        
        // Forçar match para Pagani
        if (locNameLower.includes('pagani') && clientNameLower.includes('pagani')) return true;
        
        const nameMatch = clientNameLower.includes(locNameLower.split(' ')[0]);
        const urlMatch = cleanClientUrl && cleanLocUrl && (cleanClientUrl === cleanLocUrl || cleanClientUrl.includes(cleanLocUrl) || cleanLocUrl.includes(cleanClientUrl));
        return urlMatch || nameMatch;
      });

      if (match) {
        console.log(`✅ Sincronizando: DB[${match.name}] com Google[${loc.title}] -> ${loc.accountId} / ${loc.name}`);
        updates.push({
          clientId: match.id,
          clientName: match.name,
          locationTitle: loc.title,
          newAccountId: loc.accountId,
          newLocationId: loc.name.replace('locations/', ''),
          oldAccountId: match.gbp_account_id,
          oldLocationId: match.gbp_location_id,
        });

        // Atualizar no banco
        await adminSupabase
          .from('clients')
          .update({
            gbp_account_id: loc.accountId,
            gbp_location_id: loc.name.replace('locations/', ''),
          })
          .eq('id', match.id);
      } else {
         console.log(`❌ Sem match no banco para: ${loc.title}`);
      }
    }

    console.log(`🔄 SYNC CONCLUÍDO: ${updates.length} clientes atualizados.`);


    return NextResponse.json({ 
      success: true, 
      updated: updates.length,
      details: updates 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
