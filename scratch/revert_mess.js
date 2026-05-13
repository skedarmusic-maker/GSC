
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rhnlcrhmcieuogtbwppp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixTheMess() {
    console.log("--- REVERTENDO ATUALIZAÇÕES INCORRETAS ---");

    // Revertemos tudo que tem o link que eu coloquei, mas NÃO é a palavra correta
    const { data, error } = await supabase
        .from('oportunidades_seo')
        .update({ 
            status: 'pendente', 
            published_url: null 
        })
        .eq('published_url', 'https://paganicustomfloripa.com.br/preview/protecao-de-farol/')
        .not('keyword', 'eq', 'farol florianopolis')
        .select();

    if (error) {
        console.error("Erro ao limpar banco:", error.message);
    } else {
        console.log(`✅ Limpeza concluída! ${data.length} oportunidades voltaram para PENDENTE.`);
    }
}

fixTheMess();
