import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLocalPost } from '@/lib/business';

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

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('--- INICIANDO CRON DE PUBLICAÇÃO ---');

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Busca postagens pendentes que já passaram do horário
    const { data: posts, error } = await adminSupabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString());

    if (error) throw error;

    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: 'Nenhuma postagem pendente para este horário.' });
    }

    const results = [];

    // 2. Processa cada postagem
    for (const post of posts) {
      try {
        console.log(`Processando postagem agendada ID: ${post.id}`);
        
        let clientAccessToken = null;

        // Tentar obter o user_id associado ao local do Maps
        const { data: client } = await adminSupabase
          .from('clients')
          .select('user_id')
          .eq('gbp_location_id', post.location_id)
          .maybeSingle();

        if (client && client.user_id) {
          console.log(`Maps local_id ${post.location_id} associado ao user_id ${client.user_id}`);
          const { data: integration } = await adminSupabase
            .from('google_integrations')
            .select('refresh_token')
            .eq('user_id', client.user_id)
            .maybeSingle();

          if (integration && integration.refresh_token) {
            console.log(`Renovando token OAuth usando o refresh_token do usuário.`);
            clientAccessToken = await getAccessTokenByRefreshToken(integration.refresh_token);
          } else {
            console.warn(`Nenhuma integração do Google activa encontrada para o usuário ${client.user_id}`);
          }
        } else {
          console.warn(`Nenhum cliente/Maps encontrado no banco com o gbp_location_id ${post.location_id}. Tentando usar token global.`);
        }

        const success = await createLocalPost(post.account_id, post.location_id, {
          text: post.content,
          imageUrl: post.image_url,
          buttonType: post.button_type,
          buttonUrl: post.button_url
        }, undefined, clientAccessToken || undefined);
        
        if (success) {
          await adminSupabase
            .from('scheduled_posts')
            .update({ status: 'published' })
            .eq('id', post.id);
          results.push({ id: post.id, status: 'success' });
        } else {
          throw new Error('Erro na API do Google Business ao publicar post agendado');
        }
      } catch (err: any) {
        await adminSupabase
          .from('scheduled_posts')
          .update({ status: 'failed', error_message: err.message })
          .eq('id', post.id);
        results.push({ id: post.id, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({ processed: posts.length, results });

  } catch (error: any) {
    console.error('Erro no Cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
