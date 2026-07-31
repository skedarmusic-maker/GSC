import { NextResponse } from 'next/server';
import { createLocalPost } from '@/lib/business';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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
    if (!res.ok) {
      console.error('Erro ao renovar token OAuth:', await res.text());
      return null;
    }
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('Erro ao conectar ao OAuth:', err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { accountId, locationId, postText, imageUrl, buttonType, buttonUrl } = await req.json();

    if (!accountId || !locationId || !postText) {
      return NextResponse.json({ error: 'accountId, locationId e postText são obrigatórios' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado. Token de sessão ausente.' }, { status: 401 });
    }

    // 1. Validar usuário no Supabase
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

    // 2. Buscar refresh_token via adminSupabase
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: integration } = await adminSupabase
      .from('google_integrations')
      .select('refresh_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!integration || !integration.refresh_token) {
      return NextResponse.json({ error: 'Integração com o Google não encontrada para sua conta.' }, { status: 400 });
    }

    const accessToken = await getAccessTokenByRefreshToken(integration.refresh_token);
    if (!accessToken) {
      return NextResponse.json({ error: 'Falha ao autenticar com a API do Google (Token expirado/inválido).' }, { status: 401 });
    }

    // 3. Criar postagem no Google
    const result = await createLocalPost(accountId, locationId, {
      text: postText,
      imageUrl,
      buttonType,
      buttonUrl
    }, undefined, accessToken);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Falha ao criar postagem na API do Google Business.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /posts error:', error);
    return NextResponse.json({ error: error?.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
