
const { Client } = require('pg');

const connectionString = "postgresql://postgres:fPInbXyCSuZksKIDwWcRndgHkXmCskXg@rhnlcrhmcieuogtbwppp.supabase.co:5432/postgres";

async function runSQL() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('--- Conectado ao PostgreSQL ---');
        
        const res = await client.query('ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS local_path text;');
        console.log('✅ Sucesso: Coluna local_path adicionada (ou já existia).');
        
    } catch (err) {
        console.error('❌ Erro ao rodar SQL:', err.message);
    } finally {
        await client.end();
    }
}

runSQL();
