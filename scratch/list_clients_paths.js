
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function list() {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) console.error(error.message);
    else {
        data.forEach(c => console.log(`CLIENTE: ${c.name} | PATH: ${c.local_path} | ID: ${c.id}`));
    }
}
list();
