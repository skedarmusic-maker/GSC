import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ── Domínios que indicam "pseudo-site" (não é um site real) ─────────────────
const PSEUDO_SITE_DOMAINS = [
  'instagram.com', 'facebook.com', 'fb.com', 'wa.me', 'whatsapp.com',
  'linktr.ee', 'linktree.com', 'bio.link', 'beacons.ai', 'campsite.bio',
  'taplink.cc', 'lnk.bio', 'twitter.com', 'x.com', 'tiktok.com',
  'youtube.com', 'pinterest.com', 'snapchat.com', 'telegra.ph',
  // Agregadores / construtores gratuitos que não contam como site profissional
  'sites.google.com', 'wixsite.com', 'weebly.com', 'jimdo.com',
  'blogspot.com', 'wordpress.com', 'tumblr.com', 'notion.site',
  'carrd.co', 'strikingly.com', 'yola.com', 'webnode.com',
];

// Verifica se o website realmente responde (HEAD rápido, 4s timeout)
async function verifyWebsiteExists(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GBP-Checker/1.0)' },
    });
    clearTimeout(timeoutId);
    return res.status < 400;
  } catch {
    return false;
  }
}

function classifyWebsite(url: string, verified = true): { status: 'bom' | 'razoável' | 'fraco'; label: string; value: string } {
  if (!url) return { status: 'fraco', label: 'Website', value: 'Não encontrado' };
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const isPseudo = PSEUDO_SITE_DOMAINS.some(d => hostname.includes(d));
    if (isPseudo) {
      const network = hostname.split('.')[0];
      return {
        status: 'fraco',
        label: 'Website',
        value: `Rede social como site (${network}) ⚠️`,
      };
    }
    if (!verified) return { status: 'fraco', label: 'Website', value: 'Não encontrado' };
    return { status: 'bom', label: 'Website', value: 'Site próprio ✓' };
  } catch {
    return { status: 'razoável', label: 'Website', value: url };
  }
}

function calcScore(n: ReturnType<typeof normalize>): number {
  let score = 0;

  // Avaliações (25pts)
  if (n.rating >= 4.5) score += 15;
  else if (n.rating >= 4.0) score += 10;
  else if (n.rating >= 3.0) score += 5;

  // Quantidade de reviews (25pts)
  if (n.reviews >= 100) score += 25;
  else if (n.reviews >= 50) score += 18;
  else if (n.reviews >= 20) score += 12;
  else if (n.reviews >= 5) score += 6;

  // Website real (20pts)
  const web = classifyWebsite(n.website);
  if (web.status === 'bom') score += 20;
  else if (web.status === 'razoável') score += 5;

  // Telefone (15pts)
  if (n.phone) score += 15;

  // Horário (10pts)
  if (n.hours) score += 10;

  // Fotos (5pts)
  if (n.thumbnail) score += 5;

  return Math.min(score, 100);
}

function normalize(place: any) {
  let reviews = 0;
  const rawReviews = place.reviewsCount || place.reviews || place.user_ratings_total || place.review_count || 0;
  if (typeof rawReviews === 'string') {
    const clean = rawReviews.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    reviews = Math.round(parseFloat(clean) || 0);
    if (rawReviews.toLowerCase().includes('k')) reviews *= 1000;
  } else {
    reviews = Number(rawReviews) || 0;
  }

  const phone = place.phone || place.phoneUnformatted || place.phone_number || place.international_phone_number ||
    place.formatted_phone_number || place.contact?.phone || '';

  const hours = place.hours || place.openingHours || place.operating_hours || place.opening_hours || place.working_hours || null;

  // Imagem/Thumbnail flexível (suporta Apify, SerpApi, Outscraper)
  let thumbnail = place.imageUrl || place.thumbnail || place.photo || place.logo || place.image || '';
  if (!thumbnail && place.photos && Array.isArray(place.photos) && place.photos.length > 0) {
    const firstPhoto = place.photos[0];
    thumbnail = typeof firstPhoto === 'string' ? firstPhoto : (firstPhoto?.url || '');
  } else if (!thumbnail && place.photos && typeof place.photos === 'object') {
    thumbnail = place.photos?.[0]?.url || '';
  }

  return {
    title: place.title || place.name || '',
    address: place.address || place.full_address || place.formatted_address || place.locationName || '',
    rating: Number(place.totalScore || place.rating) || 0,
    reviews,
    website: (() => {
      const rawWeb = place.website || place.site || place.links?.website || '';
      if (!rawWeb || typeof rawWeb !== 'string') return '';
      const low = rawWeb.toLowerCase();
      if (low.includes('google.com') || low.includes('google.com.br') || low.includes('maps.google') || low.includes('maps.apple.com')) {
        return '';
      }
      return rawWeb;
    })(),
    phone,
    type: place.categoryName || place.type || place.category || place.types?.[0] || '',
    thumbnail,
    hours,
  };
}

export async function POST(req: Request) {
  try {
    const { 
      niche, 
      location, 
      minRating = 0, 
      maxRating = 5, 
      limit = 10, 
      filterNoWebsite = false, 
      filterNoPhone = false 
    } = await req.json();

    const apiKey = process.env.SERPAPI_KEY;
    const apifyToken = process.env.APIFY_TOKEN;

    if (!niche || !location) {
      return NextResponse.json({ error: 'Nicho e localização são campos obrigatórios.' }, { status: 400 });
    }

    if (!apiKey && !apifyToken) {
      return NextResponse.json({ error: 'Nenhuma chave de API configurada (SerpApi ou Apify).' }, { status: 500 });
    }

    let rawResults: any[] = [];
    const queryStr = `${niche} em ${location}`;
    console.log(`🔍 Iniciando busca em lote para: "${queryStr}"`);

    const outscraperKey = process.env.OUTSCRAPER_API_KEY;

    // ── 1. BUSCA PRIMÁRIA VIA OUTSCRAPER ──────────────────────────────────────────
    if (outscraperKey) {
      try {
        console.log('🚀 Buscando locais via Outscraper...');
        const url = `https://api.app.outscraper.com/maps/search-places?query=${encodeURIComponent(queryStr)}&limit=${limit * 2}&language=pt&region=br`;
        const res = await fetch(url, {
          headers: { 'X-API-KEY': outscraperKey }
        });
        if (res.ok) {
          const result = await res.json();
          rawResults = result.data?.[0] || [];
          console.log(`✅ Outscraper retornou ${rawResults.length} locais.`);
        }
      } catch (err) {
        console.error('❌ Falha na busca do Outscraper:', err);
      }
    }

    // ── 2. FALLBACK VIA SERPAPI ──────────────────────────────────────────────────
    if (rawResults.length === 0 && apiKey) {
      try {
        console.log('🚀 Iniciando busca de fallback via SerpApi...');
        const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(queryStr)}&api_key=${apiKey}&hl=pt&gl=br&type=search`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          rawResults = data.local_results || [];
          console.log(`✅ SerpApi retornou ${rawResults.length} locais.`);
        }
      } catch (err) {
        console.error('❌ Falha na busca da SerpApi:', err);
      }
    }

    if (rawResults.length === 0 && apifyToken) {
      try {
        console.log('🚀 Iniciando busca de fallback via Apify...');
        const apifyUrl = `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apifyToken}`;
        const res = await fetch(apifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchStringsArray: [queryStr],
            maxCrawledPlacesPerSearch: limit * 2, // Pegar um pouco mais para filtragem
            language: 'pt-BR'
          })
        });
        if (res.ok) {
          rawResults = await res.json();
          console.log(`✅ Apify retornou ${rawResults.length} locais.`);
        }
      } catch (err) {
        console.error('❌ Falha na busca de fallback do Apify:', err);
      }
    }

    if (rawResults.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum lead encontrado para este nicho e localização. Tente termos diferentes.' 
      }, { status: 404 });
    }

    // ── 3. PROCESSAR E FILTRAR OS LEADS (com verificação de website) ─────────────
    // Verificamos todos os websites em paralelo (Promise.all) para não bloquear muito
    const normalized = rawResults.map((place) => normalize(place));

    // Coleta URLs únicas para verificar em paralelo (evita verificar mesma URL 2x)
    const uniqueWebsites = Array.from(new Set(normalized.map(n => n.website).filter(Boolean)));
    const websiteStatusMap: Record<string, boolean> = {};
    if (uniqueWebsites.length > 0) {
      console.log(`🌐 Verificando ${uniqueWebsites.length} websites em paralelo...`);
      const results = await Promise.allSettled(
        uniqueWebsites.map(url => verifyWebsiteExists(url).then(ok => ({ url, ok })))
      );
      results.forEach(r => {
        if (r.status === 'fulfilled') websiteStatusMap[r.value.url] = r.value.ok;
      });
    }

    let processedLeads = normalized.map((n, idx) => {
      // Zera website se não confirmado via HEAD
      if (n.website && websiteStatusMap[n.website] === false) {
        console.log(`❌ Website não acessível para ${n.title}: ${n.website}`);
        n.website = '';
      }
      const webInfo = classifyWebsite(n.website, n.website ? (websiteStatusMap[n.website] ?? true) : false);
      const score = calcScore(n);

      const hasDescription = (() => {
        const raw = rawResults[idx];
        const desc = raw?.description || raw?.snippet || raw?.about || '';
        return desc.length > 50;
      })();

      // Montar oportunidades rápidas
      const opportunities: string[] = [];
      if (!n.phone) opportunities.push('Sem telefone no perfil');
      if (webInfo.status === 'fraco' && !n.website) opportunities.push('Sem website próprio');
      if (webInfo.status === 'fraco' && n.website) opportunities.push('Usa rede social como website');
      if (n.reviews < 30) opportunities.push('Poucas avaliações locais');
      if (n.rating < 4.2 && n.rating > 0) opportunities.push('Reputação/Nota média abaixo da média');
      if (!n.hours) opportunities.push('Horário de funcionamento ausente');
      if (!n.thumbnail) opportunities.push('Falta fotos profissionais');
      if (score < 60) opportunities.push('Ficha com otimização crítica');

      return {
        id: `prospect-${idx}-${Date.now()}`,
        name: n.title,
        address: n.address,
        rating: n.rating,
        reviews: n.reviews,
        website: n.website,
        websiteStatus: webInfo.status,
        phone: n.phone,
        thumbnail: n.thumbnail,
        hours: n.hours,
        category: n.type || niche,
        score,
        opportunities,
        hasDescription,
      };
    });

    // ── 4. FILTRAGEM LOCAL DE ACORDO COM PARÂMETROS DO USUÁRIO ──────────────────
    let filteredLeads = processedLeads.filter(lead => {
      // Filtrar por estrelas
      if (lead.rating < minRating || lead.rating > maxRating) return false;
      
      // Filtrar por website ausente / fraco
      if (filterNoWebsite && lead.websiteStatus === 'bom') return false;
      
      // Filtrar por telefone ausente
      if (filterNoPhone && !lead.phone) return false;

      return true;
    });

    // Cortar pelo limite
    filteredLeads = filteredLeads.slice(0, limit);

    if (filteredLeads.length === 0) {
      return NextResponse.json({ 
        error: 'Todos os leads encontrados foram descartados pelos filtros aplicados. Tente afrouxar os filtros.' 
      }, { status: 404 });
    }

    // ── 5. ELEIÇÃO LOCAL DE TOP LEADS COM TOTAL ECONOMIA DE API GEMINI ───
    const sortedForTop = [...filteredLeads].sort((a, b) => {
      const optCountA = a.opportunities.length;
      const optCountB = b.opportunities.length;
      if (optCountA !== optCountB) return optCountB - optCountA;
      return b.reviews - a.reviews;
    });

    const topLeads = sortedForTop.slice(0, 3).map((lead, idx) => {
      let why = 'Negócio ativo com falhas de otimização local (ex: sem site profissional próprio).';
      if (lead.websiteStatus === 'fraco' && !lead.website) {
        why = 'Não possui site próprio cadastrado e tem Score GBP vulnerável, ótima abertura para venda de site.';
      } else if (lead.websiteStatus === 'razoável' || lead.websiteStatus === 'fraco') {
        why = 'Usa links informais ou rede social como site. Excelente oportunidade para oferecer site institucional.';
      } else if (lead.rating < 4.2 && lead.rating > 0) {
        why = 'Avaliações médias baixas. Boa oportunidade para venda de gestão de marca local e SEO GBP.';
      } else if (!lead.phone) {
        why = 'Sem telefone de contato visível, o que reduz cliques e a conversão de clientes imediatos.';
      }

      const strategy = `Abordar apresentando o diagnóstico gratuito da ficha Google e indicando melhorias imediatas.`;

      return {
        name: lead.name,
        why,
        strategy
      };
    });

    const aiRecommendations = {
      topLeads,
      whatsappMessages: {} // Será gerado dinamicamente sob demanda ao auditar individualmente!
    };

    // ── PASSO 6: Logar requisição no credit_usage_log se autenticado ───────────
    try {
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      if (token) {
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
        const { data: { user } } = await userSupabase.auth.getUser();
        if (user) {
          const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          );
          await adminSupabase.from('credit_usage_log').insert([{
            user_id: user.id,
            tokens_consumed: limit,
            action_description: `Radar de prospecção em lote: "${niche}" em "${location}" (limite: ${limit})`
          }]);
        }
      }
    } catch (logErr) {
      console.error('⚠️ Falha ao registrar log de requisição em lote:', logErr);
    }

    return NextResponse.json({
      success: true,
      leads: filteredLeads,
      aiRecommendations,
      debug: {
        totalFound: rawResults.length,
        totalFiltered: filteredLeads.length
      }
    });

  } catch (error: any) {
    console.error('❌ Erro crítico no batch de prospecção:', error);
    return NextResponse.json({ error: 'Erro interno: ' + error.message }, { status: 500 });
  }
}
