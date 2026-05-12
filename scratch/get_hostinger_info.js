
async function testHostingerFinal() {
    const token = 'tgCGM6fv0NnPJd8fN0da2JieNutGzcWRom34jzKd2b119f4b';
    const baseUrl = 'https://api.hostinger.com/api';
    
    const targets = [
        `${baseUrl}/billing/v1/subscriptions`,
        `${baseUrl}/hosting/v1/accounts`,
        `${baseUrl}/domains/v1/portfolio`
    ];
    
    console.log('--- TESTANDO ACESSO REAL HOSTINGER ---');
    
    for (const url of targets) {
        try {
            console.log(`\nTentando: ${url}`);
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            
            const data = await response.json();
            console.log('Status:', response.status);
            if (response.ok) {
                console.log('✅ SUCESSO!');
                console.log(JSON.stringify(data, null, 2));
                return;
            } else {
                console.log('Mensagem:', data.message || data.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('Erro de conexão (Cloudflare/DNS):', error.message);
        }
    }
}

testHostingerFinal();
