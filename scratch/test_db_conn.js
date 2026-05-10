
const { Client } = require('pg');

const connectionString = "postgresql://postgres:fPInbXyCSuZksKIDwWcRndgHkXmCskXg@rhnlcrhmcieuogtbwppp.supabase.co:5432/postgres";

async function testConn() {
    const client = new Client({
        connectionString: connectionString,
        connectionTimeoutMillis: 10000,
    });

    try {
        await client.connect();
        console.log('--- Conexão Estabelecida com Sucesso ---');
        const res = await client.query('SELECT current_database(), current_user;');
        console.log('DB:', res.rows[0]);
    } catch (err) {
        console.error('❌ Erro de Conexão:', err);
    } finally {
        await client.end();
    }
}

testConn();
