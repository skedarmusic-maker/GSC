
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('clients').select('*').limit(1);
    if (error) console.error(error.message);
    else {
        console.log('✅ Colunas encontradas:', Object.keys(data[0]));
        if ('design_context' in data[0]) console.log('🚀 design_context EXISTE!');
        else console.log('⚠️ design_context NÃO encontrada.');
    }
}
check();
