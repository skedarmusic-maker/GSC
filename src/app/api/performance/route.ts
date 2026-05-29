import { NextResponse } from 'next/server';
import { getDetailedInsights } from '@/lib/gsc';
import { listLocations, getLocationPerformance } from '@/lib/business';

import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteUrl, days } = await request.json();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado. Token de sessão ausente.' }, { status: 401 });
    }

    // Validar sessão do usuário logado no Supabase
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }
    
    // 1. Dados do SEO (GSC)
    const seoData = await getDetailedInsights(siteUrl, days);
    
    // 2. Dados Reais do Maps (Business Profile)
    let mapsData = null;
    try {
      const locations = await listLocations(token);
      
      // Limpa a URL do site para comparação profunda
      const cleanUrl = siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
      
      const myLocation = locations.find((l: any) => {
        if (!l.websiteUri) return false;
        const cleanLocUrl = l.websiteUri.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
        
        // Match exato do domínio raiz (ex: paganicustomfloripa.com.br == paganicustomfloripa.com.br)
        return cleanLocUrl === cleanUrl || cleanLocUrl.includes(cleanUrl) || cleanUrl.includes(cleanLocUrl);
      });
      
      if (myLocation) {
        const perf = await getLocationPerformance(myLocation.name, days, undefined, undefined, token);
        mapsData = {
          title: myLocation.title,
          accountId: myLocation.accountId,
          locationId: myLocation.name.replace('locations/', ''),
          metrics: perf || { calls: 0, directions: 0, websiteClicks: 0 }
        };
      }
    } catch (e) {
      console.error('Erro ao cruzar Maps:', e);
    }

    return NextResponse.json({ ...seoData, maps: mapsData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
