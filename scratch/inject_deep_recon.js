
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const deepKnowledge = [
    {
        title: "Diferencial Competitivo & DNA",
        content: "A Pagani Custom Floripa é líder em iluminação premium e customização ótica em Florianópolis. O foco é em 'precisão cirúrgica', 'materiais de elite' e 'acabamento impecável'. Não fazemos apenas o básico; transformamos a estética e a segurança do veículo com foco em vedação, alinhamento e estética superior."
    },
    {
        title: "Projeto Signature: Projetores Bi-LED",
        content: "Serviço carro-chefe. Instalação de projetores Bi-LED de última geração com 6000K, garantindo iluminação 300% superior à original. Foco total em instalação plug-and-play (sem corte de fios), vedação contra infiltrações e alinhamento perfeito do feixe de luz."
    },
    {
        title: "Restauração de Faróis e Lentes",
        content: "Devolução da transparência original do policarbonato. O processo inclui polimento técnico, proteção UV e vitrificação de longa duração para evitar o amarelamento futuro."
    },
    {
        title: "Customização Estética (Máscara Negra e DRL)",
        content: "Especialistas em Máscara Negra com pintura interna em Black Piano ou Fosco. Instalação de DRL (Daytime Running Lights) com seta sequencial dual-color e Angel Eyes (Halo Rings) inspirados em marcas premium alemãs (BMW/Audi)."
    },
    {
        title: "Prova Social e Atendimento",
        content: "Empresa nota 5.0 no Google com mais de 40 avaliações positivas. Atendimento personalizado em galpão próprio na Costeira do Pirajubaé. Horário: Seg-Sex (08h-18h) e Sáb (08h-12h)."
    }
];

async function update() {
    const clientId = "9af4dec6-0d54-4096-8210-9082d5d1cf20";
    console.log(`--- Injetando Deep Recon na Base de Conhecimento ---`);

    // 1. Atualizar o Business Context (O "Cérebro" geral)
    await supabase.from('clients').update({ 
        business_context: "Especialista premium em iluminação automotiva. Tom de voz: Técnico, sofisticado, autoritário, focado em precisão e exclusividade. Evite gírias, use termos como 'precisão cirúrgica', 'elite', 'assinatura luminosa'."
    }).eq('id', clientId);

    // 2. Inserir blocos na Knowledge Base
    for (const item of deepKnowledge) {
        await supabase.from('knowledge_base').insert({
            client_id: clientId,
            title: item.title,
            content: item.content
        });
    }

    console.log('✅ Deep Recon finalizado e Inteligência Alimentada!');
}
update();
