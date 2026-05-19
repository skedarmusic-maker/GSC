'use client';

import { useState, useEffect } from 'react';
import {
  Search, Globe, Phone, Clock, Camera, Star, Tag, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, ChevronRight, Download,
  BookmarkPlus, History, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';

const iconMap: Record<string, any> = {
  star: Star, globe: Globe, phone: Phone, clock: Clock, camera: Camera, tag: Tag,
};

function ScoreCircle({ score }: { score: number }) {
  const radius = 80;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (circ * score) / 100;
  const color = score >= 70 ? '#00ff9d' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Bom' : score >= 40 ? 'Regular' : 'Crítico';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} stroke="#1f2937" strokeWidth="14" fill="transparent" />
          <circle cx="100" cy="100" r={radius} stroke={color} strokeWidth="14" fill="transparent"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 10px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-white">{score}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Saúde no Google</span>
        </div>
      </div>
      <span className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border"
        style={{ color, borderColor: `${color}40`, background: `${color}15` }}>
        {label}
      </span>
    </div>
  );
}

function HistoryCard({ analysis, onLoad, onDelete }: { analysis: any; onLoad: (a: any) => void; onDelete: (id: string) => void }) {
  const scoreColor = analysis.score >= 70 ? '#00ff9d' : analysis.score >= 40 ? '#f59e0b' : '#ef4444';
  const date = new Date(analysis.created_at).toLocaleDateString('pt-BR');

  return (
    <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-600 transition-all group">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
        style={{ background: `${scoreColor}15`, color: scoreColor, border: `1px solid ${scoreColor}30` }}>
        {analysis.score}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{analysis.business_name}</p>
        <p className="text-gray-500 text-xs truncate">{analysis.address || 'Endereço não disponível'}</p>
        <p className="text-gray-600 text-[10px] mt-0.5">{date}</p>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={() => onLoad(analysis)}
          className="text-[10px] font-bold text-[#00ff9d] bg-[#00ff9d]/10 border border-[#00ff9d]/20 px-3 py-1.5 rounded-lg hover:bg-[#00ff9d]/20 transition-all whitespace-nowrap">
          Ver
        </button>
        <button onClick={() => onDelete(analysis.id)}
          className="text-red-500 bg-red-500/10 border border-red-500/20 p-1.5 rounded-lg hover:bg-red-500/20 transition-all">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function TabProspecting() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/prospecting/save');
      const data = await res.json();
      const analyses = data.analyses || [];
      setHistory(analyses);
      if (analyses.length > 0) {
        setShowHistory(true);
      }
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setSavedMsg('');

    try {
      const res = await fetch('/api/prospecting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: businessName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) setError(data.error || 'Erro ao analisar o perfil.');
      else setReport(data);
    } catch { setError('Falha de conexão.'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!report) return;
    setSaving(true);
    try {
      const res = await fetch('/api/prospecting/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMsg('✅ Análise salva com sucesso!');
        loadHistory();
      } else {
        setSavedMsg('❌ Erro ao salvar: ' + (data.error || 'tente novamente.'));
      }
    } catch { setSavedMsg('❌ Erro de conexão ao salvar.'); }
    finally { setSaving(false); setTimeout(() => setSavedMsg(''), 4000); }
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/prospecting/save', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadHistory();
  };

  const handleLoadSaved = (analysis: any) => {
    // Reconstrói o report a partir dos dados salvos
    setReport({
      name: analysis.business_name,
      address: analysis.address,
      score: analysis.score,
      rating: analysis.rating,
      reviews: analysis.reviews,
      website: analysis.website,
      websiteStatus: analysis.website_status,
      phone: analysis.phone,
      category: analysis.category,
      metrics: analysis.metrics || [],
      competitors: analysis.competitors || [],
      opportunities: analysis.opportunities || [],
    });
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const competitorReviews = (report?.competitors || []).map((c: any) => Number(c.reviews) || 0);
  const maxReviews = Math.max(...competitorReviews, Number(report?.reviews) || 1);

  return (
    <div className="space-y-6 pb-20">

      {/* Header */}
      <div className="flex items-end justify-between print:hidden">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            🔍 Prospecção <span className="text-[#00ff9d]">GBP Check</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Analise a saúde de qualquer perfil no Google sem acesso administrativo.</p>
        </div>
        {/* Botão histórico */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-all text-xs font-bold"
        >
          <History size={14} />
          Histórico ({history.length})
          {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Histórico colapsável */}
      {showHistory && (
        <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-5 space-y-3">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Análises Salvas</p>
          {loadingHistory && <p className="text-gray-500 text-sm">Carregando...</p>}
          {!loadingHistory && history.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-6">Nenhuma análise salva ainda.</p>
          )}
          {history.map((a) => (
            <HistoryCard key={a.id} analysis={a} onLoad={handleLoadSaved} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text" value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Digite o nome da empresa ou cole o link do Google Maps..."
            className="w-full bg-[#161b22] border border-gray-800 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#00ff9d]/50 transition-all placeholder:text-gray-600"
          />
        </div>
        <button type="submit" disabled={loading}
          className="bg-[#00ff9d] text-black font-black px-7 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-sm uppercase tracking-wide whitespace-nowrap">
          {loading ? 'Analisando...' : 'Analisar'}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm animate-pulse">Buscando dados no Google Maps...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-center gap-3">
          <AlertTriangle className="text-red-400 shrink-0" size={20} />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6" id="report-content">

          {/* Print Header */}
          <div className="hidden print:flex justify-between items-center mb-8 border-b border-gray-800/50 pb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-white italic leading-none">
                GSC<span className="text-[#00ff9d]">STRATEGY</span>
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* Barra de ações */}
          <div className="flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              {report.thumbnail && (
                <img src={report.thumbnail} alt="Thumb" className="w-8 h-8 rounded-lg object-cover border border-gray-800" />
              )}
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Análise: <span className="text-white">{report.name}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-[#00ff9d]/10 border border-[#00ff9d]/30 hover:bg-[#00ff9d]/20 text-[#00ff9d] px-4 py-2 rounded-xl transition-all text-xs font-bold disabled:opacity-50">
                <BookmarkPlus size={14} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-all text-xs font-bold">
                <Download size={14} /> Baixar PDF
              </button>
            </div>
          </div>

          {/* Feedback de salvo */}
          {savedMsg && (
            <div className={`text-xs font-bold px-4 py-2 rounded-lg border ${savedMsg.startsWith('✅') ? 'bg-[#00ff9d]/10 border-[#00ff9d]/20 text-[#00ff9d]' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {savedMsg}
            </div>
          )}

          {/* Score + Info + Oportunidades */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Score */}
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden print:break-inside-avoid">
               {/* Background Glow */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#00ff9d]/5 blur-[60px] pointer-events-none" />
              
              <ScoreCircle score={report.score} />
              <div className="mt-6 w-full">
                <p className="text-white font-black text-xl leading-tight">{report.name}</p>
                {report.category && <p className="text-[#00ff9d] text-xs font-bold mt-1 uppercase tracking-wider">{report.category}</p>}
                {report.address && <p className="text-gray-500 text-xs mt-3 leading-relaxed">{report.address}</p>}
              </div>
            </div>

            {/* Dados Rápidos */}
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between gap-4 print:break-inside-avoid">
              <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest border-b border-gray-800 pb-3">Status do Perfil</h3>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
                    <Star size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Autoridade</p>
                    <p className="text-white font-black text-lg leading-none mt-1">{report.rating > 0 ? `${report.rating} ⭐` : 'S/N'} <span className="text-gray-500 font-bold text-xs ml-1">({report.reviews} reviews)</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-lg ${report.phone ? 'bg-[#00ff9d]/10 border-[#00ff9d]/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <Phone size={18} className={report.phone ? 'text-[#00ff9d]' : 'text-red-500'} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Contato</p>
                    <p className="text-white font-black text-sm mt-1">{report.phone || 'Não encontrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-lg ${report.websiteStatus === 'bom' ? 'bg-[#00ff9d]/10 border-[#00ff9d]/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <Globe size={18} className={report.websiteStatus === 'bom' ? 'text-[#00ff9d]' : 'text-red-500'} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Página Web</p>
                    <p className="text-white font-black text-sm mt-1 truncate max-w-[140px]">{report.website ? (report.websiteStatus === 'bom' ? 'Site Profissional ✓' : 'Link Social ⚠️') : 'Sem Website'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Oportunidades */}
            <div className="bg-gradient-to-br from-[#00ff9d]/10 to-transparent border border-[#00ff9d]/20 rounded-2xl p-6 flex flex-col gap-4 print:hidden">
              <h3 className="text-[#00ff9d] font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16}/> Oportunidades de Venda
              </h3>
              {report.websiteStatus === 'fraco' && report.website && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0"/>
                  <p className="text-orange-300 text-[10px] leading-relaxed font-medium">
                    O perfil usa uma <strong>rede social</strong> como site. Você pode oferecer um site profissional para aumentar a conversão.
                  </p>
                </div>
              )}
              <div className="space-y-2.5">
                {(report.opportunities || []).map((op: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#00ff9d] shrink-0" />
                    <p className="text-gray-300 text-[11px] font-bold leading-tight">{op}</p>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4 border-t border-[#00ff9d]/10">
                <p className="text-[10px] text-gray-500 font-medium">Análise baseada em parâmetros oficiais do Google Business Profile.</p>
              </div>
            </div>
          </div>

          {/* Ranking Concorrentes (Unificado e Ordenado) */}
          {report && (
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 print:break-inside-avoid">
              <div className="flex items-center justify-between mb-6 border-b border-gray-800/50 pb-4">
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">Ranking de Avaliações</h3>
                  <p className="text-gray-500 text-[10px] uppercase font-bold mt-1">Posicionamento de Prova Social Local</p>
                </div>
              </div>
              
              <div className="space-y-5">
                {[
                  { name: report.name, reviews: Number(report.reviews) || 0, isClient: true },
                  ...(report.competitors || []).map((c: any) => ({ name: c.name, reviews: Number(c.reviews) || 0, isClient: false }))
                ].sort((a, b) => b.reviews - a.reviews).map((profile, index, arr) => {
                  const maxListReviews = arr[0]?.reviews || 1;
                  const barWidth = Math.max((profile.reviews / maxListReviews) * 100, 1.5);
                  
                  return (
                    <div key={index} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${profile.isClient ? 'bg-[#00ff9d] text-black shadow-[0_0_10px_rgba(0,255,157,0.3)]' : 'bg-gray-800 text-gray-400'}`}>
                            {index + 1}º
                          </div>
                          <p className={`font-bold text-sm truncate max-w-[200px] md:max-w-[400px] ${profile.isClient ? 'text-[#00ff9d]' : 'text-gray-300'}`}>
                            {profile.name} {profile.isClient && <span className="text-[10px] uppercase tracking-wider ml-1 opacity-80">(Você)</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-sm leading-none ${profile.isClient ? 'text-[#00ff9d]' : 'text-white'}`}>{profile.reviews}</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Avaliações</p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-gray-800">
                        <div className={`h-full rounded-full transition-all duration-1000 ${profile.isClient ? 'bg-[#00ff9d]' : 'bg-[#007aff]/80'}`}
                          style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mapa de Localização (Simples iframe) */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 mt-6 break-inside-avoid">
             <div className="flex items-center justify-between mb-6 border-b border-gray-800/50 pb-4">
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">Mapa de Localização</h3>
                  <p className="text-gray-500 text-[10px] uppercase font-bold mt-1">Região de Busca Local</p>
                </div>
             </div>
             <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-800 relative bg-[#0d1117] flex items-center justify-center">
               <iframe 
                 width="100%" 
                 height="100%" 
                 style={{ border: 0 }}
                 loading="lazy" 
                 allowFullScreen 
                 src={`https://maps.google.com/maps?q=${encodeURIComponent(report.name + ' ' + (report.address || ''))}&t=m&z=14&output=embed&iwloc=near`}
               ></iframe>
             </div>
          </div>

          {/* Análise Detalhada */}
          <div className="pt-8">
            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest border-b border-gray-800 pb-3 mb-6">Detalhamento dos Fatores de Ranqueamento</h3>
            
            <div className="flex flex-col gap-6">
              {(report.metrics || []).map((m: any, i: number) => {
                const isGood = m.status === 'bom';
                const isWarning = m.status === 'razoável';
                const isBad = m.status === 'fraco';
                
                const descriptions: Record<string, string> = {
                  'Nota Média': 'A nota média e a frequência de avaliações são o principal fator de decisão para clientes locais e influenciam fortemente o algoritmo do Google. Notas baixas resultam em perda drástica de novos clientes e piora no posicionamento orgânico.',
                  'Avaliações - Quantidade': 'Analisa se possui uma quantidade mínima de validação social. Ter poucas avaliações afasta clientes que buscam segurança antes de comprar. Uma meta primária saudável é ultrapassar 50 avaliações para dominar a credibilidade na região.',
                  'Avaliações - Amostragem de Respostas': 'Os clientes investiram tempo avaliando sua empresa. Ignorar comentários mostra descaso e afeta negativamente o algoritmo do Google, que prioriza perfis engajados. Avaliações sem resposta deixam dinheiro na mesa e prejudicam o SEO Local.',
                  'Website': 'O Google prioriza negócios com sites próprios estruturados (SEO). Utilizar redes sociais (Instagram/Facebook) ou árvores de links (Linktree) como website principal prejudica severamente sua autoridade e credibilidade nas buscas locais.',
                  'Telefone': 'A ausência ou erro no número de contato impede ações rápidas de clientes (como o botão "clique para ligar"), resultando em perda imediata de vendas diárias e piora na experiência geral do usuário.',
                  'Horário de Funcionamento': 'Perfis sem horário atualizado geram enorme frustração em clientes que podem visitar o local fechado. O Google penaliza diretamente o ranqueamento de empresas com informações operacionais inconsistentes.',
                  'Fotos / Mídia': 'Fotos de alta qualidade atraem até 35% mais cliques no site e 42% mais rotas de direção. Perfis sem fotos atualizadas pelo proprietário passam a forte impressão de um negócio inativo, fechado ou amador.',
                  'Categoria / Segmento': 'A escolha exata das categorias define se você aparecerá para os termos de busca com intenção de compra na sua região. Categorias genéricas ou incorretas anulam quase todo o seu potencial de alcance no Google Maps.',
                  'Descrição da Empresa': 'A descrição é uma oportunidade essencial de contar o que torna o negócio único, além de ser um espaço vital para inserir palavras-chave. Perfis sem descrição rica perdem enorme relevância no ranqueamento orgânico local.',
                  'Quantidade Total de Mídia': 'Fotos e mídias publicadas pelo proprietário revelam o compromisso ativo com o negócio e aumentam a atratividade do perfil. Perfis sem imagens novas ou com pouquíssimas fotos passam a forte impressão de estarem abandonados ou inativos.',
                  'Ficha Verificada': 'Fichas que não são reivindicadas ou verificadas correm sério risco de sofrerem alterações de terceiros mal-intencionados ou de serem bloqueadas repentinamente pelo Google. A verificação oficial garante o controle absoluto sobre o perfil comercial.',
                  'Perguntas e Respostas (Q&A)': 'O campo de Perguntas e Respostas é uma seção pública do perfil onde qualquer pessoa pode fazer perguntas sobre a empresa. Deixar dúvidas sem resposta profissional confunde potenciais clientes e afeta negativamente a imagem do negócio, além de desperdiçar um canal de atração direta.'
                };
                const desc = descriptions[m.label] || 'Análise paramétrica baseada nos fatores de ranqueamento oficial do Google Business Profile.';

                return (
                  <div key={i} className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 print:break-inside-avoid">
                    <div className="flex flex-col md:flex-row items-start gap-5">
                      <div className={`p-4 rounded-xl shrink-0 ${isGood ? 'bg-[#00ff9d]/10' : isWarning ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                        {isGood ? <CheckCircle size={28} className="text-[#00ff9d]"/>
                          : isWarning ? <AlertTriangle size={28} className="text-yellow-500"/>
                          : <XCircle size={28} className="text-red-500"/>}
                      </div>
                      
                      <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                           <h4 className="text-white font-black text-lg flex items-center gap-2">
                              {m.label}
                           </h4>
                        </div>
                        
                        <p className="text-gray-400 text-sm leading-relaxed mb-5 pr-4">
                           {desc}
                        </p>
                        
                        <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-3 inline-block mb-6">
                           <p className="text-gray-300 text-xs font-bold uppercase tracking-wider">
                              Diagnóstico: <span className={`ml-1 ${isGood ? 'text-[#00ff9d]' : isWarning ? 'text-yellow-500' : 'text-red-500'}`}>{m.value}</span>
                           </p>
                        </div>
                        
                        {/* Progress Bar (Fraco/Razoável/Bom) */}
                        <div className="w-full max-w-md relative">
                           {/* Arrow indicator */}
                           <div className="absolute -top-3 w-3 h-3 bg-gray-400 rotate-45 z-10 transition-all duration-1000" 
                                style={{ left: isBad ? '16%' : isWarning ? '50%' : '84%', marginLeft: '-6px' }} />
                                
                           <div className="flex h-2.5 rounded-full overflow-hidden w-full bg-gray-900 border border-gray-800">
                              <div className="w-1/3 h-full bg-red-500/80" />
                              <div className="w-1/3 h-full bg-yellow-400/80" />
                              <div className="w-1/3 h-full bg-[#00ff9d]/80" />
                           </div>
                           <div className="flex justify-between w-full mt-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
                              <span className="w-1/3 text-center">Fraco</span>
                              <span className="w-1/3 text-center">Razoável</span>
                              <span className="w-1/3 text-center">Bom</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
