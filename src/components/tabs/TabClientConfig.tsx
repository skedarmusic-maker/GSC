'use client';

interface Props {
  configLocalPath: string;
  configBusinessContext: string;
  configBranded: string;
  savingConfig: boolean;
  savingBranded: boolean;
  syncingDesign: boolean;
  knowledgeBase: any[];
  loadingKB: boolean;
  savingKB: boolean;
  kbTitle: string;
  kbContent: string;
  setConfigLocalPath: (v: string) => void;
  setConfigBusinessContext: (v: string) => void;
  setConfigBranded: (v: string) => void;
  setKbTitle: (v: string) => void;
  setKbContent: (v: string) => void;
  handleSaveSettings: () => void;
  handleSaveBranded: () => void;
  handleSyncDesign: () => void;
  handleAddKnowledge: () => void;
  handleDeleteKnowledge: (id: string) => void;
}

export default function TabClientConfig({
  configLocalPath, configBusinessContext, configBranded,
  savingConfig, savingBranded, syncingDesign,
  knowledgeBase, loadingKB, savingKB, kbTitle, kbContent,
  setConfigLocalPath, setConfigBusinessContext, setConfigBranded,
  setKbTitle, setKbContent,
  handleSaveSettings, handleSaveBranded, handleSyncDesign,
  handleAddKnowledge, handleDeleteKnowledge
}: Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">⚙️ Configurações do Projeto</h2>
        <p className="text-gray-400">Gerencie onde este site está localizado no seu computador e como a IA deve se comportar.</p>
      </div>

      <div className="glass-card rounded-2xl p-8 border-white/5 space-y-8">
        {/* CAMINHO LOCAL */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-[#00ff9d] uppercase tracking-widest">Caminho do Projeto no Windows</label>
          <div className="flex gap-4">
            <input type="text" value={configLocalPath} onChange={(e) => setConfigLocalPath(e.target.value)}
              placeholder="Ex: C:\Users\Skedar\Desktop\IA - SITES\Projeto-X"
              className="flex-1 bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff9d] transition-all" />
            <button onClick={handleSyncDesign} disabled={syncingDesign || !configLocalPath}
              className="bg-[#161b22] hover:bg-[#1c2128] border border-[#00ff9d]/30 text-[#00ff9d] px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0">
              {syncingDesign ? '⌛ Sincronizando...' : '🎨 Sincronizar Design'}
            </button>
          </div>
          <p className="text-xs text-gray-500 italic">Este caminho é usado pelo Antigravity para criar novas páginas e componentes diretamente na pasta do cliente.</p>
        </div>

        {/* FILTRO DE MARCA */}
        <div className="space-y-4 pt-8 border-t border-gray-800">
          <label className="block text-sm font-bold text-[#ffbb00] uppercase tracking-widest">Termos Negativados (Marca)</label>
          <div className="flex gap-4">
            <input type="text" value={configBranded} onChange={(e) => setConfigBranded(e.target.value)}
              placeholder="Ex: pagani, custom floripa, mecanica pagani (separados por vírgula)"
              className="flex-1 bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffbb00] transition-all" />
            <button onClick={handleSaveBranded} disabled={savingBranded}
              className="bg-[#161b22] hover:bg-[#1c2128] border border-[#ffbb00]/30 text-[#ffbb00] px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0">
              {savingBranded ? '⌛ Salvando...' : '💾 Salvar Filtro'}
            </button>
          </div>
          <p className="text-xs text-gray-500 italic">Digite as palavras-chave que a IA deve <b>ignorar</b> nas sugestões. Isso limpa a tela para mostrar apenas intenções de serviços.</p>
        </div>

        {/* BASE DE CONHECIMENTO */}
        <div className="space-y-6 pt-8 border-t border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📚</span> Base de Conhecimento (Estilo NotebookLM)
            </h3>
            <p className="text-sm text-gray-500 mt-1">Adicione fatos, serviços, história e documentos para "treinar" a inteligência deste cliente.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {knowledgeBase.map((item) => (
              <div key={item.id} className="bg-[#161b22] border border-gray-800 rounded-xl p-4 group relative">
                <button onClick={() => handleDeleteKnowledge(item.id)}
                  className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
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

          <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-6 space-y-4">
            <input type="text" value={kbTitle} onChange={(e) => setKbTitle(e.target.value)}
              placeholder="Título (Ex: Nossos Diferenciais, História, Lista de Preços...)"
              className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00ff9d]" />
            <textarea value={kbContent} onChange={(e) => setKbContent(e.target.value)} rows={4}
              placeholder="Cole aqui o conteúdo ou fatos detalhados..."
              className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00ff9d] resize-none" />
            <button onClick={handleAddKnowledge} disabled={savingKB || !kbTitle || !kbContent}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 transition-all flex justify-center items-center gap-2">
              {savingKB ? '⌛ Adicionando...' : '➕ Adicionar à Inteligência'}
            </button>
          </div>
        </div>

        {/* PERFIL DE IA */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-[#00ff9d] uppercase tracking-widest">Perfil de Escrita IA (Treinamento)</label>
          <textarea value={configBusinessContext} onChange={(e) => setConfigBusinessContext(e.target.value)} rows={10}
            placeholder="Descreva o tom de voz, público-alvo, serviços principais e o 'estilo' que a IA deve seguir para este cliente..."
            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff9d] transition-all font-sans leading-relaxed" />
        </div>

        <div className="flex justify-end pt-4">
          <button onClick={handleSaveSettings} disabled={savingConfig}
            className="bg-[#00ff9d] text-gray-900 font-black px-10 py-4 rounded-xl shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_35px_rgba(0,255,157,0.5)] transition-all flex items-center gap-2">
            {savingConfig ? '⌛ Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
