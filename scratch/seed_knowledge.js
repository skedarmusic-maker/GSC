const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rhnlcrhmcieuogtbwppp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50';

const supabase = createClient(supabaseUrl, supabaseKey);

const clientId = '444260ff-6ced-4cfb-a6a9-0fb5e5eb96d7';

async function addKnowledge() {
    const knowledgeItems = [
        {
            client_id: clientId,
            title: 'Informações de Contato e Localização',
            content: `Endereço: Av. Recife, 768 - Subsetor Norte - 13 (N-13), Ribeirão Preto - SP, 14078-390
Telefone: (16) 99349-9652
Horário: Disponível 24h
Áreas Atendidas: Ribeirão Preto, Bonfim Paulista, Sertãozinho, Cravinhos, Jardinópolis.`
        },
        {
            client_id: clientId,
            title: 'Serviços Prestados',
            content: `Serviços: Chaveiro 24 Horas, Chaveiro Automotivo, Abertura de Residências, Abertura de Carros, Cópia de Chaves, Chaves Codificadas, Instalação de Fechaduras, Troca de Segredo.`
        },
        {
            client_id: clientId,
            title: 'Palavras-Chave SEO (Core & Emergency)',
            content: `Core SEO: chaveiro ribeirão preto, chaveiro 24 horas ribeirão preto, chaveiro urgente ribeirão preto.
Emergência: abertura de porta urgente, destrancar carro ribeirão preto, socorro chaveiro ribeirão preto.`
        }
    ];

    for (const item of knowledgeItems) {
        const { error } = await supabase
            .from('knowledge_base')
            .insert(item);
        
        if (error) {
            console.error(`Erro ao inserir ${item.title}:`, error);
        } else {
            console.log(`SUCESSO: ${item.title} adicionado!`);
        }
    }
}

addKnowledge();
