
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Verificando Coluna local_path ---');
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('❌ Erro:', error.message);
    } else {
        console.log('✅ Dados recebidos:', data[0]);
        if (data[0] && 'local_path' in data[0]) {
            console.log('🚀 A COLUNA LOCAL_PATH EXISTE!');
        } else {
            console.log('⚠️ A coluna local_path NÃO foi encontrada.');
        }
    }
}

check();
