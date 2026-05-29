'use client';

import { useState, KeyboardEvent } from 'react';

interface Props {
  configLocalPath: string;
  configBusinessContext: string;
  configBranded: string;
  configProjectFolder: string;
  configStitchPrompt: string;
  savingConfig: boolean;
  savingBranded: boolean;
  syncingDesign: boolean;
  knowledgeBase: any[];
  loadingKB: boolean;
  savingKB: boolean;
  kbTitle: string;
  kbContent: string;
  selectedClient: any;
  setConfigLocalPath: (v: string) => void;
  setConfigBusinessContext: (v: string) => void;
  setConfigBranded: (v: string) => void;
  setConfigProjectFolder: (v: string) => void;
  setConfigStitchPrompt: (v: string) => void;
  setKbTitle: (v: string) => void;
  setKbContent: (v: string) => void;
  handleSaveSettings: () => void;
  handleSaveBranded: () => void;
  handleSyncDesign: () => void;
  handleAddKnowledge: () => void;
  handleDeleteKnowledge: (id: string) => void;
  manualDesignCode: string;
  setManualDesignCode: (v: string) => void;
  handleManualSync: () => void;
}

export default function TabClientConfig({
  configLocalPath, configBusinessContext, configBranded, configProjectFolder, configStitchPrompt,
  savingConfig, savingBranded, syncingDesign,
  knowledgeBase, loadingKB, savingKB, kbTitle, kbContent,
  selectedClient,
  setConfigLocalPath, setConfigBusinessContext, setConfigBranded, setConfigProjectFolder, setConfigStitchPrompt,
  setKbTitle, setKbContent,
  handleSaveSettings, handleSaveBranded, handleSyncDesign,
  handleAddKnowledge, handleDeleteKnowledge,
  manualDesignCode, setManualDesignCode, handleManualSync
}: Props) {
  const [tagInput, setTagInput] = useState('');

  // Converte a string CSV em array de tags, garantindo que sejam únicas
  const tags = configBranded
    ? Array.from(new Set(configBranded.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)))
    : [];

  const addTag = (value: string) => {
    const newTag = value.trim().toLowerCase();
    if (!newTag || tags.includes(newTag)) return;
    const updated = Array.from(new Set([...tags, newTag])).join(', ');
    setConfigBranded(updated);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    const updated = tags.filter(t => t !== tag).join(', ');
    setConfigBranded(updated);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const autoDetectBranded = () => {
    if (!selectedClient?.name) return;
    const stopWords = ['e', 'de', 'da', 'do', 'em', 'para', 'com', 'pet', 'shop', '-'];
    
    // Pega as tags existentes
    const currentTags = [...tags];
    
    // Quebra o nome em partes e limpa
    const nameParts = selectedClient.name
      .toLowerCase()
      .split(/[\s&]+/)
      .filter((w: string) => w.length > 2 && !stopWords.includes(w));

    // Adiciona o nome completo também
    const candidates = [...nameParts, selectedClient.name.toLowerCase()];
    
    // Filtra apenas o que já não existe
    const toAdd = candidates.filter(c => !currentTags.includes(c));
    
    if (toAdd.length > 0) {
      const updated = [...currentTags, ...toAdd].join(', ');
      setConfigBranded(updated);
    }
  };

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
              {syncingDesign ? '⌛ Sincronizando...' : '🎨 Sincronizar Local'}
            </button>
          </div>
          <p className="text-xs text-gray-500 italic">
            <strong>Atenção:</strong> Sincronizar Local só funciona se você estiver acessando via localhost. Se estiver no deploy, use o campo abaixo para colar o código.
          </p>
        </div>

        {/* COLAR MANUAL (Fallback para Deploy) */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ou Cole o Código Manualmente (Tailwind/CSS)</label>
            {manualDesignCode && (
              <button 
                onClick={handleManualSync}
                disabled={syncingDesign}
                className="text-[10px] bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/30 px-3 py-1 rounded-lg font-bold hover:bg-[#00ff9d]/20 transition-all"
              >
                {syncingDesign ? '⌛ Processando...' : '🚀 Processar Código'}
              </button>
            )}
          </div>
          <textarea 
            value={manualDesignCode}
            onChange={(e) => setManualDesignCode(e.target.value)}
            placeholder="Cole aqui o conteúdo do seu tailwind.config.js ou globals.css..."
            className="w-full bg-[#0d1117]/50 border border-gray-800 rounded-xl px-4 py-3 text-gray-400 text-xs focus:outline-none focus:border-[#00ff9d] transition-all h-24 resize-none font-mono"
          />
        </div>

        {/* STITCH DESIGN SYSTEM (Configurações da IA Geradora de Código) */}
        <div className="space-y-6 pt-8 border-t border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎨</span> Inteligência de Layout (Stitch)
            </h3>
            <p className="text-sm text-gray-500 mt-1">Defina como o FocusLocal deve gerar e onde deve salvar as novas páginas automáticas (Landing Pages, Artigos).</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ffbb00] uppercase tracking-widest">Nome da Pasta do Projeto</label>
              <input type="text" value={configProjectFolder} onChange={(e) => setConfigProjectFolder(e.target.value)}
                placeholder="Ex: Pagani Custom (deve ser exato)"
                className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffbb00] transition-all" />
              <p className="text-[10px] text-gray-500">A pasta onde o Stitch vai publicar as páginas. Tem que ser uma das pastas lá no seu Desktop dentro de IA - SITES.</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ffbb00] uppercase tracking-widest">Manual da Marca (Prompt de Design)</label>
              <textarea value={configStitchPrompt} onChange={(e) => setConfigStitchPrompt(e.target.value)} rows={3}
                placeholder="Ex: Estilo brutalista, fundo preto (#020202), detalhes em amarelo text-primary. Usar fonte Inter uppercase nos títulos."
                className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffbb00] transition-all resize-none" />
              <p className="text-[10px] text-gray-500">Regras de ouro que o Stitch nunca pode esquecer na hora de gerar uma página pra esse cliente.</p>
            </div>
          </div>
        </div>

        {/* FILTRO DE MARCA — NOVO SISTEMA DE TAGS */}
        <div className="space-y-4 pt-8 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-[#ffbb00] uppercase tracking-widest">
              🚫 Termos Negativados (Marca)
            </label>
            <button
              onClick={autoDetectBranded}
              className="text-xs bg-[#ffbb00]/10 hover:bg-[#ffbb00]/20 border border-[#ffbb00]/30 text-[#ffbb00] px-3 py-1.5 rounded-lg font-bold transition-all"
            >
              ✨ Auto-detectar da marca
            </button>
          </div>

          {/* Área de tags */}
          <div
            className="min-h-[52px] flex flex-wrap gap-2 items-center bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2.5 focus-within:border-[#ffbb00] transition-all cursor-text"
            onClick={() => document.getElementById('tag-input')?.focus()}
          >
            {tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1.5 bg-[#ffbb00]/10 border border-[#ffbb00]/30 text-[#ffbb00] text-xs font-bold px-3 py-1.5 rounded-full"
              >
                {tag}
                <button
                  onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                  className="text-[#ffbb00]/60 hover:text-[#ffbb00] transition-colors leading-none ml-0.5"
                >
                  ✕
                </button>
              </span>
            ))}
            <input
              id="tag-input"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (tagInput) addTag(tagInput); }}
              placeholder={tags.length === 0 ? 'Digite um termo e aperte Enter para adicionar...' : ''}
              className="flex-1 min-w-[180px] bg-transparent text-white text-sm focus:outline-none placeholder-gray-600"
            />
          </div>
          <p className="text-xs text-gray-500 italic">
            Digite o termo e aperte <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 text-[10px]">Enter</kbd> para adicionar. Clique no <strong className="text-gray-300">✕</strong> da tag para remover. A lista é filtrada em tempo real.
          </p>

          <div className="flex justify-end">
            <button onClick={handleSaveBranded} disabled={savingBranded}
              className="bg-[#161b22] hover:bg-[#1c2128] border border-[#ffbb00]/30 text-[#ffbb00] px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
              {savingBranded ? '⌛ Salvando...' : '💾 Salvar Filtro'}
            </button>
          </div>
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
