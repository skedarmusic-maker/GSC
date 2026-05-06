import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createLocalPost } from '@/lib/business';

// Este endpoint será chamado pela Vercel Cron automaticamente
export async function GET(request: Request) {
  // Verificação de segurança para garantir que apenas a Vercel chame este cron
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('--- INICIANDO CRON DE PUBLICAÇÃO ---');

  try {
    // 1. Busca postagens pendentes que já passaram do horário
    const { data: posts, error } = await supabase
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
        
        const success = await createLocalPost(post.account_id, post.location_id, {
          text: post.content,
          imageUrl: post.image_url,
          buttonType: post.button_type,
          buttonUrl: post.button_url
        });
        
        if (success) {
          await supabase
            .from('scheduled_posts')
            .update({ status: 'published' })
            .eq('id', post.id);
          results.push({ id: post.id, status: 'success' });
        } else {
          throw new Error('Erro na API do Google Business ao publicar post agendado');
        }
      } catch (err: any) {
        await supabase
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
