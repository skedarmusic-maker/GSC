'use client';

interface Props {
  postText: string;
  imageUrl: string;
  uploadingImage: boolean;
  buttonType: string;
  buttonUrl: string;
  scheduledDate: string;
  setPostText: (v: string) => void;
  setImageUrl: (v: string) => void;
  setButtonType: (v: string) => void;
  setButtonUrl: (v: string) => void;
  setScheduledDate: (v: string) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePost: () => void;
}

export default function TabGBPPosts({
  postText, imageUrl, uploadingImage, buttonType, buttonUrl, scheduledDate,
  setPostText, setImageUrl, setButtonType, setButtonUrl, setScheduledDate,
  handleImageUpload, handlePost
}: Props) {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <h2 className="text-2xl font-bold mb-2">📣 Atualizações da Empresa (Posts)</h2>
      <p className="text-gray-400 mb-8">Crie atualizações para manter o perfil ativo no Google.</p>
      <div className="glass-card rounded-2xl p-8 lg:p-10 shadow-[0_0_30px_rgba(0,255,157,0.05)] border-[#00ff9d]/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff9d] to-transparent opacity-50"></div>
        <div className="space-y-8 relative z-10">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Mensagem para os clientes</label>
            <textarea value={postText} onChange={(e) => setPostText(e.target.value)}
              placeholder="Ex: Estamos abertos no feriado! Venha nos visitar..."
              className="w-full h-40 bg-[#161b22] border border-gray-800 rounded-xl p-5 text-white text-sm focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] resize-none font-medium" />
            <div className="text-right text-[11px] text-gray-500 mt-2 font-medium">{postText.length} / 1500</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Foto (Opcional)</label>
              <div className={`border-2 border-dashed ${imageUrl ? 'border-[#00ff9d]' : 'border-gray-800 hover:border-[#00ff9d]/50'} rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-40 transition-colors bg-[#161b22]`}>
                {imageUrl ? (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <button onClick={() => setImageUrl('')} className="bg-red-500/90 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl hover:bg-red-500 transition-colors">🗑️ Remover</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-3 drop-shadow-[0_0_10px_rgba(0,255,157,0.2)]">📸</div>
                    <p className="text-xs text-gray-400 font-medium">Clique para selecionar</p>
                    {uploadingImage && <p className="text-[#00ff9d] text-xs font-bold mt-3 animate-pulse">⏳ Fazendo upload...</p>}
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Call to Action</label>
                <div className="relative">
                  <select value={buttonType} onChange={e => setButtonType(e.target.value)}
                    className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00ff9d] appearance-none cursor-pointer font-medium">
                    <option value="NONE">Nenhum botão</option>
                    <option value="LEARN_MORE">🔗 Saiba Mais</option>
                    <option value="BOOK">📅 Reservar</option>
                    <option value="ORDER">🛍️ Fazer Pedido</option>
                    <option value="CALL">📞 Ligar Agora</option>
                  </select>
                </div>
              </div>
              {(buttonType !== 'NONE' && buttonType !== 'CALL') && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">URL de Destino</label>
                  <input type="url" value={buttonUrl} onChange={e => setButtonUrl(e.target.value)}
                    placeholder="https://seudominio.com.br"
                    className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-[#0d1117]/50 -mx-8 lg:-mx-10 -mb-8 lg:-mb-10 p-8 lg:p-10 rounded-b-2xl relative z-10">
          <div className="w-full md:w-auto">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Agendar? (Opcional)</label>
            <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
              className="w-full md:w-64 bg-[#161b22] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium cursor-pointer" />
          </div>
          <button onClick={handlePost} disabled={!postText}
            className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-sm transition-all shadow-lg ${postText ? (scheduledDate ? 'bg-[#ffbb00] text-gray-900 hover:bg-yellow-400 shadow-[0_0_15px_rgba(255,187,0,0.3)]' : 'bg-[#00ff9d] text-gray-900 shadow-[0_0_15px_rgba(0,255,157,0.3)]') : 'bg-[#161b22] text-gray-500 cursor-not-allowed shadow-none'}`}>
            {scheduledDate ? '🕒 Agendar no Banco de Dados' : '🚀 Publicar Imediatamente'}
          </button>
        </div>
      </div>
    </div>
  );
}
