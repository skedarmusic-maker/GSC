require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function makeSuperAdmin() {
  console.log("👑 Script de Ativação do Super Admin GSC...");
  
  try {
    // 1. Listar os usuários no Auth do Supabase
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    if (!users || users.length === 0) {
      console.log("❌ Nenhum usuário cadastrado no Supabase Auth. Por favor, cadastre-se na tela de registro primeiro!");
      return;
    }

    console.log(`\n👥 Encontrados ${users.length} usuários no Supabase:`);
    users.forEach((usr, idx) => {
      console.log(`[${idx + 1}] ID: ${usr.id} | Email: ${usr.email}`);
    });

    console.log("\n🚀 Tornando todos os usuários administradores para facilitar testes de desenvolvimento...");

    for (const usr of users) {
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: usr.id,
          role: 'super_admin'
        })
        .select();

      if (error) {
        console.error(`❌ Erro ao dar privilégios para ${usr.email}:`, error);
      } else {
        console.log(`✅ ${usr.email} agora é um SUPER ADMIN com sucesso!`);
      }
    }

    console.log("\n✨ Pronto! Recarregue a sua página localhost:3000 no navegador e faça o login novamente. O botão do Super Admin aparecerá no rodapé do menu lateral.");
  } catch (err) {
    console.error("❌ Falha crítica ao rodar o script:", err);
  }
}

makeSuperAdmin();
