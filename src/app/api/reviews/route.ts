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
    
    if (!reviews) {
      return NextResponse.json({ error: 'Falha ao buscar avaliações' }, { status: 500 });
    }

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('API /reviews error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
