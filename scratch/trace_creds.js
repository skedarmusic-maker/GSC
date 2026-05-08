require('dotenv').config();

async function traceCredentials() {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    console.error('Falha ao obter Token de Acesso. Verifique seu ClientID/Secret/RefreshToken no .env');
    return;
  }

  try {
    // 1. Descobrir quem é o dono do Token (Email e Escopos)
    const tokenInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);
    const tokenInfo = await tokenInfoRes.json();
    
    // 2. Tentar descobrir o Project ID via API do Google Cloud
    const projectInfoRes = await fetch('https://cloudresourcemanager.googleapis.com/v1/projects', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const projects = await projectInfoRes.json();

    console.log('\n--- RASTREAMENTO DE CREDENCIAIS ---');
    console.log('CLIENT_ID utilizado:', process.env.GOOGLE_ADS_CLIENT_ID?.substring(0, 20) + '...');
    console.log('EMAIL DA CONTA:', tokenInfo.email || 'Não encontrado (Verifique permissões)');
    console.log('ESCOPOS ATIVOS:', tokenInfo.scope);
    
    if (projects.projects && projects.projects.length > 0) {
      console.log('\nPROJETOS NO GOOGLE CLOUD VINCULADOS A ESSA CONTA:');
      projects.projects.forEach(p => {
        console.log(`- Nome: ${p.name} | ID do Projeto: ${p.projectId} | Número: ${p.projectNumber}`);
      });
    } else {
      console.log('\nNão foi possível listar projetos. (Provavelmente a API Cloud Resource Manager está desativada neste projeto)');
    }
    console.log('------------------------------------\n');

  } catch (e) {
    console.error('Erro ao rastrear:', e.message);
  }
}

async function getAccessToken() {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID.trim(),
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET.trim(),
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN.trim(),
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    return data.access_token;
  } catch (e) { return null; }
}

traceCredentials();
