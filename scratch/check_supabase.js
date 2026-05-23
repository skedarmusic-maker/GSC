const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rhnlcrhmcieuogtbwppp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const clientId = "444260ff-6ced-4cfb-a6a9-0fb5e5eb96d7";
    console.log("Fetching all opportunities for client " + clientId);
    const { data, error } = await supabase
        .from('oportunidades_seo')
        .select('*')
        .eq('client_id', clientId);

    if (error) {
        console.error(error);
        return;
    }

    const nonPending = data.filter(opt => opt.status !== 'pendente' || opt.content_draft !== null || opt.layout_draft !== null);
    
    console.log("NON-PENDING OR DRAFTED OPPORTUNITIES:");
    console.log(JSON.stringify(nonPending, null, 2));
}

check();
