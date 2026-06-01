import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

export async function getAccessToken(tokenSupabase?: string) {
  // Se houver tokenSupabase, NÃO podemos usar o token global do .env por questões de segurança e multi-tenancy!
  let googleRefreshToken = tokenSupabase ? null : process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (tokenSupabase) {
    try {
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          global: {
            headers: {
              Authorization: `Bearer ${tokenSupabase}`
            }
          }
        }
      );
      
      const { data: integration, error } = await userSupabase
        .from('google_integrations')
        .select('refresh_token')
        .single();
        
      if (!error && integration?.refresh_token) {
        googleRefreshToken = integration.refresh_token;
        console.log('📡 GBP: Usando Refresh Token OAuth dinâmico do usuário.');
      } else {
        console.warn('⚠️ GBP: Nenhuma integração ativa encontrada para este usuário. Operação cancelada por segurança.');
        return null;
      }
    } catch (err) {
      console.error('Erro ao ler integração do Google:', err);
      return null;
    }
  }

  if (!googleRefreshToken) {
    console.error('❌ GBP: Nenhum refresh token disponível.');
    return null;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      cache: 'no-store',
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!.trim(),
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!.trim(),
        refresh_token: googleRefreshToken.trim(),
        grant_type: 'refresh_token',
      }),
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.error('Erro ao renovar token OAuth do Google:', errText);
      return null;
    }
    
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('Erro de conexão ao renovar token OAuth:', err);
    return null;
  }
}

// === DESCOBERTA AUTOMÁTICA DE LOCAIS ===
// Agora o sistema busca dinamicamente todos os perfis que você gerencia

export async function listLocations(tokenSupabase?: string) {
  try {
    const accessToken = await getAccessToken(tokenSupabase);

    // 1. Listar todas as contas de gerenciamento
    const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      cache: 'no-store'
    });
    const accountsData = await accountsRes.json();
    
    if (!accountsData.accounts) return [];

    let allLocations: any[] = [];

    // 2. Para cada conta, buscar os locais (empresas)
    for (const account of accountsData.accounts) {
      const locationsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,websiteUri,metadata,storefrontAddress`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-store'
      });
      const locData = await locationsRes.json();

      if (locData.locations) {
        const accountId = account.name.split('/')[1];
        
        // Filtra apenas locais verificados ou que o usuário tem permissão ativa
        const verified = locData.locations.filter((l: any) =>
          l.metadata?.hasVoiceOfMerchant || l.metadata?.canUpdate
        );

        const formatted = verified.map((l: any) => ({
          ...l,
          accountId: accountId
        }));
        allLocations = [...allLocations, ...formatted];
      }
    }

    return allLocations;
  } catch (error) {
    console.error('Erro na descoberta automática de locais:', error);
    return [];
  }
}

export async function getLocationPerformance(locationName: string, days?: number, startDateStr?: string, endDateStr?: string, tokenSupabase?: string) {
  try {
    const accessToken = await getAccessToken(tokenSupabase);
    const cleanLocationName = locationName.replace(/^accounts\/[^/]+\//, '');

    let start: Date;
    let end: Date;

    if (startDateStr && endDateStr) {
      start = new Date(startDateStr);
      end = new Date(endDateStr);
    } else {
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - (days || 28));
    }

    const metrics = [
      { key: 'calls', google: 'CALL_CLICKS' },
      { key: 'directions', google: 'BUSINESS_DIRECTION_REQUESTS' },
      { key: 'websiteClicks', google: 'WEBSITE_CLICKS' }
    ];

    const timeSeriesData: { [key: string]: any[] } = {};
    const totals: { [key: string]: number } = { calls: 0, directions: 0, websiteClicks: 0 };

    const fetchMetric = async (metricObj: any) => {
      const url = `https://businessprofileperformance.googleapis.com/v1/${cleanLocationName}:getDailyMetricsTimeSeries?dailyMetric=${metricObj.google}&dailyRange.startDate.year=${start.getFullYear()}&dailyRange.startDate.month=${start.getMonth() + 1}&dailyRange.startDate.day=${start.getDate()}&dailyRange.endDate.year=${end.getFullYear()}&dailyRange.endDate.month=${end.getMonth() + 1}&dailyRange.endDate.day=${end.getDate()}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-store'
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) return [];

      const data = await res.json();
      if (data.timeSeries?.datedValues) {
        return data.timeSeries.datedValues.map((v: any) => ({
          date: `${v.date.year}-${String(v.date.month).padStart(2, '0')}-${String(v.date.day).padStart(2, '0')}`,
          value: parseInt(v.value || '0')
        }));
      }
      return [];
    };

    const results = await Promise.all(metrics.map(m => fetchMetric(m)));

    // Consolidar dados para o gráfico (agrupar por data)
    const chartDataMap: { [date: string]: any } = {};
    
    results.forEach((resArray, idx) => {
      const metricKey = metrics[idx].key;
      resArray.forEach((item: any) => {
        if (!chartDataMap[item.date]) chartDataMap[item.date] = { date: item.date };
        chartDataMap[item.date][metricKey] = item.value;
        totals[metricKey] += item.value;
      });
    });

    // Converter mapa para array ordenado para o Recharts
    const chartData = Object.values(chartDataMap).sort((a: any, b: any) => a.date.localeCompare(b.date));

    return { 
      totals, 
      chartData,
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  } catch (error) {
    console.error('Falha no motor de Maps:', error);
    return null;
  }
}


// === NOVAS FUNÇÕES: GESTÃO DO PERFIL ===

export async function getReviews(accountId: string, locationId: string, tokenSupabase?: string) {
  try {
    const accessToken = await getAccessToken(tokenSupabase);
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`;

    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Erro ao buscar reviews:', errorText);
      // Tenta extrair a mensagem de erro do JSON se possível
      try {
        const errorObj = JSON.parse(errorText);
        return { error: errorObj.error.message };
      } catch {
        return { error: 'Falha desconhecida na API do Google' };
      }
    }
    const data = await res.json();
    return data.reviews || [];
  } catch (error) {
    console.error(error);
    return { error: 'Erro de conexão' };
  }
}

export async function replyToReview(reviewName: string, replyText: string, tokenSupabase?: string) {
  try {
    const accessToken = await getAccessToken(tokenSupabase);
    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment: replyText })
    });

    if (!res.ok) return false;
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function createLocalPost(accountId: string, locationId: string, postData: { text: string, imageUrl?: string, buttonType?: string, buttonUrl?: string }, tokenSupabase?: string) {
  try {
    const accessToken = await getAccessToken(tokenSupabase);
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`;

    const body: any = {
      languageCode: 'pt-BR',
      summary: postData.text,
      topicType: 'STANDARD'
    };

    // Adicionar Imagem se existir
    if (postData.imageUrl) {
      body.media = [
        {
          mediaFormat: 'PHOTO',
          sourceUrl: postData.imageUrl
        }
      ];
    }

    // Adicionar Botão se existir
    if (postData.buttonType && postData.buttonType !== 'NONE') {
      body.callToAction = {
        actionType: postData.buttonType,
        url: postData.buttonUrl || ''
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const resData = await res.json();

    if (!res.ok) {
      console.error('Erro na API do Google:', resData);
      return false;
    }

    console.log('Resposta do Google:', resData);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getLocationDetails(locationId: string, tokenSupabase?: string) {
  try {
    const accessToken = await getAccessToken(tokenSupabase);
    // A API v1 aceita apenas locations/{id} sem o prefixo de account
    // readMask=* não é suportado — listamos campos explícitos
       const cleanId = locationId.replace(/^accounts\/[^\/]+\//, '');
    const readMask = 'name,title,websiteUri,phoneNumbers,regularHours,profile,categories,latlng,storefrontAddress,metadata';
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${cleanId}?readMask=${readMask}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error('Erro ao buscar detalhes do local:', await res.text());
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Erro em getLocationDetails:', error);
    return null;
  }
}
