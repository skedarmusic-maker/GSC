const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Adicionando coluna...');
  // Since we might not have 'exec_sql' RPC, we can use the postgres API if it were available, 
  // but to be safe without pg library, let's just instruct the user if it fails, or try a direct insert.
  // Actually, Supabase JS can't run DDL commands (ALTER TABLE) directly unless through RPC.
  console.log('Por favor, rode o seguinte comando SQL no editor SQL do painel do Supabase:');
  console.log('ALTER TABLE oportunidades_seo ADD COLUMN IF NOT EXISTS layout_draft TEXT;');
}
run();
