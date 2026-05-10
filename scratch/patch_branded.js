
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Iniciando Instalação do Filtro de Marca ---');

// 1. Injetar Estados
const stateSearch = `const [syncingDesign, setSyncingDesign] = useState(false);`;
const stateReplacement = `const [syncingDesign, setSyncingDesign] = useState(false);
  const [configBranded, setConfigBranded] = useState('');
  const [savingBranded, setSavingBranded] = useState(false);`;

// 2. Injetar no handleSelectClient (assumindo que a função exista assim, ou injetaremos em useEffect se preferir)
// É mais seguro injetar logo abaixo da declaração dos states e deixar o onChange do select setar, mas como já existe um handleSelectClient, vamos tentar substituir.
const clientSelectSearch = `setConfigLocalPath(client.local_path || '');`;
const clientSelectReplacement = `setConfigLocalPath(client.local_path || '');
    setConfigBranded(client.design_context?.branded_keywords || '');`;

// 3. Função de Salvar Config
const handleSaveSearch = `const handleSyncDesign = async () => {`;
const handleSaveReplacement = `
  const handleSaveBranded = async () => {
    if (!selectedClient) return;
    setSavingBranded(true);
    try {
        const res = await fetch('/api/sites', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedClient.id,
                design_context: { ...selectedClient.design_context, branded_keywords: configBranded }
            })
        });
        if (res.ok) alert('✅ Filtro de Marca atualizado com sucesso! A aba de Oportunidades será limpa.');
    } catch(e) {
        console.error(e);
        alert('Erro ao salvar filtro.');
    } finally {
        setSavingBranded(false);
    }
  };

  const handleSyncDesign = async () => {`;

// 4. Interface na aba Config
const configUISearch = `<p className="text-xs text-gray-500 italic">Este caminho é usado pelo Antigravity para criar novas páginas e componentes diretamente na pasta do cliente.</p>
                            </div>`;
const configUIReplacement = `<p className="text-xs text-gray-500 italic">Este caminho é usado pelo Antigravity para criar novas páginas e componentes diretamente na pasta do cliente.</p>
                            </div>

                            {/* FILTRO DE MARCA */}
                            <div className="space-y-4 pt-8 border-t border-gray-800">
                                <label className="block text-sm font-bold text-[#ffbb00] uppercase tracking-widest">Termos Negativados (Marca)</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={configBranded}
                                        onChange={(e) => setConfigBranded(e.target.value)}
                                        placeholder="Ex: pagani, custom floripa, mecanica pagani (separados por vírgula)"
                                        className="flex-1 bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffbb00] transition-all"
                                    />
                                    <button 
                                        onClick={handleSaveBranded}
                                        disabled={savingBranded}
                                        className="bg-[#161b22] hover:bg-[#1c2128] border border-[#ffbb00]/30 text-[#ffbb00] px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0">
                                        {savingBranded ? '⌛ Salvando...' : '💾 Salvar Filtro'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 italic">Digite as palavras-chave que a IA deve <b>ignorar</b> nas sugestões (ex: nome da empresa). Isso limpa a tela para mostrar apenas intenções de serviços.</p>
                            </div>`;

// 5. Aplicar o Filtro no Map das Oportunidades
const mapSearch = `) : seoOpportunities.map((opp) => {`;
const mapReplacement = `) : seoOpportunities.filter(opp => {
                                                if (!configBranded) return true;
                                                const blocked = configBranded.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                                                const kw = opp.keyword.toLowerCase();
                                                return !blocked.some(b => kw.includes(b));
                                            }).map((opp) => {`;


if (content.includes(stateSearch) && content.includes(configUISearch) && content.includes(mapSearch)) {
    content = content.replace(stateSearch, stateReplacement);
    
    if(content.includes(clientSelectSearch)) {
        content = content.replace(clientSelectSearch, clientSelectReplacement);
    }

    if(content.includes(handleSaveSearch)) {
        content = content.replace(handleSaveSearch, handleSaveReplacement);
    }

    content = content.replace(configUISearch, configUIReplacement);
    content = content.replace(mapSearch, mapReplacement);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Filtro de Marca instalado com sucesso!');
} else {
    console.log('❌ Falha ao encontrar os blocos para substituição.');
}
