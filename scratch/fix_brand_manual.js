const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rhnlcrhmcieuogtbwppp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmxjcmhtY2lldW9ndGJ3cHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDYwMywiZXhwIjoyMDkzNTY2NjAzfQ.cPbpdNNksG9mazrplzkbcXXaUgo_mcmMblOabp0Pe50';

const supabase = createClient(supabaseUrl, supabaseKey);

async function improveDesignContext() {
    const stitchPrompt = `ESTILO OBRIGATÓRIO:
- Cores principais: Vermelho Vibrante (#EF4444) e Amarelo Ouro (#EAB308).
- Fundo: Use fundo escuro ou vermelho vibrante nas seções principais.
- Botões: Devem ser Amarelos (#EAB308) com texto escuro, arredondados.
- Tipografia: Use fontes modernas e pesadas (Sans-serif).
- Layout: Estilo Landing Page de conversão, com seções de serviços bem definidas usando cards com bordas suaves.
- Importante: Não use azul. O site deve ser focado no contraste Vermelho/Amarelo/Branco.`;

    const { error } = await supabase
        .from('clients')
        .update({
            stitch_prompt: stitchPrompt,
            design_context: { stitch_prompt: stitchPrompt }
        })
        .eq('id', '444260ff-6ced-4cfb-a6a9-0fb5e5eb96d7');

    if (error) console.error('Erro:', error);
    else console.log('MANUAL DA MARCA ATUALIZADO COM SUCESSO!');
}

improveDesignContext();
