import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper para inicializar os clientes Supabase
function getSupabaseClients(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Token de autorização não fornecido.');
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

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  return { userSupabase, adminSupabase };
}

// Helper para validar se o usuário é super_admin
async function checkSuperAdmin(userSupabase: any, adminSupabase: any) {
  const { data: { user }, error: userError } = await userSupabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Sessão inválida ou expirada.');
  }

  // Verificar na tabela user_roles
  const { data: roleData, error: roleError } = await adminSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleError) {
    console.error('Erro ao buscar role:', roleError);
  }

  // Se a role for super_admin ou se for o e-mail administrativo principal (fallback de contingência)
  const isSuperAdmin = roleData?.role === 'super_admin' || user.email === 'gabrielamorimseo@gmail.com' || user.email === 'focus.earts@gmail.com';

  if (!isSuperAdmin) {
    throw new Error('Acesso negado. Apenas administradores têm acesso a este recurso.');
  }

  return user;
}

export async function GET(req: Request) {
  try {
    const { userSupabase, adminSupabase } = getSupabaseClients(req);
    await checkSuperAdmin(userSupabase, adminSupabase);

    // Buscar todos os clientes
    const { data: dbClients, error: clientsError } = await adminSupabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsError) throw clientsError;

    // Buscar todos os saldos de créditos
    const { data: dbCredits, error: creditsError } = await adminSupabase
      .from('user_credits')
      .select('*');

    if (creditsError) throw creditsError;

    // Buscar os 300 logs de requisições de APIs mais recentes
    const { data: dbLogs, error: logsError } = await adminSupabase
      .from('credit_usage_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (logsError) throw logsError;

    // Buscar todos os usuários cadastrados via Admin Auth API (requer service role)
    let usersList: any[] = [];
    try {
      const { data: { users }, error: authUsersError } = await adminSupabase.auth.admin.listUsers();
      if (authUsersError) throw authUsersError;
      usersList = users || [];
    } catch (err) {
      console.error('Erro ao listar usuários do auth:', err);
    }

    // Buscar todas as roles cadastrados no user_roles
    const { data: dbRoles, error: rolesError } = await adminSupabase
      .from('user_roles')
      .select('*');

    const rolesMap = new Map((dbRoles || []).map((r: any) => [r.user_id, r.role]));
    const creditsMap = new Map((dbCredits || []).map((c: any) => [c.user_id, c]));
    const usersMap = new Map(usersList.map((u: any) => [u.id, u]));

    // 1. Formatar Clientes com info de dono
    const clients = (dbClients || []).map((client: any) => {
      const ownerUser = usersMap.get(client.user_id);
      return {
        id: client.id,
        name: client.name,
        websiteUrl: client.website_url,
        gscUrl: client.gsc_url,
        gbpLocationId: client.gbp_location_id,
        seoEnabled: client.seo_enabled ?? false,
        ownerId: client.user_id,
        ownerEmail: ownerUser?.email || 'Sistema (Legado/Sem Usuário)',
        createdAt: client.created_at
      };
    });

    // 2. Formatar Usuários com suas cotas de créditos e roles
    const platformUsers = usersList.map((usr: any) => {
      const userCredits = creditsMap.get(usr.id);
      const userRole = rolesMap.get(usr.id) || 'user';
      return {
        id: usr.id,
        email: usr.email,
        fullName: usr.user_metadata?.full_name || 'Profissional FocusLocal',
        role: userRole,
        subscriptionStatus: userCredits?.subscription_status || 'pending',
        seoAllowed: userCredits?.seo_allowed ?? false,
        monthlyAllowance: userCredits?.monthly_allowance ?? 50,
        purchasedCredits: userCredits?.purchased_credits ?? 0,
        createdAt: usr.created_at
      };
    });

    // 3. Formatar Logs de consumo de API
    const logs = (dbLogs || []).map((log: any) => {
      const logUser = usersMap.get(log.user_id);
      return {
        id: log.id,
        userId: log.user_id,
        userEmail: logUser?.email || 'Sistema (Sem Usuário)',
        userName: logUser?.user_metadata?.full_name || 'Profissional FocusLocal',
        tokensConsumed: log.tokens_consumed ?? 1,
        actionDescription: log.action_description || 'Ação da API',
        createdAt: log.created_at
      };
    });

    return NextResponse.json({
      success: true,
      clients,
      users: platformUsers,
      logs
    });
  } catch (error: any) {
    console.error('ERRO GET API/ADMIN:', error);
    return NextResponse.json({ error: error.message || 'Falha ao processar requisição' }, { status: 403 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userSupabase, adminSupabase } = getSupabaseClients(req);
    await checkSuperAdmin(userSupabase, adminSupabase);

    const { action, clientId, enabled, userId, role, monthlyAllowance, purchasedCredits, subscriptionStatus } = await req.json();

    if (action === 'toggle_seo') {
      if (!clientId) {
        return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
      }

      const { data, error } = await adminSupabase
        .from('clients')
        .update({ seo_enabled: enabled })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, message: `SEO do cliente ${data.name} foi ${enabled ? 'ativado' : 'desativado'}.`, client: data });
    }

    if (action === 'update_credits') {
      if (!userId) {
        return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
      }

      // Upsert dos créditos do usuário
      const { data, error } = await adminSupabase
        .from('user_credits')
        .upsert({
          user_id: userId,
          monthly_allowance: Number(monthlyAllowance),
          purchased_credits: Number(purchasedCredits)
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Créditos atualizados com sucesso.', credits: data });
    }

    if (action === 'update_subscription') {
      if (!userId) {
        return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
      }

      // Buscar registro de créditos atual para saber se existe
      const { data: existingCredits } = await adminSupabase
        .from('user_credits')
        .select('monthly_allowance, purchased_credits')
        .eq('user_id', userId)
        .maybeSingle();

      let nextAllowance = 0;
      if (subscriptionStatus === 'trial') {
        nextAllowance = 1;
      } else if (subscriptionStatus === 'active') {
        nextAllowance = 50;
      } else {
        // Se for pending/cancelled, a cota deve ser 0
        nextAllowance = 0;
      }

      const { data, error } = await adminSupabase
        .from('user_credits')
        .upsert({
          user_id: userId,
          subscription_status: subscriptionStatus,
          monthly_allowance: nextAllowance,
          // Se for uma inserção nova, inicializa purchased_credits com 0
          ...(existingCredits ? {} : { purchased_credits: 0 })
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, message: `Assinatura do usuário atualizada para ${subscriptionStatus}.`, credits: data });
    }

    if (action === 'toggle_user_seo') {
      if (!userId) {
        return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
      }

      const { data, error } = await adminSupabase
        .from('user_credits')
        .upsert({
          user_id: userId,
          seo_allowed: enabled
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, message: `Módulo SEO do usuário foi ${enabled ? 'habilitado' : 'desabilitado'}.`, credits: data });
    }

    if (action === 'update_role') {
      if (!userId || !role) {
        return NextResponse.json({ error: 'ID do usuário e Role são obrigatórios.' }, { status: 400 });
      }

      const { data, error } = await adminSupabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, message: `Perfil do usuário atualizado para ${role}.`, role: data });
    }

    return NextResponse.json({ error: 'Ação administrativa desconhecida.' }, { status: 400 });
  } catch (error: any) {
    console.error('ERRO PATCH API/ADMIN:', error);
    return NextResponse.json({ error: error.message || 'Falha ao processar atualização administrativa' }, { status: 400 });
  }
}
