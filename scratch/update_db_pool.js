
const { Client } = require('pg');

// Tentando via porta 6543 (Connection Pooling do Supabase)
const connectionString = "postgresql://postgres:fPInbXyCSuZksKIDwWcRndgHkXmCskXg@rhnlcrhmcieuogtbwppp.supabase.co:6543/postgres";

async function runSQL() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('--- Conectado via Pooler (6543) ---');
        await client.query('ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS local_path text;');
        console.log('✅ Sucesso: Coluna local_path adicionada.');
    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await client.end();
    }
}

runSQL();
