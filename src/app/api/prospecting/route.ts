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

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Verifica se o website realmente responde (HEAD rápido, 5s timeout)
async function verifyWebsiteExists(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GBP-Checker/1.0)' },
    });
    clearTimeout(timeoutId);
    // 200-399 = site existe; 4xx/5xx = não conta
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
    // Se a verificação HEAD falhou, o site não está acessível
    if (!verified) {
      return { status: 'fraco', label: 'Website', value: 'Não encontrado' };
    }
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

  // Website real (20pts) — Instagram/linktree NÃO conta
  const web = classifyWebsite(n.website);
  if (web.status === 'bom') score += 20;
  else if (web.status === 'razoável') score += 5;
  // fraco = 0

  // Telefone (15pts)
  if (n.phone) score += 15;

  // Horário (10pts)
  if (n.hours) score += 10;

  // Fotos (5pts)
  if (n.thumbnail) score += 5;

  return Math.min(score, 100);
}

// Normaliza campos inconsistentes entre engines da SerpApi, Apify e Outscraper
function normalize(place: any) {
  // Reviews pode vir como número ou string com vírgula (ex: "1,2k")
  let reviews = 0;
  const rawReviews = place.reviewsCount || place.reviews || place.user_ratings_total || place.review_count || 0;
  if (typeof rawReviews === 'string') {
    const clean = rawReviews.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    reviews = Math.round(parseFloat(clean) || 0);
    if (rawReviews.toLowerCase().includes('k')) reviews *= 1000;
  } else {
    reviews = Number(rawReviews) || 0;
  }

  // Telefone pode vir em vários campos
  const phone = place.phone || place.phoneUnformatted || place.phone_number || place.international_phone_number ||
    place.formatted_phone_number || place.contact?.phone || '';

  // Horário
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
    let { businessName } = await req.json();
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'SERPAPI_KEY não configurada no .env' }, { status: 500 });
    }

    // ── PASSO 1: Resolver link curto do Google Maps ───────────────────────────
    let locationContext = '';
    if (businessName.includes('goo.gl') || businessName.includes('maps.app')) {
      console.log('🔗 Link curto detectado, resolvendo...');
      try {
        const redirectRes = await fetch(businessName, {
          method: 'GET',
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        const finalUrl = redirectRes.url;
        console.log('🔗 URL final:', finalUrl);

        // 1. Tenta extrair coordenadas exatas do pino (!3d e !4d) para precisão máxima
        const preciseCoordsMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        const viewportCoordsMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

        if (preciseCoordsMatch) {
          locationContext = `&ll=@${preciseCoordsMatch[1]},${preciseCoordsMatch[2]},19z`;
          console.log('🎯 Coordenadas EXATAS extraídas:', preciseCoordsMatch[1], preciseCoordsMatch[2]);
        } else if (viewportCoordsMatch) {
          locationContext = `&ll=@${viewportCoordsMatch[1]},${viewportCoordsMatch[2]},14z`;
          console.log('📍 Coordenadas de mapa extraídas:', viewportCoordsMatch[1], viewportCoordsMatch[2]);
        }

        // 2. Extrai sempre o nome do lugar para a busca
        const placeMatch = finalUrl.match(/\/maps\/place\/([^/@?]+)/);
        if (placeMatch) {
          businessName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
          console.log('✅ Nome extraído:', businessName);
        }
      } catch (e) {
        console.error('❌ Falha ao resolver link:', e);
      }
    }

    console.log('🔍 Buscando:', businessName, locationContext ? 'com foco geográfico' : '');

    // ── PASSO 2: Obter dados (SerpApi com Coordenadas -> Outscraper -> Apify -> SerpApi Geral) ──
    let rawPlace: any = null;
    let rawResults: any[] = [];
    const outscraperKey = process.env.OUTSCRAPER_API_KEY;
    const apifyToken = process.env.APIFY_TOKEN;

    // Se o usuário colou um link do Maps com coordenadas, a SerpApi com 'll' garante precisão cirúrgica no pino correto
    if (locationContext && apiKey) {
      console.log('🎯 Link de Maps com coordenadas detectado! Executando busca de precisão cirúrgica no pino...');
      try {
        const mapsUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(businessName)}${locationContext}&api_key=${apiKey}&hl=pt&gl=br&type=search`;
        const mapsRes = await fetch(mapsUrl);
        const mapsData = await mapsRes.json();
        if (mapsData.local_results?.length > 0) {
          rawPlace = mapsData.local_results[0];
          rawResults = mapsData.local_results;
          console.log('✅ Local exato do pino obtido via SerpApi:', rawPlace.title, '(', rawPlace.address, ')');
        }
      } catch (err) {
        console.error('❌ Falha na busca por coordenadas via SerpApi:', err);
      }
    }

    if (!rawPlace && outscraperKey) {
      console.log('🚀 Usando Outscraper para busca profunda...');
      try {
        const url = `https://api.app.outscraper.com/maps/search-places?query=${encodeURIComponent(businessName)}&limit=6&language=pt&region=br`;
        const outscraperRes = await fetch(url, {
          headers: { 'X-API-KEY': outscraperKey }
        });
        
        if (outscraperRes.ok) {
          const result = await outscraperRes.json();
          const items = result.data?.[0] || [];
          if (items.length > 0) {
            rawPlace = items[0];
            rawResults = items;
            console.log('✅ Dados obtidos via Outscraper!');
          }
        } else {
          console.error('❌ Resposta inválida do Outscraper:', outscraperRes.status);
        }
      } catch (err) {
        console.error('❌ Falha ao buscar no Outscraper, tentando Apify/SerpApi...', err);
      }
    }

    if (!rawPlace && apifyToken) {
      console.log('🚀 Usando Apify para busca profunda...');
      try {
        const apifyUrl = `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apifyToken}`;
        const apifyRes = await fetch(apifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchStringsArray: [businessName],
            maxCrawledPlacesPerSearch: 6,
            language: 'pt-BR'
          })
        });
        
        if (apifyRes.ok) {
          const items = await apifyRes.json();
          if (items.length > 0) {
            rawPlace = items[0];
            rawResults = items;
            console.log('✅ Dados obtidos via Apify!');
          }
        } else {
          console.error('❌ Resposta inválida do Apify:', apifyRes.status);
        }
      } catch (err) {
        console.error('❌ Falha ao buscar no Apify, usando fallback da SerpApi...', err);
      }
    }

    if (!rawPlace) {
      console.log('🔍 Executando busca de fallback via SerpApi...');
      // O parâmetro 'll' força a busca a acontecer naquela coordenada específica
      const mapsUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(businessName)}${locationContext}&api_key=${apiKey}&hl=pt&gl=br&type=search`;
      const mapsRes = await fetch(mapsUrl);
      const mapsData = await mapsRes.json();

      console.log('📦 Maps result count:', mapsData.local_results?.length ?? 0);

      if (mapsData.local_results?.length > 0) {
        rawPlace = mapsData.local_results[0];
        rawResults = mapsData.local_results;
      }

      // Fallback place_id
      if (rawPlace?.place_id) {
        console.log('🔎 Buscando detalhes via place_id:', rawPlace.place_id);
        try {
          const detailUrl = `https://serpapi.com/search.json?engine=google_maps&type=place&place_id=${rawPlace.place_id}&api_key=${apiKey}&hl=pt`;
          const detailRes = await fetch(detailUrl);
          const detailData = await detailRes.json();
          if (detailData.place_results) {
            rawPlace = { ...rawPlace, ...detailData.place_results };
            console.log('✅ Detalhes do place mesclados');
          }
        } catch (e) {
          console.log('⚠️ Falha ao buscar detalhes do place, usando dados básicos');
        }
      }

      // Fallback Google Search
      if (!rawPlace) {
        console.log('⚠️ Tentando Google Search genérico...');
        const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(businessName)}&api_key=${apiKey}&hl=pt&gl=br`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        rawPlace = searchData.knowledge_graph || searchData.local_results?.[0] || null;
        rawResults = searchData.local_results || [];
      }
    }

    if (!rawPlace) {
      return NextResponse.json({
        error: `Empresa "${businessName}" não encontrada. Tente digitar o nome completo + cidade.`,
      }, { status: 404 });
    }

    // ── Normalização ──────────────────────────────────────────────────────────
    const n = normalize(rawPlace);
    console.log('📊 Dados normalizados:', { rating: n.rating, reviews: n.reviews, phone: n.phone, website: n.website });

    // ── Verificação real do website (HEAD request) ────────────────────────────
    // A SerpAPI pode retornar URLs que não estão cadastradas no GBP real do negócio.
    // Verificamos se o site realmente responde antes de classificar como "Site Profissional".
    let websiteVerified = false;
    if (n.website) {
      console.log('🌐 Verificando se o website realmente existe:', n.website);
      websiteVerified = await verifyWebsiteExists(n.website);
      if (!websiteVerified) {
        console.log('❌ Website não respondeu — tratando como sem site');
        n.website = ''; // Zera para evitar classificação incorreta
      } else {
        console.log('✅ Website confirmado e acessível');
      }
    }

    const webInfo = classifyWebsite(n.website, websiteVerified);
    const score = calcScore(n);

    // Extração de novos dados disponíveis gratuitamente via SerpApi
    const description = rawPlace?.description || rawPlace?.snippet || rawPlace?.about || '';
    const descLength = description.length;
    
    // Amostragem de reviews para ver taxa de resposta
    const rawReviewsList = rawPlace?.reviews || rawPlace?.user_reviews?.reviews || [];
    const sampleSize = rawReviewsList.length;
    let unansweredCount = 0;
    
    if (sampleSize > 0) {
      rawReviewsList.forEach((r: any) => {
         if (!r.response && !r.owner_answer) unansweredCount++;
      });
    }

    const metrics = [
      {
        label: 'Nota Média',
        status: n.rating >= 4.0 ? 'bom' : n.rating >= 3.0 ? 'razoável' : 'fraco',
        value: n.rating > 0
          ? `${n.rating} ⭐ — ${n.reviews} avaliações`
          : 'Sem avaliações cadastradas',
        icon: 'star',
      },
      {
        label: 'Avaliações - Quantidade',
        status: n.reviews >= 50 ? 'bom' : n.reviews >= 10 ? 'razoável' : 'fraco',
        value: n.reviews > 0 ? `${n.reviews} avaliações no total` : 'Nenhuma avaliação recebida',
        icon: 'star',
      },
      {
        label: 'Avaliações - Amostragem de Respostas',
        status: sampleSize === 0 ? 'razoável' : (unansweredCount === 0 ? 'bom' : unansweredCount < sampleSize ? 'razoável' : 'fraco'),
        value: sampleSize > 0 ? `Das ${sampleSize} mais recentes, ${unansweredCount} estão sem resposta` : 'Nenhuma avaliação recente para amostra',
        icon: 'star',
      },
      {
        label: 'Descrição da Empresa',
        status: descLength >= 50 ? 'bom' : descLength > 0 ? 'razoável' : 'fraco',
        value: descLength > 0 ? `Possui descrição (${descLength} caracteres)` : 'Nenhuma descrição encontrada',
        icon: 'tag',
      },
      {
        label: webInfo.label,
        status: webInfo.status,
        value: webInfo.value,
        icon: 'globe',
        detail: n.website || '',
      },
      {
        label: 'Telefone',
        status: n.phone ? 'bom' : 'fraco',
        value: n.phone || 'Não encontrado no perfil',
        icon: 'phone',
      },
      {
        label: 'Horário de Funcionamento',
        status: n.hours ? 'bom' : 'fraco',
        value: n.hours ? 'Configurado ✓' : 'Não configurado',
        icon: 'clock',
      },
      {
        label: 'Fotos / Mídia',
        status: n.thumbnail ? 'razoável' : 'fraco',
        value: n.thumbnail ? 'Possui fotos no perfil' : 'Sem fotos encontradas',
        icon: 'camera',
      },
      {
        label: 'Categoria / Segmento',
        status: n.type ? 'bom' : 'fraco',
        value: n.type || 'Não definida',
        icon: 'tag',
      },
    ];

    // Se for Apify ou Outscraper e possuir dados ricos, adiciona métricas premium automaticamente
    const isPremiumData = (rawPlace.imagesCount !== undefined) || (rawPlace.photos_count !== undefined) || (rawPlace.photos && Array.isArray(rawPlace.photos));
    if (isPremiumData) {
      const photosCount = rawPlace.imagesCount ?? rawPlace.photos_count ?? (Array.isArray(rawPlace.photos) ? rawPlace.photos.length : 0);
      metrics.push({
        label: 'Quantidade Total de Mídia',
        status: photosCount >= 30 ? 'bom' : photosCount >= 10 ? 'razoável' : 'fraco',
        value: `${photosCount} fotos no perfil`,
        icon: 'camera',
      });

      let isVerified = false;
      if (rawPlace.verified !== undefined) {
        isVerified = rawPlace.verified;
      } else if (rawPlace.is_claimed !== undefined) {
        isVerified = rawPlace.is_claimed;
      } else if (rawPlace.claimThisBusiness !== undefined) {
        isVerified = !rawPlace.claimThisBusiness;
      }

      metrics.push({
        label: 'Ficha Verificada',
        status: isVerified ? 'bom' : 'fraco',
        value: isVerified ? 'Verificada pelo Google ✓' : 'Ficha não reivindicada / Não verificada ⚠️',
        icon: 'check',
      });

      // Extrai e checa Q&A (Perguntas e Respostas)
      const qaList = rawPlace.questionsAndAnswers || rawPlace.questions || [];
      const qaCount = qaList.length;
      let unansweredQA = 0;
      if (qaCount > 0) {
        qaList.forEach((q: any) => {
          const hasAnswer = q.answer || (q.answers && q.answers.length > 0) || q.owner_answer;
          if (!hasAnswer) unansweredQA++;
        });
      }
      metrics.push({
        label: 'Perguntas e Respostas (Q&A)',
        status: qaCount === 0 ? 'razoável' : (unansweredQA === 0 ? 'bom' : 'fraco'),
        value: qaCount > 0 ? `${qaCount} perguntas (${unansweredQA} sem resposta)` : 'Nenhuma pergunta registrada no perfil',
        icon: 'message-square',
      });
    }

    // Gera oportunidades dinamicamente
    const opportunities: string[] = [];
    if (!n.phone) opportunities.push('Adicionar telefone ao perfil');
    if (webInfo.status === 'fraco' && !n.website) opportunities.push('Criar site profissional próprio');
    if (webInfo.status === 'fraco' && n.website) opportunities.push(`Substituir ${new URL(n.website).hostname.replace('www.','')} por site profissional`);
    if (n.reviews < 30) opportunities.push('Campanha de captação de avaliações Google');
    if (n.rating < 4.0 && n.rating > 0) opportunities.push('Gestão de reputação e resposta às avaliações');
    if (!n.hours) opportunities.push('Configurar horário de funcionamento');
    if (!n.thumbnail) opportunities.push('Adicionar fotos profissionais ao perfil');
    if (score < 60) opportunities.push('Otimização completa do perfil GBP');

    const targetLat = rawPlace.location?.lat || rawPlace.latitude || rawPlace.gps_coordinates?.latitude || null;
    const targetLng = rawPlace.location?.lng || rawPlace.longitude || rawPlace.gps_coordinates?.longitude || null;
    const MAX_DISTANCE_KM = 50; // Só exibe concorrentes até 50km de distância

    const mapCompetitor = (c: any) => {
      const cLat = c.location?.lat || c.latitude || c.gps_coordinates?.latitude || null;
      const cLng = c.location?.lng || c.longitude || c.gps_coordinates?.longitude || null;
      let distKmRaw: number | null = null;
      let distanceKm = 'N/A';
      if (targetLat && targetLng && cLat && cLng) {
        distKmRaw = getDistanceKm(targetLat, targetLng, cLat, cLng);
        distanceKm = distKmRaw.toFixed(1) + ' km';
      }
      const placeId = c.place_id || c.placeId || '';
      const link = c.link || c.url || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.title || c.name || '')}`);
      return {
        name: c.title || c.name || '',
        rating: Number(c.totalScore || c.rating) || 0,
        reviews: Number(c.reviewsCount || c.reviews) || 0,
        place_id: placeId,
        link: link,
        distanceKm: distanceKm,
        _distKmRaw: distKmRaw // campo interno para filtro — não vai para o cliente
      };
    };

    const isLocal = (comp: any) => {
      // Se não há coordenadas (ex: Apify sem gps), mantém pois não dá pra saber
      if (comp._distKmRaw === null) return true;
      return comp._distKmRaw <= MAX_DISTANCE_KM;
    };

    const stripInternal = (comp: any) => {
      const { _distKmRaw, ...clean } = comp;
      return clean;
    };

    let competitors = rawResults
      .slice(1, 11) // pega mais resultados para compensar o filtro de distância
      .map(mapCompetitor)
      .filter(isLocal)
      .slice(0, 5)
      .map(stripInternal);

    console.log(`📍 ${competitors.length} concorrentes locais (≤${MAX_DISTANCE_KM}km) encontrados nos rawResults`);

    // Se ainda não tiver concorrentes locais, faz busca centrada nas coordenadas GPS do local
    if (competitors.length === 0 && n.type) {
      console.log('🔎 Buscando concorrentes locais complementares centrados no GPS do local...');
      try {
        let locationQuery = '';
        if (n.address) {
          const parts = n.address.split('-');
          if (parts.length > 1) {
            locationQuery = parts[1].split(',')[0].trim();
          } else {
            locationQuery = n.address.split(',')[1]?.trim() || '';
          }
        }

        const searchQuery = `${n.type} em ${locationQuery || 'Santos SP'}`;
        // Se temos coordenadas, centramos a busca no GPS do local (15z ≈ raio de ~5km)
        const llParam = targetLat && targetLng ? `&ll=@${targetLat},${targetLng},15z` : '';
        console.log(`🚀 Busca complementar: "${searchQuery}" ${llParam ? 'centrada no GPS do local' : ''}`);

        const compUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(searchQuery)}${llParam}&api_key=${apiKey}&hl=pt&gl=br&type=search`;
        const compRes = await fetch(compUrl);
        const compData = await compRes.json();

        if (compData.local_results?.length > 0) {
          competitors = compData.local_results
            .filter((c: any) => (c.title || c.name || '').toLowerCase() !== n.title.toLowerCase())
            .slice(0, 10)
            .map(mapCompetitor)
            .filter(isLocal)
            .slice(0, 5)
            .map(stripInternal);
          console.log(`✅ ${competitors.length} concorrentes complementares locais encontrados!`);
        }
      } catch (err) {
        console.error('❌ Falha ao buscar concorrentes complementares:', err);
      }
    }

    let aiRecommendation = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log(`🤖 Chamando Gemini para gerar abordagens do lead individual: "${n.title}"`);
        const prompt = `Você é um especialista em prospecção comercial e SEO de negócios locais no Brasil.
Analise a ficha do Google da empresa "${n.title}" que obteve uma nota de otimização GBP de ${score}/100.
Informações da Ficha:
- Nota Google: ${n.rating} ⭐ (${n.reviews} avaliações)
- Website: ${n.website ? (webInfo.status === 'bom' ? 'Site próprio' : 'Rede social/Linktree') : 'Não possui site'}
- Telefone: ${n.phone || 'Sem telefone cadastrado'}
- Fotos: ${n.thumbnail ? 'Possui fotos' : 'Sem fotos'}
- Oportunidades críticas identificadas: ${opportunities.join(', ')}

Com base nesses dados técnicos, crie dois scripts de abordagem comercial direcionados e persuasivos para este cliente:
1. "quick": Uma abordagem de prospecção rápida (máx. 250 caracteres), em tom simpático e profissional, chamando pelo nome da empresa e focando em abrir diálogo (ex: perguntar se eles estão recebendo clientes pelo Google, sem fazer venda direta agressiva).
2. "impact": Uma abordagem persuasiva de impacto (máx. 400 caracteres), chamando pelo nome da empresa. Destaque que realizou um diagnóstico técnico gratuito e identificou falhas que fazem eles perderem clientes diariamente (cite uma ou duas falhas reais listadas acima), diga que está enviando em anexo uma imagem do Relatório de Saúde Visual da ficha, e convide para uma breve conversa no WhatsApp.

Sua resposta DEVE ser estritamente um objeto JSON válido, sem markdown (\`\`\`json / \`\`\`), no seguinte formato:
{
  "quick": "texto da abordagem rápida",
  "impact": "texto da abordagem de impacto"
}
Importante: Substitua qualquer menção ao nome da empresa no texto por "${n.title.toUpperCase()}" (em caixa alta). Use emojis de forma moderada e profissional.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { 
                temperature: 0.3, 
                maxOutputTokens: 1000,
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          rawText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/```\s*$/m, '').trim();
          aiRecommendation = JSON.parse(rawText);
          console.log('✅ Abordagens comerciais individuais geradas com o Gemini!');
        }
      } catch (geminiErr) {
        console.error('❌ Erro ao gerar abordagens no Gemini:', geminiErr);
      }
    }

    // ── PASSO 3: Logar requisição no credit_usage_log se autenticado ───────────
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
            tokens_consumed: 1,
            action_description: `Diagnóstico individual do Maps: "${n.title}"`
          }]);
        }
      }
    } catch (logErr) {
      console.error('⚠️ Falha ao registrar log de requisição:', logErr);
    }

    return NextResponse.json({
      name: n.title,
      score,
      address: n.address,
      rating: n.rating,
      reviews: n.reviews,
      website: n.website,
      websiteStatus: webInfo.status,
      phone: n.phone,
      thumbnail: n.thumbnail,
      hours: n.hours,
      category: n.type,
      metrics,
      competitors,
      opportunities,
      aiRecommendation,
      // Dados geográficos extras e links da própria empresa analisada
      latitude: targetLat,
      longitude: targetLng,
      place_id: rawPlace.place_id || rawPlace.placeId || '',
      link: rawPlace.link || rawPlace.url || (rawPlace.place_id ? `https://www.google.com/maps/place/?q=place_id:${rawPlace.place_id}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n.title + ' ' + (n.address || ''))}`),
    });

  } catch (error: any) {
    console.error('❌ Erro na prospecção:', error);
    return NextResponse.json({ error: 'Erro interno no servidor: ' + error.message }, { status: 500 });
  }
}
