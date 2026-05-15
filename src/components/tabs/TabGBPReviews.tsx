'use client';

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
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">⭐ Gestão de Avaliações (com IA)</h2>
      <p className="text-gray-400 mb-8">Responda clientes rapidamente com sugestões da IA.</p>
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
