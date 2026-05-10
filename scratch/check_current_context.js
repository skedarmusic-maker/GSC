
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getReviews() {
    const clientId = "9af4dec6-0d54-4096-8210-9082d5d1cf20"; // Pagani Custom
    
    // Como as reviews podem estar em uma tabela separada ou vindo da API, 
    // vou tentar buscar se houver algo salvo ou apenas simular a busca se eu tivesse a API key ativa.
    // Mas aqui no nosso sistema, as reviews são buscadas via API em tempo real.
    // Vou buscar o contexto de negócio atual para ver o que já temos.
    
    const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
    console.log('--- CONTEXTO ATUAL ---');
    console.log(client.business_context);
}
getReviews();
