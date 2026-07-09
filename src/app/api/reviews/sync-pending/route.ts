import { NextResponse } from 'next/server';
import { getReviews } from '@/lib/business';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    if (clientsError) {
      console.error('Erro ao buscar clientes para sincronização:', clientsError);
      return NextResponse.json({ error: 'Erro ao consultar clientes.' }, { status: 500 });
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json([]);
    }

    // 4. Executar consultas de avaliações em paralelo com limite de concorrência implícito por Promise.all
    const syncResults = await Promise.all(
      clients.map(async (client) => {
        try {
          if (!client.gbp_account_id || !client.gbp_location_id) {
            return { id: client.id, pendingReviewsCount: 0 };
          }

          const reviews = await getReviews(client.gbp_account_id, client.gbp_location_id, token);
          
          if (Array.isArray(reviews)) {
            const pendingCount = reviews.filter((r: any) => !r.reviewReply).length;
            
            // Atualizar banco de dados para este cliente específico
            await adminSupabase
              .from('clients')
              .update({ pending_reviews_count: pendingCount })
              .eq('id', client.id);

            return { id: client.id, pendingReviewsCount: pendingCount };
          } else {
            console.warn(`Aviso: Formato inválido de reviews retornado para ${client.name}.`);
          }
        } catch (e) {
          console.error(`Erro ao sincronizar avaliações do cliente ${client.name}:`, e);
        }
        return null;
      })
    );

    // Filtrar resultados nulos
    const updatedCounts = syncResults.filter(Boolean);

    return NextResponse.json(updatedCounts);
  } catch (error) {
    console.error('Erro na API /api/reviews/sync-pending:', error);
    return NextResponse.json({ error: 'Erro interno do servidor durante a sincronização.' }, { status: 500 });
  }
}
