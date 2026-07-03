import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json({ error: 'Falta o parâmetro locationId' }, { status: 400 });
    }

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado. Token de sessão ausente ou inválido.' }, { status: 401 });
    }

    // Verificar se o usuário é Super Admin ou se é proprietário do local
    const { data: roleData } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    const isSuperAdmin = roleData?.role === 'super_admin';

    if (!isSuperAdmin) {
      const { data: ownerCheck } = await adminSupabase
        .from('clients')
        .select('id')
        .eq('gbp_location_id', locationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!ownerCheck) {
        return NextResponse.json({ error: 'Acesso negado. Este local não pertence à sua conta.' }, { status: 403 });
      }
    }

    const { data, error } = await adminSupabase
      .from('gbp_audit_history')
      .select('*')
      .eq('location_id', locationId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar histórico de auditoria:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Erro na rota de histórico de auditoria:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
