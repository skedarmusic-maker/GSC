'use client';

import { useState } from 'react';

interface Props {
  postText: string;
  imageUrl: string;
  uploadingImage: boolean;
  buttonType: string;
  buttonUrl: string;
  scheduledDate: string;
  generatingAIPost?: boolean;
  gbpTitle?: string;
  setPostText: (v: string) => void;
  setImageUrl: (v: string) => void;
  setButtonType: (v: string) => void;
  setButtonUrl: (v: string) => void;
  setScheduledDate: (v: string) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePost: () => void;
  handleGenerateAIPost?: (topic: string) => void;
  scheduledPosts?: any[];
  handleDeleteScheduledPost?: (id: string) => void;
  editingPostId?: string | null;
  handleEditScheduledPost?: (post: any) => void;
  cancelEdit?: () => void;
}

export default function TabGBPPosts({
  postText, imageUrl, uploadingImage, buttonType, buttonUrl, scheduledDate,
  generatingAIPost, gbpTitle, scheduledPosts, editingPostId,
  setPostText, setImageUrl, setButtonType, setButtonUrl, setScheduledDate,
  handleImageUpload, handlePost, handleGenerateAIPost, handleDeleteScheduledPost,
  handleEditScheduledPost, cancelEdit
}: Props) {
  const [aiPrompt, setAiPrompt] = useState('');

  const getTopics = () => {
    const title = (gbpTitle || '').toLowerCase();
    if (title.includes('amor & patas') || title.includes('pet shop')) return ['Banho e Tosa', 'Saúde Animal', 'Acessórios Pet', 'Curiosidades Pet'];
    if (title.includes('chaveiro urgente') || title.includes('chaveiro')) return ['Emergências 24h', 'Chaves Codificadas', 'Dicas de Segurança', 'Fechaduras Digitais'];
    if (title.includes('pagani') || title.includes('moto')) return ['Revisão Geral', 'Customização', 'Acessórios Moto', 'Dicas de Pilotagem'];
    if (title.includes('simone') || title.includes('podologia')) return ['Tratamento de Calos', 'Unha Encravada', 'Saúde dos Pés', 'Prevenção'];
    if (title.includes('soft english') || title.includes('inglês')) return ['Dicas de Pronúncia', 'Inglês para Negócios', 'Aulas de Conversação', 'Expressões Úteis'];
    
    // Fallback/Default
    return ['Nossos Serviços', 'Novidades', 'Promoções Imperdíveis', 'Dicas Rápidas'];
  };

  const topics = getTopics();

  const getMinDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const getMaxDateTime = () => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const offset = lastDayOfMonth.getTimezoneOffset() * 60000;
    return new Date(lastDayOfMonth.getTime() - offset).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <h2 className="text-2xl font-bold mb-2">📣 Atualizações da Empresa (Posts)</h2>
      <p className="text-gray-400 mb-8">Crie atualizações para manter o perfil ativo no Google.</p>
      <div className="glass-card rounded-2xl p-8 lg:p-10 shadow-[0_0_30px_rgba(0,255,157,0.05)] border-[#00ff9d]/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff9d] to-transparent opacity-50"></div>
        <div className="space-y-8 relative z-10">
          
          {editingPostId && (
            <div className="bg-[#ffbb00]/10 border border-[#ffbb00]/30 rounded-xl p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-sm">📝</span>
                <span className="text-xs font-bold text-[#ffbb00]">Editando agendamento ativo...</span>
              </div>
              <button 
                onClick={cancelEdit}
                className="text-[10px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-colors font-bold uppercase tracking-wider"
              >
                Cancelar Edição
              </button>
            </div>
          )}

          {/* Gerador de IA Section */}
          <div className="bg-[#11161d] rounded-xl p-6 border border-gray-800 shadow-inner">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
              <label className="block text-[10px] font-bold text-[#00ff9d] uppercase tracking-widest flex items-center gap-2">
                <span className="text-sm">✨</span> Gerador de Postagens por IA
              </label>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2 font-medium">Tópicos Sugeridos para o seu perfil:</p>
              <div className="flex flex-wrap gap-2">
                {topics.map(topic => (
                  <button 
                    key={topic} 
                    onClick={() => handleGenerateAIPost && handleGenerateAIPost(topic)}
                    disabled={generatingAIPost}
                    className="px-3 py-1.5 bg-[#161b22] hover:bg-[#00ff9d]/10 border border-gray-800 hover:border-[#00ff9d]/50 text-gray-300 hover:text-[#00ff9d] rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={aiPrompt} 
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ou digite uma palavra ou ideia (ex: promoção de feriado)"
                className="flex-1 bg-[#161b22] border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium"
              />
              <button 
                onClick={() => handleGenerateAIPost && aiPrompt && handleGenerateAIPost(aiPrompt)}
                disabled={generatingAIPost || !aiPrompt}
                className="bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/30 px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generatingAIPost ? <span className="animate-pulse">⏳ Gerando...</span> : 'Gerar Texto'}
              </button>
            </div>
          </div>

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
              min={getMinDateTime()} max={getMaxDateTime()}
              className="w-full md:w-64 bg-[#161b22] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium cursor-pointer" />
          </div>
          <button onClick={handlePost} disabled={!postText}
            className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-sm transition-all shadow-lg ${postText ? (editingPostId ? 'bg-[#ffbb00] text-gray-900 hover:bg-yellow-400 shadow-[0_0_15px_rgba(255,187,0,0.3)]' : scheduledDate ? 'bg-[#ffbb00] text-gray-900 hover:bg-yellow-400 shadow-[0_0_15px_rgba(255,187,0,0.3)]' : 'bg-[#00ff9d] text-gray-900 shadow-[0_0_15px_rgba(0,255,157,0.3)]') : 'bg-[#161b22] text-gray-500 cursor-not-allowed shadow-none'}`}>
            {editingPostId ? '💾 Salvar Alterações no Banco' : scheduledDate ? '🕒 Agendar no Banco de Dados' : '🚀 Publicar Imediatamente'}
          </button>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {scheduledPosts && scheduledPosts.length > 0 && (
        <div className="mt-12 space-y-4 animate-fade-in">
          <h3 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2">🗓️ Postagens Agendadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledPosts.map((post: any) => (
              <div key={post.id} className="bg-[#11161d] border border-gray-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#ffbb00]"></div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-900 bg-[#ffbb00] px-2 py-1 rounded-md uppercase tracking-wider">Aguardando</span>
                    <span className="text-xs text-gray-400 font-bold bg-[#161b22] px-2 py-1 rounded-md border border-gray-800">
                      {new Date(post.scheduled_for).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-4 leading-relaxed font-medium">{post.content}</p>
                </div>
                {post.image_url && (
                  <div className="h-32 w-full bg-cover bg-center rounded-lg mb-4 border border-gray-800 shadow-inner" style={{ backgroundImage: `url(${post.image_url})` }}></div>
                )}
                <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-800">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">
                    CTA: {post.button_type === 'NONE' ? 'Nenhum' : post.button_type}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditScheduledPost && handleEditScheduledPost(post)}
                      className="text-xs text-[#ffbb00] hover:text-[#ffbb00]/80 font-bold px-3 py-1.5 bg-[#ffbb00]/10 hover:bg-[#ffbb00]/20 rounded-lg transition-colors border border-[#ffbb00]/20"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteScheduledPost && handleDeleteScheduledPost(post.id)}
                      className="text-xs text-red-500 hover:text-red-400 font-bold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
