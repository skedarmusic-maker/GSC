
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rhnlcrhmcieuogtbwppp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncGSCPanel() {
    console.log("--- SINCRONIZANDO PAINEL GSC (STATUS DA PÁGINA) ---");

    const { data, error } = await supabase
        .from('oportunidades_seo')
        .update({ 
            status: 'publicada', 
            published_url: 'https://paganicustomfloripa.com.br/preview/protecao-de-farol/' 
        })
        .ilike('keyword', '%farol%')
        .select();

    if (error) {
        console.error("Erro ao atualizar banco:", error.message);
    } else if (data && data.length > 0) {
        console.log(`✅ Sucesso! Oportunidade "${data[0].keyword}" atualizada para PUBLICADA.`);
    } else {
        console.log("⚠️ Nenhuma oportunidade encontrada com o termo 'farol'.");
    }
}

syncGSCPanel();
