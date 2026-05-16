const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rhnlcrhmcieuogtbwppp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50';

const supabase = createClient(supabaseUrl, supabaseKey);

const stitchPrompt = `Estilo focado em serviços de emergência e urgência. 
CORES: Fundo em azul escuro profundo (#0F172A), detalhes e CTAs em Vermelho (#EF4444) e Amarelo (#EAB308) para alto contraste. 
FONTES: Sans-serif moderna e legível. 
LAYOUT: Minimalista, com foco em botões de ação rápida (Ligar, WhatsApp) e tipografia em negrito para passar autoridade.`;

async function updateClient() {
    const { data, error } = await supabase
        .from('clients')
        .update({ 
            stitch_prompt: stitchPrompt,
            project_folder: 'Chaveiro Rafael'
        })
        .eq('id', '444260ff-6ced-4cfb-a6a9-0fb5e5eb96d7');

    if (error) {
        console.error('Erro ao atualizar cliente:', error);
        return;
    }

    console.log('SYNC_SUCCESS: Cliente Chaveiro Ribeirão sincronizado com sucesso!');
}

updateClient();
