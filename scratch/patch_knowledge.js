
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Iniciando Patch da Base de Conhecimento ---');

// 1. Adicionar Estados
const stateSearch = "const [savingConfig, setSavingConfig] = useState(false);";
const stateReplace = `const [savingConfig, setSavingConfig] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [kbTitle, setKbTitle] = useState('');
  const [kbContent, setKbContent] = useState('');
  const [loadingKB, setLoadingKB] = useState(false);
  const [savingKB, setSavingKB] = useState(false);`;

if (content.includes(stateSearch)) {
    content = content.replace(stateSearch, stateReplace);
    console.log('✅ Estados adicionados!');
}

// 2. Adicionar Funções KB
const functionSearch = "  const handleSelectClient = (client: any) => {";
const functionReplace = `  const fetchKnowledgeBase = async (clientId: string) => {
    setLoadingKB(true);
    try {
      const res = await fetch(\`/api/knowledge?clientId=\${clientId}\`);
      const data = await res.json();
      if (Array.isArray(data)) setKnowledgeBase(data);
    } catch (e) { console.error(e); } finally { setLoadingKB(false); }
  };

  const handleAddKnowledge = async () => {
    if (!selectedClient || !kbTitle || !kbContent) return;
    setSavingKB(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id, title: kbTitle, content: kbContent })
      });
      if (res.ok) {
        setKbTitle('');
        setKbContent('');
        fetchKnowledgeBase(selectedClient.id);
      }
    } catch (e) { console.error(e); } finally { setSavingKB(false); }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Excluir este conhecimento?')) return;
    try {
      const res = await fetch(\`/api/knowledge?id=\${id}\`, { method: 'DELETE' });
      if (res.ok) fetchKnowledgeBase(selectedClient.id);
    } catch (e) { console.error(e); }
  };

  const handleSelectClient = (client: any) => {
    fetchKnowledgeBase(client.id);`;

if (content.includes(functionSearch)) {
    content = content.replace(functionSearch, functionReplace);
    console.log('✅ Funções KB adicionadas!');
}

// 3. Atualizar a UI de Configurações
// Vamos encontrar a seção de Perfil de IA e inserir a Base de Conhecimento ANTES dela
const uiSearch = "{/* PERFIL DE IA */}";
const uiReplace = `{/* 📚 BASE DE CONHECIMENTO (Notebook GSC) */}
                            <div className="space-y-6 pt-8 border-t border-gray-800">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span className="text-2xl">📚</span> Base de Conhecimento (Estilo NotebookLM)
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Adicione fatos, serviços, história e documentos para "treinar" a inteligência deste cliente.</p>
                                </div>

                                {/* LISTA DE CONHECIMENTO */}
                                <div className="grid grid-cols-1 gap-4">
                                    {knowledgeBase.map((item) => (
                                        <div key={item.id} className="bg-[#161b22] border border-gray-800 rounded-xl p-4 group relative">
                                            <button 
                                                onClick={() => handleDeleteKnowledge(item.id)}
                                                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                🗑️
                                            </button>
                                            <h4 className="font-bold text-[#00ff9d] text-sm mb-1 uppercase tracking-wider">{item.title}</h4>
                                            <p className="text-gray-400 text-sm whitespace-pre-wrap">{item.content}</p>
                                        </div>
                                    ))}
                                    {knowledgeBase.length === 0 && !loadingKB && (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-2xl text-gray-600 text-sm italic">
                                            Nenhum conhecimento cadastrado ainda. Comece adicionando abaixo!
                                        </div>
                                    )}
                                </div>

                                {/* FORM ADICIONAR */}
                                <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-6 space-y-4">
                                    <input 
                                        type="text"
                                        value={kbTitle}
                                        onChange={(e) => setKbTitle(e.target.value)}
                                        placeholder="Título (Ex: Nossos Diferenciais, História, Lista de Preços...)"
                                        className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00ff9d]"
                                    />
                                    <textarea 
                                        value={kbContent}
                                        onChange={(e) => setKbContent(e.target.value)}
                                        rows={4}
                                        placeholder="Cole aqui o conteúdo ou fatos detalhados..."
                                        className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00ff9d] resize-none"
                                    />
                                    <button 
                                        onClick={handleAddKnowledge}
                                        disabled={savingKB || !kbTitle || !kbContent}
                                        className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 transition-all flex justify-center items-center gap-2">
                                        {savingKB ? '⌛ Adicionando...' : '➕ Adicionar à Inteligência'}
                                    </button>
                                </div>
                            </div>

                            {/* PERFIL DE IA */}`;

if (content.includes(uiSearch)) {
    content = content.replace(uiSearch, uiReplace);
    console.log('✅ UI de Conhecimento adicionada!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('--- Patch Finalizado ---');
