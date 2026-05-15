
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('--- VERIFICANDO TABELA gbp_analyses ---');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  const { data, error } = await supabase
    .from('gbp_analyses')
    .select('id, created_at, business_name, score')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ ERRO:', JSON.stringify(error));
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Tabela existe mas está VAZIA ou não existe.');
    
    // Tenta listar todas as tabelas para ver se gbp_analyses existe
    const { data: tables, error: tErr } = await supabase
      .rpc('get_tables')
      .select('*');
    
    if (tErr) {
      console.log('💡 Não foi possível listar tabelas via RPC.');
      console.log('💡 Verifique se a tabela "gbp_analyses" foi criada no Supabase.');
    }
    return;
  }

  console.log(`✅ Encontrados ${data.length} registros:`);
  data.forEach((r, i) => {
    console.log(`  ${i+1}. [${new Date(r.created_at).toLocaleDateString('pt-BR')}] ${r.business_name} — Score: ${r.score}`);
  });
}

check().catch(console.error);
