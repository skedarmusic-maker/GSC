const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rhnlcrhmcieuogtbwppp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOpportunity() {
    const { data, error } = await supabase
        .from('oportunidades_seo')
        .select('*')
        .eq('keyword', 'cópia de chave perto de mim')
        .limit(1);

    if (error) {
        console.error('Erro ao buscar oportunidade:', error);
        return;
    }

    console.log('OPPORTUNITY_DETAILS:', JSON.stringify(data));
}

checkOpportunity();
