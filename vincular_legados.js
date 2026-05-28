require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Seu user_id detectado pelo script anterior
const YOUR_USER_ID = 'f05d9158-6991-46cb-99d1-00c43be2949d';
const YOUR_EMAIL = 'focus.earts@gmail.com';

async function vincularClientesLegados() {
  console.log("🔗 Vinculando clientes legados ao seu usuário...");
  console.log(`👤 Usuário destino: ${YOUR_EMAIL} (${YOUR_USER_ID})\n`);

  // 1. Verificar quantos clientes sem user_id existem
  const { data: semDono, error: countError } = await supabase
    .from('clients')
    .select('id, name')
    .is('user_id', null);

  if (countError) {
    console.error("❌ Erro ao buscar clientes:", countError);
    return;
  }

  if (!semDono || semDono.length === 0) {
    console.log("✅ Nenhum cliente sem dono encontrado. Tudo já está vinculado!");
    return;
  }

  console.log(`📋 Encontrados ${semDono.length} clientes sem user_id:\n`);
  semDono.forEach((c, i) => console.log(`   [${i+1}] ${c.name}`));

  // 2. Atualizar todos em lote
  console.log(`\n⚡ Vinculando todos ao usuário ${YOUR_EMAIL}...`);
  const { data: updated, error: updateError } = await supabase
    .from('clients')
    .update({ user_id: YOUR_USER_ID })
    .is('user_id', null)
    .select('id, name');

  if (updateError) {
    console.error("❌ Erro ao vincular clientes:", updateError);
    return;
  }

  console.log(`\n✅ ${updated.length} clientes vinculados com sucesso ao seu usuário!`);
  console.log("🔄 Recarregue o painel Super Admin para ver os dados atualizados.");
}

vincularClientesLegados();
