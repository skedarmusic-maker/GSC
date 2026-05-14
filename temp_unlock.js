require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function unlockStatus() {
    console.log("🔓 Destravando status da oportunidade no GSC...");
    const { data, error } = await supabase
        .from('oportunidades_seo')
        .update({ status: 'concluido' })
        .eq('termo', 'farol florianopolis');

    if (error) {
        console.error("❌ Erro ao destravar:", error);
    } else {
        console.log("✅ Status 'farol florianopolis' atualizado para CONCLUIDO!");
    }
}

unlockStatus();
