import { NextResponse } from 'next/server';
import { getReviews } from '@/lib/business';

import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { accountId, locationId } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

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

    if (!accountId || !locationId) {
      return NextResponse.json({ error: 'accountId e locationId são obrigatórios' }, { status: 400 });
    }

    const reviews = await getReviews(accountId, locationId, token);
    
    if (!reviews || (reviews as any).error) {
      return NextResponse.json({ error: (reviews as any).error || 'Falha ao buscar avaliações' }, { status: 500 });
    }

    if (Array.isArray(reviews)) {
      const pendingCount = reviews.filter((r: any) => !r.reviewReply).length;
      
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );

      await adminSupabase
        .from('clients')
        .update({ pending_reviews_count: pendingCount })
        .eq('gbp_location_id', locationId)
        .eq('user_id', user.id);
    }

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('API /reviews error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
