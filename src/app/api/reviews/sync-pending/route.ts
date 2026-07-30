import { NextResponse } from 'next/server';
import { getReviews } from '@/lib/business';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAccessTokenByRefreshToken(refreshToken: string) {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!.trim(),
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!.trim(),
        refresh_token: refreshToken.trim(),
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('Erro ao renovar token OAuth no sync-pending:', err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado. Token de sessão ausente.' }, { status: 401 });
    }

    // 1. Validar a sessão do usuário no Supabase
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

    // 2. Conectar como administrador para consultar e atualizar a tabela
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // 3. Buscar todos os clientes do usuário que têm ficha GBP vinculada
    const { data: clients, error: clientsError } = await adminSupabase
      .from('clients')
      .select('id, name, gbp_account_id, gbp_location_id')
      .eq('user_id', user.id)
      .not('gbp_location_id', 'is', null);

    if (clientsError || !clients || clients.length === 0) {
      return NextResponse.json([]);
    }

    // 4. Buscar a integração e obter o access token do Google diretamente via Admin Supabase (sem bloqueio de RLS)
    const { data: integration } = await adminSupabase
      .from('google_integrations')
      .select('refresh_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!integration || !integration.refresh_token) {
      return NextResponse.json({ error: 'Integração do Google não encontrada para este usuário' }, { status: 400 });
    }

    const accessToken = await getAccessTokenByRefreshToken(integration.refresh_token);
    if (!accessToken) {
      return NextResponse.json({ error: 'Falha ao renovar token OAuth do Google' }, { status: 401 });
    }

    // 5. Executar consultas de avaliações em paralelo com o accessToken direto e pageSize=50
    const syncResults = await Promise.all(
      clients.map(async (client) => {
        try {
          if (!client.gbp_account_id || !client.gbp_location_id) {
            return { id: client.id, pendingReviewsCount: 0 };
          }

          const reviews = await getReviews(client.gbp_account_id, client.gbp_location_id, undefined, accessToken);
          
          if (Array.isArray(reviews)) {
            const pendingCount = reviews.filter((r: any) => !r.reviewReply).length;
            
            // Atualizar banco de dados para este cliente específico
            await adminSupabase
              .from('clients')
              .update({ pending_reviews_count: pendingCount })
              .eq('id', client.id);

            return { id: client.id, pendingReviewsCount: pendingCount };
          } else {
            console.warn(`Aviso: Retorno de reviews inválido para ${client.name}.`);
          }
        } catch (e) {
          console.error(`Erro ao sincronizar avaliações do cliente ${client.name}:`, e);
        }
        return null;
      })
    );

    const updatedCounts = syncResults.filter(Boolean);
    return NextResponse.json(updatedCounts);
  } catch (error) {
    console.error('Erro na API /api/reviews/sync-pending:', error);
    return NextResponse.json({ error: 'Erro interno durante a sincronização.' }, { status: 500 });
  }
}
