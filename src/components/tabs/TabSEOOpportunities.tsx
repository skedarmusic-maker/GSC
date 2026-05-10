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
          <h2 className="text-2xl font-bold">🎯 Oportunidades Geradas pela IA</h2>
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
                    <button onClick={() => setViewingDraft({ id: opp.id, draft: opp.content_draft })}
                      className="bg-[#161b22] border border-purple-500/50 text-purple-400 font-bold px-4 py-2 rounded-lg text-xs hover:bg-purple-500/10 transition-all">
                      👁️ Ver Rascunho
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

      {/* MODAL DE RASCUNHO */}
      {viewingDraft && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#0d1117]">
              <div>
                <h3 className="text-xl font-bold text-white">Rascunho de Conteúdo IA</h3>
                <p className="text-xs text-gray-500 mt-1">Gerado pelo Gemini Flash</p>
              </div>
              <button onClick={() => setViewingDraft(null)} className="p-2 text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-8 overflow-y-auto bg-[#0d1117]/50 text-gray-300 whitespace-pre-wrap font-serif text-lg leading-relaxed">
              {viewingDraft.draft}
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-4 bg-[#0d1117]">
              <button onClick={() => setViewingDraft(null)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-colors">Fechar</button>
              <button
                onClick={() => {
                  const opp = seoOpportunities.find(o => o.id === viewingDraft.id);
                  handleViewLayout(opp);
                  setViewingDraft(null);
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-2.5 rounded-xl text-sm border border-white/20 transition-all flex items-center gap-2">
                🎨 Gerar Layout (Stitch)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
