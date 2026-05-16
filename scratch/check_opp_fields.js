const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rhnlcrhmcieuogtbwppp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOppColumns() {
    const { data, error } = await supabase
        .from('oportunidades_seo')
        .select('*')
        .eq('keyword', 'cópia de chave perto de mim')
        .limit(1);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('COLUMNS_AND_VALUES:', Object.keys(data[0]));
        console.log('STATUS:', data[0].status);
        console.log('HAS_STITCH_CODE:', !!data[0].stitch_code);
        console.log('HAS_FINAL_CONTENT:', !!data[0].final_content);
    }
}

checkOppColumns();
