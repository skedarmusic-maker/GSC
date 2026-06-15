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
    let { data: creditsData } = await adminSupabase
      .from('user_credits')
      .select('subscription_status, seo_allowed, next_billing_date')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!creditsData) {
      // Inserção de fallback com cota inicial de 0 créditos e status pending
      const { data: insertedCredits } = await adminSupabase
        .from('user_credits')
        .insert([{
          user_id: user.id,
          monthly_allowance: 0,
          purchased_credits: 0,
          subscription_status: 'pending',
          seo_allowed: false
        }])
        .select('subscription_status, seo_allowed, next_billing_date')
        .single();
      
      if (insertedCredits) {
        creditsData = insertedCredits;
      }
    }

    // Buscar perfil/role
    const { data: roleData } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    // Validar se o plano expirou
    let subscriptionStatus = creditsData?.subscription_status || 'pending';
    const nextBillingDate = creditsData?.next_billing_date;

    if ((subscriptionStatus === 'active' || subscriptionStatus === 'trial') && nextBillingDate) {
      const expiryDate = new Date(nextBillingDate);
      const now = new Date();
      if (now > expiryDate) {
        subscriptionStatus = 'expired';
      }
    }

    return NextResponse.json({
      success: true,
      subscription_status: subscriptionStatus,
      seo_allowed: creditsData?.seo_allowed ?? false,
      role: roleData?.role || 'user',
      next_billing_date: nextBillingDate
    });

  } catch (error: any) {
    console.error('ERRO API SUBSCRIPTION CHECK:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
