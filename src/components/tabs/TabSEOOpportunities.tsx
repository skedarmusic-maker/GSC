'use client';

interface Props {
  seoOpportunities: any[];
  loadingOpps: boolean;
  generatingContent: { [key: string]: boolean };
  viewingDraft: any;
  configBranded: string;
  selectedClient: any;
  setViewingDraft: (v: any) => void;
  fetchOpportunities: (id: string) => void;
  handleApproveOpportunity: (id: string) => void;
  handleViewLayout: (opp: any) => void;
}

export default function TabSEOOpportunities({
  seoOpportunities, loadingOpps, generatingContent, viewingDraft,
  configBranded, selectedClient, setViewingDraft,
  fetchOpportunities, handleApproveOpportunity, handleViewLayout
}: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold">🎯 Oportunidades Geradas pela IA <span className="text-[10px] bg-[#00ff9d]/20 text-[#00ff9d] px-2 py-1 rounded">V5.0 - LAYOUT REAL</span></h2>
          <p className="text-gray-400 mt-1">Sugestões automáticas do n8n (Alto Volume, Baixo CTR) prontas para virar artigos e páginas.</p>
        </div>
        <button
          onClick={() => selectedClient?.id && fetchOpportunities(selectedClient.id)}
          className="bg-[#161b22] border border-[#00ff9d]/30 text-[#00ff9d] font-bold px-5 py-2.5 rounded-xl text-sm transition-colors hover:bg-[#161b22]/80">
          🔄 Sincronizar Fila
        </button>
      </div>

      <div className="glass-card rounded-2xl border-[#00ff9d]/10 p-1 mt-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider text-[10px] font-bold bg-[#161b22]/50">
              <th className="p-4 rounded-tl-xl">Termo Encontrado</th>
              <th className="p-4 text-right">Métricas (Imp. / CTR)</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right rounded-tr-xl">Ação</th>
            </tr>
          </thead>
          <tbody>
            {loadingOpps ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-500">Carregando oportunidades...</td></tr>
            ) : seoOpportunities.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-500">Nenhuma oportunidade pendente para este cliente.</td></tr>
            ) : seoOpportunities.filter(opp => {
              if (!configBranded) return true;
              const blocked = configBranded.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
              return !blocked.some(b => opp.keyword.toLowerCase().includes(b));
            }).map(opp => (
              <tr key={opp.id} className="border-b border-gray-800/50 hover:bg-[#161b22]/40 transition-colors group">
                <td className="p-4">
                  <p className="font-bold text-white text-[15px]">{opp.keyword}</p>
                  <p className="text-xs text-gray-500 mt-1">Identificado em {new Date(opp.created_at).toLocaleDateString()}</p>
                </td>
                <td className="p-4 text-right">
                  <p className="text-white font-bold">{(opp.impressions || 0).toLocaleString()}</p>
                  <p className="text-xs text-red-400 font-medium mt-1">{(opp.ctr || 0)}% CTR</p>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    (opp.status || 'pendente') === 'pendente' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    opp.status === 'aprovada' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    opp.status === 'rascunho_gerado' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    'bg-[#00ff9d]/10 text-[#00ff9d] border-[#00ff9d]/20'
                  }`}>
                    {(opp.status || 'pendente').replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {opp.status === 'pendente' ? (
                    <button onClick={() => handleApproveOpportunity(opp.id)} disabled={generatingContent[opp.id]}
                      className="bg-[#00ff9d] text-gray-900 font-bold px-4 py-2 rounded-lg text-xs shadow-[0_0_10px_rgba(0,255,157,0.2)] hover:shadow-[0_0_15px_rgba(0,255,157,0.4)] transition-all">
                      {generatingContent[opp.id] ? '⏳ Gerando...' : 'Aprovar & Escrever'}
                    </button>
                  ) : opp.status === 'aprovada' ? (
                    <button onClick={() => handleViewLayout(opp)}
                      className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 px-4 rounded-xl border border-white/10 transition-all flex items-center gap-2">
                      🎨 Visualizar Layout
                    </button>
                  ) : opp.status === 'rascunho_gerado' ? (
                    <button onClick={() => setViewingDraft({ id: opp.id, draft: opp.content_draft, keyword: opp.keyword })}
                      className="bg-[#161b22] border border-purple-500/50 text-purple-400 font-bold px-4 py-2 rounded-lg text-xs hover:bg-purple-500/10 transition-all">
                      👁️ Ver Rascunho
                    </button>
                  ) : opp.status === 'layout_gerado' ? (
                    <button onClick={() => setViewingDraft({ id: opp.id, draft: opp.content_draft, layout_draft: opp.layout_draft, published_url: opp.published_url, keyword: opp.keyword })}
                      className="bg-[#161b22] border border-[#00ff9d]/50 text-[#00ff9d] font-bold px-4 py-2 rounded-lg text-xs hover:bg-[#00ff9d]/10 transition-all">
                      ✨ Ver Layout Final
                    </button>
                  ) : opp.status === 'publicada' ? (
                    <a href={opp.published_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-xs font-bold underline">
                      Ver Página ↗
                    </a>
                  ) : (
                    <span className="text-gray-500 text-xs italic">Aguardando IA...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE RASCUNHO / LAYOUT */}
      {viewingDraft && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#0d1117]">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {viewingDraft.layout_draft ? '🎨 Layout Gerado — Pronto para Aprovar' : '📝 Rascunho de Conteúdo IA'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {viewingDraft.layout_draft
                    ? `Palavra-chave: "${viewingDraft.keyword || ''}"`
                    : 'Gerado pelo Gemini AI — revise antes de avançar'}
                </p>
              </div>
              <button onClick={() => setViewingDraft(null)} className="p-2 text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-[#0d1117]/50 flex-1 flex flex-col gap-6">
              {!viewingDraft.layout_draft ? (
                // Visão de Texto (rascunho de copy)
                <div className="flex-1 flex flex-col">
                  {(!viewingDraft.draft || viewingDraft.draft.length < 50) ? (
                    <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-center">
                      <p className="text-red-400 font-bold mb-2">⚠️ O rascunho está vazio ou muito curto!</p>
                      <p className="text-xs text-gray-400">Houve um erro na geração do texto pela IA. Tente sincronizar a fila novamente ou gerar de novo.</p>
                    </div>
                  ) : (
                    <div className="text-gray-300 whitespace-pre-wrap font-serif text-lg leading-relaxed">
                      {viewingDraft.draft}
                    </div>
                  )}
                </div>
              ) : (
                // Visão do código TSX gerado — com botão de preview nativo
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-[#00ff9d]">
                      ✨ Código da Página Gerada para <strong>{selectedClient?.name || 'Cliente'}</strong>:
                    </p>
                    <button
                      onClick={() => {
                        const slug = viewingDraft.keyword
                          ? viewingDraft.keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                          : viewingDraft.id;
                        window.open(`/preview/${slug}`, '_blank');
                      }}
                      className="text-[10px] bg-[#00ff9d] text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-[#00cc7d] transition-colors">
                      🖥️ Abrir Preview da Página
                    </button>
                  </div>
                  
                  <div className="flex-1 bg-[#0d1117] rounded-xl overflow-hidden border border-gray-700 min-h-[400px] flex flex-col relative">
                    <div className="p-3 bg-[#161b22] border-b border-gray-700 flex items-center gap-2 shrink-0">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-xs text-gray-400 ml-2 font-mono">
                        {viewingDraft.keyword
                          ? viewingDraft.keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
                          : 'pagina'}/page.tsx
                      </span>
                    </div>
                    {viewingDraft.layout_draft ? (
                      <iframe 
                        src={`/preview/${viewingDraft.keyword ? viewingDraft.keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : viewingDraft.id}`}
                        className="flex-1 w-full bg-white h-full border-none"
                        title="Preview do Layout"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500 text-sm">
                        Aguardando geração do layout...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-4 bg-[#0d1117]">
              <button onClick={() => setViewingDraft(null)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-colors">Fechar</button>
              
              {!viewingDraft.layout_draft ? (
                <button
                  disabled={!viewingDraft.draft || viewingDraft.draft.length < 50}
                  onClick={(e) => {
                    const opp = seoOpportunities.find(o => o.id === viewingDraft.id);
                    (e.target as HTMLButtonElement).innerText = '⏳ Gerando Layout...';
                    handleViewLayout(opp);
                  }}
                  className={`bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-2.5 rounded-xl text-sm border border-white/20 transition-all ${(!viewingDraft.draft || viewingDraft.draft.length < 50) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  🎨 Gerar Layout com Identidade do Site
                </button>
              ) : (
                <button
                  onClick={async (e) => {
                    const btn = e.target as HTMLButtonElement;
                    btn.innerText = '🚀 Enviando para o Projeto...';
                    btn.disabled = true;
                    
                    try {
                      const res = await fetch('/api/ai/publish-layout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ opportunityId: viewingDraft.id })
                      });
                      const result = await res.json();
                      if (result.success) {
                        alert(result.message || `✅ Página enviada com sucesso!\n\nURL: ${result.url}`);
                        setViewingDraft(null);
                        fetchOpportunities(selectedClient.id);
                      } else {
                        alert('Erro ao publicar: ' + result.error);
                        btn.innerText = `🚀 Aprovar e Enviar para o ${selectedClient?.name || 'Projeto'}`;
                        btn.disabled = false;
                      }
                    } catch (err) {
                      console.error(err);
                      btn.innerText = `🚀 Aprovar e Enviar para o ${selectedClient?.name || 'Projeto'}`;
                      btn.disabled = false;
                    }
                  }}
                  className="bg-[#00ff9d] text-gray-900 font-bold px-8 py-2.5 rounded-xl text-sm shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transition-all">
                  🚀 Aprovar e Enviar para o {selectedClient?.name || 'Projeto'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
