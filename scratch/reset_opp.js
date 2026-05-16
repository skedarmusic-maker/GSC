const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rhnlcrhmcieuogtbwppp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetOpp() {
    const { error } = await supabase
        .from('oportunidades_seo')
        .update({ 
            status: 'rascunho_gerado',
            layout_draft: null 
        })
        .eq('keyword', 'cópia de chave perto de mim');

    if (error) console.error('Erro:', error);
    else console.log('STATUS RESETADO! PODE GERAR O LAYOUT NOVAMENTE NO PAINEL.');
}

resetOpp();
