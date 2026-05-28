import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não fornecido.' }, { status: 401 });
    }

    // 1. Inicializar cliente do usuário para obter o ID com segurança
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

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }

    // 2. Inicializar cliente Admin (service role) para buscar créditos e roles sem bloqueio de RLS
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Buscar status de assinatura e créditos
    const { data: creditsData } = await adminSupabase
      .from('user_credits')
      .select('subscription_status, seo_allowed')
      .eq('user_id', user.id)
      .maybeSingle();

    // Buscar perfil/role
    const { data: roleData } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      subscription_status: creditsData?.subscription_status || 'pending',
      seo_allowed: creditsData?.seo_allowed ?? false,
      role: roleData?.role || 'user'
    });

  } catch (error: any) {
    console.error('ERRO API SUBSCRIPTION CHECK:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
