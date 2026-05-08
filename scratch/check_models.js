require('dotenv').config();

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  console.log('Testando com a chave:', key?.substring(0, 5) + '...');
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    
    if (data.models) {
      console.log('Modelos disponíveis para você:');
      data.models.forEach(m => console.log('- ' + m.name));
    } else {
      console.log('Nenhum modelo encontrado ou erro:', data);
    }
  } catch (e) {
    console.error('Erro na requisição:', e);
  }
}

listModels();
