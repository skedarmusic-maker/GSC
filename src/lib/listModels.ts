import 'dotenv/config';

async function listMyModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('🔍 Consultando modelos disponíveis para sua chave...');
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    
    if (data.models) {
      console.log('✅ Modelos encontrados na sua conta:');
      data.models.forEach((m: any) => {
        console.log(`- ${m.name.replace('models/', '')} (Suporta: ${m.supportedGenerationMethods.join(', ')})`);
      });
    } else {
      console.error('❌ Erro na resposta:', data);
    }
  } catch (err) {
    console.error('❌ Erro de conexão:', err);
  }
}

listMyModels();
