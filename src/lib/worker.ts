import 'dotenv/config';
import { supabase } from '../lib/supabase';
import { createLocalPost } from '../lib/business';

// Este é o motor que roda em background para publicar seus agendamentos
async function checkAndPublish() {
  console.log(`[${new Date().toLocaleString()}] Verificando postagens agendadas...`);

  // 1. Buscar postagens pendentes que já passaram do horário
  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString());

  if (error) {
    console.error('Erro ao buscar do Supabase:', error.message);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('Nenhuma postagem para publicar agora.');
    return;
  }

  console.log(`Encontradas ${posts.length} postagens para publicar!`);

  // 2. Processar cada uma
  for (const post of posts) {
    try {
      console.log(`Publicando no Google Maps: "${post.content.substring(0, 30)}..."`);
      
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
        console.log('✅ Publicado com sucesso!');
      } else {
        throw new Error('Falha na API do Google');
      }
    } catch (err: any) {
      console.error(`❌ Erro ao publicar post ${post.id}:`, err.message);
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', post.id);
    }
  }
}

// Rodar a cada 60 segundos
console.log('🚀 Motor de Agendamento iniciado!');
setInterval(checkAndPublish, 60000);
checkAndPublish();
