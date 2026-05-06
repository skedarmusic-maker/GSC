import { NextResponse } from 'next/server';
import { listSites } from '@/lib/gsc';
import { listLocations } from '@/lib/business';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    // Buscar GSC e GBP paralelamente. Tolera falhas individuais.
    const [gscSites, gbpLocations] = await Promise.all([
      listSites().catch(() => []), 
      listLocations().catch((e) => {
        console.error("ERRO NO LIST LOCATIONS:", e);
        return [];
      })
    ]);

    const unifiedList: any[] = [];

    // 1. Adicionar todos os locais do GBP primeiro (como base de clientes local)
    for (const loc of gbpLocations) {
      unifiedList.push({
        id: loc.name,
        name: loc.title,
        type: 'GBP_ONLY',
        gbpData: loc,
        gscUrl: null 
      });
    }

    // 2. Mesclar com os sites do GSC
    for (const site of gscSites) {
      if (!site.siteUrl) continue;
      const cleanGscUrl = site.siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
      
      let foundMatch = false;
      for (const item of unifiedList) {
        const websiteUri = item.gbpData?.websiteUri;
        if (websiteUri) {
          const cleanLocUrl = websiteUri.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
          if (cleanLocUrl === cleanGscUrl || cleanLocUrl.includes(cleanGscUrl) || cleanGscUrl.includes(cleanLocUrl)) {
            item.gscUrl = site.siteUrl;
            item.type = 'HYBRID';
            foundMatch = true;
            break;
          }
        }
      }

      // Se não achou vínculo no Maps, adiciona como site "Somente GSC"
      if (!foundMatch) {
        unifiedList.push({
          id: site.siteUrl,
          name: site.siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, ''),
          type: 'GSC_ONLY',
          gbpData: null,
          gscUrl: site.siteUrl
        });
      }
    }

    return NextResponse.json(unifiedList);
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao buscar clientes' }, { status: 500 });
  }
}
