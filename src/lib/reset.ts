import 'dotenv/config';
import { supabase } from './supabase';

async function resetFailedPosts() {
  console.log('🔄 Verificando postagens que falharam...');
  
  const { data, error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'pending', error_message: null })
    .not('id', 'is', 'null');

  if (error) {
    console.error('❌ Erro ao resetar:', error.message);
  } else {
    console.log('✅ Reset concluído com sucesso! Os posts voltaram para a fila.');
    console.log('👉 Agora você pode rodar: npx tsx src/lib/worker.ts');
  }
}

resetFailedPosts();
