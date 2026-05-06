import { supabase } from './supabase';

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    cache: 'no-store',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!.trim(),
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!.trim(),
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

// === DESCOBERTA AUTOMÁTICA DE LOCAIS ===
// Agora o sistema busca dinamicamente todos os perfis que você gerencia

export async function listLocations() {
  try {
    const accessToken = await getAccessToken();

    // 1. Listar todas as contas de gerenciamento
    const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      cache: 'no-store'
    });
    const accountsData = await accountsRes.json();
    
    console.log('DEBUG VERCEL - Contas encontradas:', accountsData.accounts?.length || 0);
    if (accountsData.error) {
      console.error('DEBUG VERCEL - Erro na API de Contas:', accountsData.error);
    }

    if (!accountsData.accounts) return [];

    let allLocations: any[] = [];

    // 2. Para cada conta, buscar os locais (empresas)
    for (const account of accountsData.accounts) {
      const locationsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,websiteUri,metadata`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-store'
      });
      const locData = await locationsRes.json();
      console.log(`DEBUG VERCEL - Locais na conta ${account.name}:`, locData.locations?.length || 0);

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

export async function getLocationPerformance(locationName: string, days: number) {
  try {
    const accessToken = await getAccessToken();

    // Configurar datas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const metrics = [
      'CALL_CLICKS',
      'BUSINESS_CONVERSIONS_DIRECTIONS',
      'WEBSITE_CLICKS'
    ];

    const fetchSingleMetric = async (metric: string) => {
      const url = `https://businessprofileperformance.googleapis.com/v1/${locationName}:getDailyMetricsTimeSeries?dailyMetric=${metric}&dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-store'
      });
      const data = await res.json();

      let total = 0;
      if (data.timeSeries && data.timeSeries.datedValues) {
        data.timeSeries.datedValues.forEach((v: any) => {
          total += parseInt(v.value || '0');
        });
      }
      return total;
    };

    const [calls, directions, websiteClicks] = await Promise.all(
      metrics.map(m => fetchSingleMetric(m))
    );

    return { calls, directions, websiteClicks };
  } catch (error) {
    console.error('Falha no motor de Maps:', error);
    return null;
  }
}

// === NOVAS FUNÇÕES: GESTÃO DO PERFIL ===

export async function getReviews(accountId: string, locationId: string) {
  try {
    const accessToken = await getAccessToken();
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

export async function replyToReview(reviewName: string, replyText: string) {
  try {
    const accessToken = await getAccessToken();
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

export async function createLocalPost(accountId: string, locationId: string, postData: { text: string, imageUrl?: string, buttonType?: string, buttonUrl?: string }) {
  try {
    const accessToken = await getAccessToken();
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

export async function getLocationDetails(locationId: string) {
  try {
    const accessToken = await getAccessToken();
    // A API v1 aceita apenas locations/{id} sem o prefixo de account
    // readMask=* não é suportado — listamos campos explícitos
    const cleanId = locationId.replace(/^accounts\/[^\/]+\//, '');
    const readMask = 'name,title,websiteUri,phoneNumbers,regularHours,profile,categories';
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
