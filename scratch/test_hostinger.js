
async function discoverHostinger() {
    const token = 'tgCGM6fv0NnPJd8fN0da2JieNutGzcWRom34jzKd2b119f4b';
    
    // Lista de URLs prováveis baseadas no SDK novo e no JSON
    const targets = [
        'https://api.hostinger.com/v1/hosting/accounts',
        'https://api.hostinger.com/hosting/v1/accounts',
        'https://developers.hostinger.com/api/v1/hosting/accounts',
        'https://api.hostinger.com/v1/billing/subscriptions' // Testar se outro setor responde
    ];
    
    console.log('--- BUSCANDO PORTA DE ENTRADA HOSTINGER ---');
    
    for (const url of targets) {
        try {
            console.log(`\nTentando: ${url}`);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Status:', response.status);
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                if (response.ok) {
                    console.log('✅ CONECTADO! Use este endereço.');
                    console.log('Dados:', JSON.stringify(data, null, 2));
                    return;
                } else {
                    console.log('Mensagem:', data.message || data.error || 'Erro sem mensagem');
                }
            } catch (e) {
                console.log('Resposta (não JSON):', text.substring(0, 100));
            }
        } catch (error) {
            console.error('Erro de rede:', error.message);
        }
    }
}

discoverHostinger();
