const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rhnlcrhmcieuogtbwppp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClient() {
    const { data, error } = await supabase
        .from('clients')
        .select('id, name, project_folder')
        .eq('id', '444260ff-6ced-4cfb-a6a9-0fb5e5eb96d7')
        .single();

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('CLIENT_CONFIG:', JSON.stringify(data));
}

checkClient();
