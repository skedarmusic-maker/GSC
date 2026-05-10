
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Iniciando Patch de Sincronização de Design ---');

// 1. Adicionar Estado
const stateSearch = "const [savingKB, setSavingKB] = useState(false);";
const stateReplace = `const [savingKB, setSavingKB] = useState(false);
  const [syncingDesign, setSyncingDesign] = useState(false);`;

if (content.includes(stateSearch)) {
    content = content.replace(stateSearch, stateReplace);
    console.log('✅ Estado adicionado!');
}

// 2. Adicionar Função de Sincronização
const functionSearch = "  const handleSelectClient = (client: any) => {";
const functionReplace = `  const handleSyncDesign = async () => {
    if (!selectedClient || !configLocalPath) {
        alert('Configure o caminho local primeiro!');
        return;
    }
    setSyncingDesign(true);
    try {
        // Envia um comando para a API que dispara a análise do Antigravity
        const res = await fetch('/api/sites/sync-design', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: selectedClient.id, localPath: configLocalPath })
        });
        const result = await res.json();
        if (result.success) {
            alert('Identidade Visual sincronizada com sucesso! Antigravity agora conhece o DNA deste site.');
        } else {
            alert('Aviso: ' + result.message);
        }
    } catch (e) {
        console.error(e);
        alert('Erro ao sincronizar design.');
    } finally {
        setSyncingDesign(false);
    }
  };

  const handleSelectClient = (client: any) => {`;

if (content.includes(functionSearch)) {
    content = content.replace(functionSearch, functionReplace);
    console.log('✅ Função de Sincronização adicionada!');
}

// 3. Adicionar Botão na UI de Configurações
const uiSearch = "placeholder=\"Ex: C:\\\\\\\\Users\\\\\\\\Skedar\\\\\\\\Desktop\\\\\\\\IA - SITES\\\\\\\\Projeto-X\"";
const uiReplace = `placeholder="Ex: C:\\\\\\\\Users\\\\\\\\Skedar\\\\\\\\Desktop\\\\\\\\IA - SITES\\\\\\\\Projeto-X"
                                    />
                                    <button 
                                        onClick={handleSyncDesign}
                                        disabled={syncingDesign || !configLocalPath}
                                        className="bg-[#161b22] hover:bg-[#1c2128] border border-[#00ff9d]/30 text-[#00ff9d] px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0">
                                        {syncingDesign ? '⌛ Sincronizando...' : '🎨 Sincronizar Design'}
                                    </button>`;

if (content.includes(uiSearch)) {
    content = content.replace(uiSearch, uiReplace);
    console.log('✅ Botão de Sincronização adicionado!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('--- Patch Finalizado ---');
