'use client';

import { useState } from 'react';

interface Props {
  localReviews: any[];
  loadingLocal: boolean;
  replyText: { [key: string]: string };
  generatingAI: { [key: string]: boolean };
  setReplyText: (v: any) => void;
  handleGenerateAI: (review: any) => void;
  handleReply: (reviewName: string) => void;
}

export default function TabGBPReviews({
  localReviews, loadingLocal, replyText, generatingAI,
  setReplyText, handleGenerateAI, handleReply
}: Props) {
  // Estados para a calculadora de avaliações
  const [currentRating, setCurrentRating] = useState<number>(4.0);
  const [totalReviews, setTotalReviews] = useState<number>(10);
  const [targetRating, setTargetRating] = useState<number>(4.7);

  // Lógica matemática da calculadora
  const calculateNeededReviews = (current: number, total: number, target: number, isGoogleArredondado: boolean) => {
    if (current >= target) return 0;
    if (target > 5.0) return 0;
    
    let adjustedTarget = target;
    if (isGoogleArredondado) {
      if (target === 5.0) {
        adjustedTarget = 4.95;
      } else {
        adjustedTarget = target - 0.05;
      }
    }

    if (current >= adjustedTarget) return 0;
    if (adjustedTarget >= 5.0) return 0;
    
    const currentSum = current * total;
    const needed = (adjustedTarget * total - currentSum) / (5 - adjustedTarget);
    return Math.max(0, Math.ceil(needed));
  };

  const neededExact = calculateNeededReviews(currentRating, totalReviews, targetRating, false);
  const neededGoogle = calculateNeededReviews(currentRating, totalReviews, targetRating, true);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <h2 className="text-2xl font-bold mb-2">⭐ Gestão de Avaliações (com IA)</h2>
      <p className="text-gray-400 mb-8">Responda clientes rapidamente com sugestões da IA.</p>

      {/* CARD PREMIUM DO SIMULADOR DE NOTAS */}
      <div className="bg-[#090d16] border border-[#00ff9d]/20 rounded-2xl p-6 space-y-6 mb-8 shadow-[0_0_30px_rgba(0,255,157,0.02)]">
        <div className="flex items-center gap-2 text-[#00ff9d]">
          <span className="text-xl">🧮</span>
          <h3 className="text-lg font-black text-white uppercase tracking-wider">Simulador de Notas e Avaliações</h3>
        </div>
        <p className="text-xs text-gray-400">
          Calcule quantas novas avaliações de 5 estrelas são necessárias para alcançar a reputação desejada no Google Maps. Use esta simulação para demonstrar impacto aos clientes!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input Nota Atual */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Nota Média Atual</label>
            <input
              type="number"
              min="1.0"
              max="5.0"
              step="0.1"
              value={currentRating}
              onChange={(e) => setCurrentRating(Math.min(5.0, Math.max(1.0, parseFloat(e.target.value) || 0)))}
              className="w-full bg-[#121824] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff9d]"
            />
          </div>

          {/* Input Qtd Atual */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total de Avaliações</label>
            <input
              type="number"
              min="1"
              value={totalReviews}
              onChange={(e) => setTotalReviews(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-[#121824] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff9d]"
            />
          </div>

          {/* Input Nota Alvo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Nota Média Alvo</label>
            <input
              type="number"
              min="1.0"
              max="5.0"
              step="0.1"
              value={targetRating}
              onChange={(e) => setTargetRating(Math.min(5.0, Math.max(1.0, parseFloat(e.target.value) || 0)))}
              className="w-full bg-[#121824] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff9d]"
            />
          </div>
        </div>

        {/* Painel de Resultados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
          {/* Card Google Arredondado */}
          <div className="bg-[#121824] border border-[#00ff9d]/10 rounded-xl p-5 relative overflow-hidden" style={{ boxShadow: '0 0 20px rgba(0, 255, 157, 0.01)' }}>
            <div className="absolute top-0 right-0 bg-[#00ff9d]/10 text-[#00ff9d] px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-widest">
              Recomendado (Google)
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Exibição do Google Maps</p>
            <h4 className="text-5xl font-black text-white flex items-baseline gap-2">
              {neededGoogle} 
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">avaliações de 5★</span>
            </h4>
            <p className="text-xs text-gray-500 mt-2">
              Necessário para atingir nota real de <span className="text-white font-bold">{(targetRating === 5.0 ? 4.95 : targetRating - 0.05).toFixed(2)}</span>, que o Google arredondará e exibirá como <span className="text-[#00ff9d] font-bold">{targetRating.toFixed(1)}</span>.
            </p>
          </div>

          {/* Card Nota Exata */}
          <div className="bg-[#121824] border border-white/5 rounded-xl p-5">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Nota Aritmética Exata</p>
            <h4 className="text-5xl font-black text-gray-400 flex items-baseline gap-2">
              {neededExact} 
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">avaliações de 5★</span>
            </h4>
            <p className="text-xs text-gray-500 mt-2">
              Necessário para que a média aritmética exata seja rigorosamente igual ou superior a <span className="text-white font-bold">{targetRating.toFixed(2)}</span>.
            </p>
          </div>
        </div>
      </div>
      {loadingLocal ? (
        <div className="text-center p-16 text-[#00ff9d] animate-pulse glass-card rounded-2xl border-[#00ff9d]/10">Sincronizando avaliações...</div>
      ) : localReviews.filter((r: any) => !r.reviewReply).length === 0 ? (
        <div className="text-center p-16 border border-dashed border-gray-800 rounded-2xl text-gray-500 bg-[#161b22]/30">🎉 Todas as avaliações foram respondidas!</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {localReviews.filter((r: any) => !r.reviewReply).map((review: any, i: number) => (
            <div key={i} className="glass-card rounded-2xl p-8 flex flex-col border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <img src={review.reviewer?.profilePhotoUrl} alt="" className="w-12 h-12 rounded-full bg-[#161b22] border border-gray-800" />
                  <div>
                    <p className="font-bold text-white text-lg">{review.reviewer?.displayName}</p>
                    <div className="text-[#00ff9d] text-sm tracking-widest mt-1">
                      {'★'.repeat(review.starRating || 0)}<span className="text-gray-700">{'☆'.repeat(5 - (review.starRating || 0))}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-500 px-3 py-1 bg-[#161b22] rounded-full border border-gray-800">
                  {review.createTime ? new Date(review.createTime).toLocaleDateString() : ''}
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-8 leading-relaxed italic flex-1">"{review.comment || '(Avaliação sem comentário)'}"</p>
              {review.reviewReply ? (
                <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 border-l-4 border-l-[#00ff9d] mt-auto">
                  <p className="text-[10px] text-[#00ff9d] font-bold mb-2 uppercase tracking-widest">Resposta Publicada</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{review.reviewReply.comment}</p>
                </div>
              ) : (
                <div className="bg-[#0d1117]/80 border border-[#00ff9d]/20 rounded-xl p-5 mt-auto shadow-[0_0_15px_rgba(0,255,157,0.05)]">
                  <p className="text-[10px] text-red-400 font-bold mb-3 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span> Requer Resposta
                  </p>
                  <textarea
                    value={replyText[review.name] || ''}
                    onChange={e => setReplyText({ ...replyText, [review.name]: e.target.value })}
                    placeholder="Escreva sua resposta..."
                    className="w-full bg-[#161b22] border border-gray-800 text-gray-200 p-4 rounded-xl text-sm mb-4 focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] min-h-[130px] resize-y font-medium"
                  />
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <button onClick={() => handleGenerateAI(review)} disabled={generatingAI[review.name]}
                      className="bg-[#161b22] hover:bg-[#161b22]/80 border border-[#00ff9d]/30 text-[#00ff9d] px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                      {generatingAI[review.name] ? '⏳ Gemini pensando...' : '✨ Sugestão IA'}
                    </button>
                    <button onClick={() => handleReply(review.name)} disabled={!replyText[review.name]}
                      className="bg-[#00ff9d] hover:bg-[#34d399] text-gray-900 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] hover:shadow-[0_0_25px_rgba(0,255,157,0.5)] disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed">
                      Publicar Resposta
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
