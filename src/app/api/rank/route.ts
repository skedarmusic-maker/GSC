import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getLocationDetails } from '@/lib/business';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('locationId');
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!locationId) return NextResponse.json({ error: 'Location ID missing' }, { status: 400 });

  if (!token) {
    return NextResponse.json({ error: 'Não autorizado. Token de sessão ausente.' }, { status: 401 });
  }

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

  // Verificar posse: o locationId deve pertencer a um cliente deste usuário
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data: roleData } = await adminSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isSuperAdmin = roleData?.role === 'super_admin';

  if (!isSuperAdmin) {
    const { data: ownerCheck } = await adminSupabase
      .from('clients')
      .select('id')
      .eq('gbp_location_id', locationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!ownerCheck) {
      return NextResponse.json({ error: 'Acesso negado. Este local não pertence à sua conta.' }, { status: 403 });
    }
  }

  // Buscar palavras-chave e seus históricos
  const { data: keywords, error } = await adminSupabase
    .from('tracked_keywords')
    .select('*, rank_history(*)')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(keywords);
}

export async function POST(req: Request) {
  try {
    const { locationId, businessName, keyword, accountId, zoom } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    let dbSupabase = supabase;

    if (token) {
      dbSupabase = createClient(
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
      
      const { data: userResponse, error: authError } = await dbSupabase.auth.getUser();
      if (authError || !userResponse?.user) {
        return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
      }

      const userId = userResponse.user.id;

      // === SISTEMA DE CRÉDITOS SAAS ===
      // 1. Buscar saldo de créditos do usuário logado
      const { data: credits, error: creditError } = await dbSupabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (creditError) throw creditError;

      const totalCredits = (credits?.monthly_allowance || 0) + (credits?.purchased_credits || 0);

      if (!credits || totalCredits <= 0) {
        return NextResponse.json({ 
          error: 'Cota de créditos de ranking esgotada. Adquira mais créditos na central de integrações/perfil.' 
        }, { status: 403 });
      }

      // 2. Decrementar 1 crédito (priorizando monthly_allowance e depois purchased_credits)
      let newMonthly = credits.monthly_allowance;
      let newPurchased = credits.purchased_credits;

      if (newMonthly > 0) {
        newMonthly -= 1;
      } else {
        newPurchased -= 1;
      }

      // 3. Atualizar saldo no banco
      const { error: updateError } = await dbSupabase
        .from('user_credits')
        .update({
          monthly_allowance: newMonthly,
          purchased_credits: newPurchased
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // 4. Registrar no log de consumo para auditoria do usuário
      await dbSupabase
        .from('credit_usage_log')
        .insert([
          {
            user_id: userId,
            tokens_consumed: 1,
            action_description: `Verificação de ranking local da palavra-chave: "${keyword}"`
          }
        ]);
    }

    // Salvar a palavra-chave SEM chamar SerpApi agora
    // O usuario clica em "Atualizar Posicao" para disparar a busca sob demanda
    const { data: kw, error } = await dbSupabase
      .from('tracked_keywords')
      .insert([{ location_id: locationId, business_name: businessName, keyword }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, position: null, keywordId: kw.id });

  } catch (error: any) {
    console.error('Erro no Rank Tracking:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/rank — Atualiza posicao sob demanda com cache de 24h
export async function PUT(req: Request) {
  try {
    const { keywordId, locationId, businessName, keyword, accountId, zoom } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    let dbSupabase = supabase;
    if (token) {
      dbSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: userResponse, error: authError } = await dbSupabase.auth.getUser();
      if (authError || !userResponse?.user) {
        return NextResponse.json({ error: 'Sessao invalida ou expirada.' }, { status: 401 });
      }
      const userId = userResponse.user.id;
      const { data: credits } = await dbSupabase
        .from('user_credits').select('*').eq('user_id', userId).maybeSingle();
      const totalCredits = (credits?.monthly_allowance || 0) + (credits?.purchased_credits || 0);
      if (credits && totalCredits <= 0) {
        return NextResponse.json({ error: 'Cota de creditos esgotada.' }, { status: 403 });
      }
    }

    // Cache de 24h: so chama a SerpApi se nao tiver resultado recente
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentHistory } = await dbSupabase
      .from('rank_history')
      .select('position, created_at')
      .eq('keyword_id', keywordId)
      .gte('created_at', since24h)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentHistory) {
      console.log(`Cache hit para "${keyword}" — posicao ${recentHistory.position}`);
      return NextResponse.json({ success: true, position: recentHistory.position, fromCache: true, cachedAt: recentHistory.created_at });
    }

    // Sem cache valido — chama SerpApi
    console.log(`Cache miss — buscando posicao real na SerpApi para "${keyword}"`);
    const locationName = `accounts/${accountId}/locations/${locationId}`;
    const details = await getLocationDetails(locationName, token || undefined);
    const lat = details?.latlng?.latitude;
    const lng = details?.latlng?.longitude;
    const ll = lat && lng ? `${lat},${lng}` : '';
    const city = details?.storefrontAddress?.locality || '';
    const queryWithLocation = ll ? keyword : (city ? `${keyword} em ${city}` : keyword);
    const currentZoom = zoom || '15z';
    const serpUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(queryWithLocation)}${ll ? `&ll=@${ll},${currentZoom}` : ''}&hl=pt&gl=br&api_key=${process.env.SERPAPI_KEY}`;
    const serpRes = await fetch(serpUrl);
    const serpData = await serpRes.json();

    let position = 99;
    if (serpData.local_results) {
      const results = serpData.local_results;
      let filteredResults = results;
      if (lat && lng) {
        let maxDistanceKm = 5.5;
        if (currentZoom === '16z') maxDistanceKm = 3.5;
        else if (currentZoom === '14z') maxDistanceKm = 11.0;
        const filtered = results.filter((r: any) => {
          const cLat = r.gps_coordinates?.latitude;
          const cLng = r.gps_coordinates?.longitude;
          if (!cLat || !cLng) return true;
          const dLat = (cLat - lat) * Math.PI / 180;
          const dLon = (cLng - lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(cLat * Math.PI / 180) * Math.sin(dLon/2) ** 2;
          const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return distKm <= maxDistanceKm;
        });
        const filteredHasUs = filtered.some((r: any) => r.title.toLowerCase().includes(businessName.toLowerCase()));
        if (filteredHasUs) filteredResults = filtered;
      }
      const idx = filteredResults.findIndex((r: any) =>
        r.title.toLowerCase().includes(businessName.toLowerCase()) ||
        r.place_id === details?.metadata?.placeId
      );
      if (idx !== -1) position = idx + 1;
    }

    await dbSupabase.from('rank_history').insert([{ keyword_id: keywordId, position }]);
    return NextResponse.json({ success: true, position, fromCache: false });

  } catch (error: any) {
    console.error('Erro ao atualizar posicao:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!id) return NextResponse.json({ error: 'Keyword ID missing' }, { status: 400 });

    let dbSupabase = supabase;

    if (token) {
      dbSupabase = createClient(
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
      
      const { data: userResponse, error: authError } = await dbSupabase.auth.getUser();
      if (authError || !userResponse?.user) {
        return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
      }
    }

    // Apaga os registros da tabela rank_history relacionados antes de apagar a keyword principal
    await dbSupabase
      .from('rank_history')
      .delete()
      .eq('keyword_id', id);

    const { error } = await dbSupabase
      .from('tracked_keywords')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao deletar palavra-chave:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
