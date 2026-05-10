
const { Client } = require('pg');

const connectionString = "postgresql://postgres:fPInbXyCSuZksKIDwWcRndgHkXmCskXg@rhnlcrhmcieuogtbwppp.supabase.co:5432/postgres";

async function runSQL() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log('--- Conectado ao PostgreSQL ---');
        await client.query('ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS design_context jsonb DEFAULT \'{}\'::jsonb;');
        console.log('✅ Sucesso: Coluna design_context adicionada para memória visual.');
    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await client.end();
    }
}
runSQL();
