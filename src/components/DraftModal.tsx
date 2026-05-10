import React from 'react';

interface DraftModalProps {
  viewingDraft: { id: string; draft: string } | null;
  setViewingDraft: (val: any) => void;
  seoOpportunities: any[];
  handleViewLayout: (opp: any) => void;
}

export const DraftModal: React.FC<DraftModalProps> = ({ 
  viewingDraft, 
  setViewingDraft, 
  seoOpportunities, 
  handleViewLayout 
}) => {
  if (!viewingDraft) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#0d1117]">
          <div>
            <h3 className="text-xl font-bold text-white">Rascunho de Conteúdo IA</h3>
            <p className="text-xs text-gray-500 mt-1">Gerado pelo Gemini 1.5 Pro</p>
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
          <button 
            onClick={() => { alert('Postagem automática sendo enviada para o WordPress/n8n...'); setViewingDraft(null); }}
            className="bg-[#00ff9d] text-gray-900 font-bold px-8 py-2.5 rounded-xl text-sm shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transition-all">
            🚀 Publicar Agora
          </button>
        </div>
      </div>
    </div>
  );
};
