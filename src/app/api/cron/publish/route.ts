import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLocalPost } from '@/lib/business';

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
      console.error('Erro ao renovar token OAuth via refresh token:', await res.text());
      return null;
    }
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('Erro ao conectar ao OAuth:', err);
    return null;
  }
}

async function processPendingPosts() {
  console.log('--- INICIANDO CRON / PUBLICAÇÃO DE POSTS ---');

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Busca postagens pendentes que já passaram do horário
  const { data: posts, error } = await adminSupabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString());

  if (error) throw error;

  if (!posts || posts.length === 0) {
    return { message: 'Nenhuma postagem pendente para este horário.' };
  }

  const results = [];

  // 2. Processa cada postagem
  for (const post of posts) {
    try {
      console.log(`Processando postagem agendada ID: ${post.id}`);
      
      let clientAccessToken = null;
      let targetUserId = post.user_id;

      // Se não tiver user_id salvo na postagem, buscar no cliente pelo location_id
      if (!targetUserId) {
        const { data: client } = await adminSupabase
          .from('clients')
          .select('user_id')
          .eq('gbp_location_id', post.location_id)
          .maybeSingle();

        if (client && client.user_id) {
          targetUserId = client.user_id;
        }
      }

      if (targetUserId) {
        const { data: integration } = await adminSupabase
          .from('google_integrations')
          .select('refresh_token')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (integration && integration.refresh_token) {
          clientAccessToken = await getAccessTokenByRefreshToken(integration.refresh_token);
        } else {
          console.warn(`Nenhuma integração do Google encontrada para o usuário ${targetUserId}`);
        }
      }

      const resPost = await createLocalPost(post.account_id, post.location_id, {
        text: post.content,
        imageUrl: post.image_url,
        buttonType: post.button_type,
        buttonUrl: post.button_url
      }, undefined, clientAccessToken || undefined);
      
      if (resPost.success) {
        await adminSupabase
          .from('scheduled_posts')
          .update({ status: 'published' })
          .eq('id', post.id);
        results.push({ id: post.id, status: 'success' });
      } else {
        throw new Error(resPost.error || 'Erro na API do Google Business ao publicar post agendado');
      }
    } catch (err: any) {
      await adminSupabase
        .from('scheduled_posts')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', post.id);
      results.push({ id: post.id, status: 'failed', error: err.message });
    }
  }

  return { processed: posts.length, results };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const res = await processPendingPosts();
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('Erro no Cron GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const res = await processPendingPosts();
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('Erro no Cron POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
