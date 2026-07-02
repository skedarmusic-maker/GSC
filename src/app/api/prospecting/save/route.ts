import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper para validar o token JWT do Supabase e retornar o user_id
async function getUserIdFromRequest(req: Request): Promise<string | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return null;

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

// POST → Salvar uma análise
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado. Token de sessão ausente ou inválido.' }, { status: 401 });
    }

    const body = await req.json();

    const { data, error } = await adminSupabase
      .from('gbp_analyses')
      .insert([{
        user_id: userId,
        business_name: body.name,
        address: body.address || '',
        score: body.score || 0,
        rating: body.rating || 0,
        reviews: body.reviews || 0,
        website: body.website || '',
        website_status: body.websiteStatus || '',
        phone: body.phone || '',
        category: body.category || '',
        metrics: body.metrics || [],
        competitors: body.competitors || [],
        opportunities: body.opportunities || [],
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET → Listar análises salvas
export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado. Token de sessão ausente ou inválido.' }, { status: 401 });
    }

    const { data, error } = await adminSupabase
      .from('gbp_analyses')
      .select('id, created_at, business_name, score, address, rating, reviews, website_status, opportunities, metrics, competitors, phone, website, category')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ analyses: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE → Apagar uma análise
export async function DELETE(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado. Token de sessão ausente ou inválido.' }, { status: 401 });
    }

    const { id } = await req.json();
    const { error } = await adminSupabase
      .from('gbp_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
