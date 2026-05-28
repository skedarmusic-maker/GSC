'use client';

import { useState, useEffect } from 'react';
import {
  Search, Globe, Phone, Clock, Camera, Star, Tag, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, ChevronRight, Download,
  BookmarkPlus, History, Trash2, ChevronDown, ChevronUp,
  Sparkles, MessageSquare, Plus, Eye, Filter, Clipboard, Check
} from 'lucide-react';

const FOCUS_DEFAULT_MSG = `👋 Olá, [NOME_EMPRESA]! Tudo joia?

Você sabia que o perfil no Google da sua empresa pode estar te fazendo perder clientes todos os dias?

Eu faço otimização de perfis no Google e ofereço um relatório gratuito mostrando como sua empresa aparece hoje e o que pode ser melhorado para atrair mais clientes da sua região.

Aqui esta um relatório previo de como esta a saude da sua empresa no google e uma analise de ranking que mostra a sua posição em comparação com seus concorrentes.

pode conferir o PDF e fico a disposição para conversar e te ajudar a conseguir mais clientes e não perder dinheiro para seus concocrrentes. 👍`;

const getFormattedFocusMsg = (businessName: string) => {
  return FOCUS_DEFAULT_MSG.replace('[NOME_EMPRESA]', (businessName || '').toUpperCase());
};

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

// ─── HELPER: lê do localStorage de forma segura ───────────────────────────
function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function TabProspecting() {
  // ─── ESTADOS COM INICIALIZAÇÃO LAZY (lê localStorage de forma SÍNCRONA) ───
  // Isso garante que os dados estejam presentes desde o primeiro render,
  // evitando a race condition entre o useEffect de leitura e o de escrita.
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'batch'>(
    () => readLS<'individual' | 'batch'>('gsc_prospect_subtab', 'batch')
  );

  // Single analysis states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [report, setReport] = useState<any>(
    () => readLS<any>('gsc_prospect_report', null)
  );
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Batch analysis states
  const [niche, setNiche] = useState(
    () => readLS<string>('gsc_prospect_niche', '')
  );
  const [location, setLocation] = useState(
    () => readLS<string>('gsc_prospect_loc', '')
  );
  const [minRating, setMinRating] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);
  const [filterNoPhone, setFilterNoPhone] = useState(false);

  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>(
    () => readLS<any[]>('gsc_prospect_leads', [])
  );
  const [aiRecs, setAiRecs] = useState<any>(
    () => readLS<any>('gsc_prospect_recs', { topLeads: [], whatsappMessages: {} })
  );
  const [importingLeadId, setImportingLeadId] = useState<string | null>(null);
  const [importedLeads, setImportedLeads] = useState<Record<string, boolean>>({});

  // Novos estados para a experiência de conversão HSL
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [isBlurMode, setIsBlurMode] = useState(false);
  const [loadingDiagnostico, setLoadingDiagnostico] = useState<Record<string, boolean>>({});

  // Flag para evitar que o useEffect de escrita apague dados durante a
  // hidratação inicial (primeiro render do componente)
  const [hydrated, setHydrated] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/prospecting/save');
      const data = await res.json();
      const analyses = data.analyses || [];
      setHistory(analyses);
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // Marca que o componente já foi hidratado (dados do localStorage já estão
    // nos estados). A partir daqui, os useEffects de escrita podem salvar dados.
    setHydrated(true);
  }, []);

  // ─── PERSISTÊNCIA AUTOMÁTICA EM LOCALSTORAGE ─────────────────────────────
  // Só grava após a hidratação para evitar apagar dados válidos com
  // estados vazios durante o primeiro render.
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (leads.length > 0) {
        localStorage.setItem('gsc_prospect_leads', JSON.stringify(leads));
      } else {
        localStorage.removeItem('gsc_prospect_leads');
      }
    } catch (e) {}
  }, [leads, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (aiRecs && (aiRecs.topLeads?.length > 0 || Object.keys(aiRecs.whatsappMessages || {}).length > 0)) {
        localStorage.setItem('gsc_prospect_recs', JSON.stringify(aiRecs));
      } else {
        localStorage.removeItem('gsc_prospect_recs');
      }
    } catch (e) {}
  }, [aiRecs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (report) {
        localStorage.setItem('gsc_prospect_report', JSON.stringify(report));
      } else {
        localStorage.removeItem('gsc_prospect_report');
      }
    } catch (e) {}
  }, [report, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('gsc_prospect_subtab', activeSubTab);
    } catch (e) {}
  }, [activeSubTab, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('gsc_prospect_niche', niche);
    } catch (e) {}
  }, [niche, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('gsc_prospect_loc', location);
    } catch (e) {}
  }, [location, hydrated]);

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

  const handleBatchSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim() || !location.trim()) return;
    setBatchLoading(true);
    setBatchError(null);
    setLeads([]);
    setAiRecs({ topLeads: [], whatsappMessages: {} });

    try {
      const res = await fetch('/api/prospecting/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: niche.trim(),
          location: location.trim(),
          minRating,
          limit,
          filterNoWebsite,
          filterNoPhone
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setBatchError(data.error || 'Nenhum lead encontrado com estes filtros.');
      } else {
        setLeads(data.leads || []);
        setAiRecs(data.aiRecommendations || { topLeads: [], whatsappMessages: {} });
      }
    } catch (err) {
      setBatchError('Falha na comunicação com o servidor de busca.');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleImportClient = async (lead: any) => {
    setImportingLeadId(lead.id);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          website_url: lead.website,
          phone: lead.phone,
          category: lead.category,
          opportunities: lead.opportunities
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportedLeads(prev => ({ ...prev, [lead.id]: true }));
        // Dispara evento global para atualizar o seletor principal de clientes em page.tsx
        window.dispatchEvent(new Event('refresh-clients'));
      } else {
        alert('Erro ao importar cliente: ' + (data.error || 'tente novamente.'));
      }
    } catch (err) {
      alert('Erro de conexão ao cadastrar cliente.');
    } finally {
      setImportingLeadId(null);
    }
  };

  const handleGenerateDemandReport = async (lead: any, autoBlur = false) => {
    setLoadingDiagnostico(prev => ({ ...prev, [lead.id]: true }));
    setError(null);

    // Concorrentes do batch sempre disponíveis como fallback confiável
    const batchCompetitors = leads
      .filter((l) => l.name.toLowerCase() !== lead.name.toLowerCase())
      .map((l) => ({
        name: l.name,
        rating: Number(l.rating) || 0,
        reviews: Number(l.reviews) || 0,
      }))
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 5);

    try {
      const searchQuery = lead.address ? `${lead.name}, ${lead.address}` : lead.name;
      const res = await fetch('/api/prospecting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: searchQuery }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao gerar o diagnóstico.');
      }

      // Salva mensagens de IA sob demanda para uso em WhatsApp/Copiar
      if (data.aiRecommendation) {
        setAiRecs((prev: any) => ({
          ...prev,
          whatsappMessages: { ...prev.whatsappMessages, [lead.name]: data.aiRecommendation }
        }));
      }

      // ─── FONTE DE VERDADE: dados do batch são invioláveis ─────────────────────
      // A API individual pode retornar outro estabelecimento homônimo.
      // Usamos APENAS métricas extras + aiRecommendation da API — nunca nome/score/website/phone.
      const fixedMetrics = (data.metrics || []).map((m: any) => {
        // Corrige a métrica de Website para sempre refletir o lead real
        if (m.label === 'Website') {
          const ws = lead.websiteStatus;
          return {
            ...m,
            status: ws,
            value: ws === 'bom' ? 'Site próprio ✓'
                 : lead.website ? `Rede social como site ⚠️`
                 : 'Não encontrado',
            detail: lead.website || '',
          };
        }
        return m;
      });

      setReport({
        ...lead,                                          // dados confiáveis do batch
        opportunities: data.opportunities || lead.opportunities,
        metrics: fixedMetrics,
        competitors: data.competitors?.length > 0 ? data.competitors : batchCompetitors,
        aiRecommendation: data.aiRecommendation,
      });

      setIsBlurMode(autoBlur);
      setActiveSubTab('individual');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
      // Fallback silencioso: usa dados locais do batch (100% confiável)
      handleLoadLeadToReport(lead, batchCompetitors);
      setIsBlurMode(autoBlur);
    } finally {
      setLoadingDiagnostico(prev => ({ ...prev, [lead.id]: false }));
    }
  };

  const handleLoadLeadToReport = (lead: any, preComputedCompetitors?: any[]) => {
    // Mapeamento dinâmico local de métricas para visualização detalhada e download imediato de PDF
    const metrics = [
      {
        label: 'Nota Média',
        status: lead.rating >= 4.5 ? 'bom' : lead.rating >= 3.8 ? 'razoável' : 'fraco',
        value: lead.rating > 0 ? `${lead.rating} ⭐` : 'Sem avaliações'
      },
      {
        label: 'Avaliações - Quantidade',
        status: lead.reviews >= 100 ? 'bom' : lead.reviews >= 30 ? 'razoável' : 'fraco',
        value: `${lead.reviews} avaliações`
      },
      {
        label: 'Website',
        status: lead.websiteStatus === 'bom' ? 'bom' : lead.websiteStatus === 'razoável' ? 'razoável' : 'fraco',
        value: lead.websiteStatus === 'bom' ? 'Site próprio ✓' : lead.website ? 'Rede social ⚠️' : 'Sem website'
      },
      {
        label: 'Telefone',
        status: lead.phone ? 'bom' : 'fraco',
        value: lead.phone || 'Não encontrado'
      },
      {
        label: 'Horário de Funcionamento',
        status: lead.hours ? 'bom' : 'fraco',
        value: lead.hours ? 'Cadastrado ✓' : 'Não informado'
      },
      {
        label: 'Fotos / Mídia',
        status: lead.thumbnail ? 'bom' : 'fraco',
        value: lead.thumbnail ? 'Imagens presentes ✓' : 'Sem fotos'
      },
      {
        label: 'Descrição da Empresa',
        status: lead.hasDescription ? 'bom' : 'fraco',
        value: lead.hasDescription ? 'Descrição rica ✓' : 'Sem descrição ativa'
      }
    ];

    // Usa concorrentes pré-computados ou calcula a partir do lote atual
    const competitors = preComputedCompetitors ?? leads
      .filter((l) => l.name.toLowerCase() !== lead.name.toLowerCase())
      .map((l) => ({
        name: l.name,
        rating: Number(l.rating) || 0,
        reviews: Number(l.reviews) || 0,
      }))
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 5);

    setReport({
      ...lead,
      metrics,
      competitors: competitors.length > 0 ? competitors : (lead.competitors || [])
    });

    setActiveSubTab('individual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyCommercialMsg = (lead: any, whatsappMsg: any) => {
    let msg = '';
    if (whatsappMsg && typeof whatsappMsg === 'object') {
      msg = whatsappMsg.impact || whatsappMsg.quick || '';
    } else {
      msg = whatsappMsg || '';
    }

    if (!msg) {
      msg = `Olá! Realizei uma análise técnica na ficha do Google de "${lead.name}" e encontrei falhas que prejudicam sua visibilidade e fazem vocês perderem clientes. Gostaria de te enviar o diagnóstico gratuito de saúde para podermos ajustar isso?`;
    }

    navigator.clipboard.writeText(msg);
    setCopiedLeadId(lead.id);
    setTimeout(() => setCopiedLeadId(null), 3000);
  };

  const handlePrintWithBlur = () => {
    setIsBlurMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsBlurMode(false);
      }, 3000);
    }, 600);
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
    setActiveSubTab('individual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getWhatsAppLink = (phone: string, msg: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return '';
    if (cleanPhone.length <= 11 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-6 pb-20">

      {/* Header do Sistema */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden border-b border-gray-800 pb-5">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
            🔍 Radar de <span className="text-[#00ff9d]">Prospecção GBP</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1 uppercase tracking-wide">Busca e análise automatizada de perfis locais com inteligência competitiva e comercial.</p>
        </div>

        {/* Sub-abas de Navegação premium */}
        <div className="flex bg-[#161b22] border border-gray-800 p-1.5 rounded-xl shrink-0">
          <button
            onClick={() => setActiveSubTab('batch')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'batch' ? 'bg-[#00ff9d] text-black shadow-[0_0_10px_rgba(0,255,157,0.25)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            Prospecção em Lote (IA)
          </button>
          <button
            onClick={() => setActiveSubTab('individual')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'individual' ? 'bg-[#00ff9d] text-black shadow-[0_0_10px_rgba(0,255,157,0.25)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search size={14} />
            Auditoria Individual
          </button>
        </div>
      </div>

      {/* RENDERIZAÇÃO DA SUB-ABA 1: PROSPECÇÃO EM LOTE */}
      {activeSubTab === 'batch' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Formulário de Busca e Filtros */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00ff9d]/5 blur-[60px] pointer-events-none" />
            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={16} className="text-[#00ff9d]" /> Configurar Filtros e Localização
            </h3>

            <form onSubmit={handleBatchSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Nicho */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Nicho de Busca</label>
                  <input
                    type="text"
                    required
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Ex: Petshop, Odontologia..."
                    className="bg-[#0d1117] border border-gray-800 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00ff9d]/50 transition-all"
                  />
                </div>

                {/* Localização */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Cidade / Região</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Belo Horizonte, Centro..."
                    className="bg-[#0d1117] border border-gray-800 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00ff9d]/50 transition-all"
                  />
                </div>

                {/* Avaliação Mínima */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Nota Mínima do Google</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="bg-[#0d1117] border border-gray-800 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00ff9d]/50 transition-all"
                  >
                    <option value={0}>Todas as Notas</option>
                    <option value={3.0}>3.0 ⭐ ou mais</option>
                    <option value={3.5}>3.5 ⭐ ou mais</option>
                    <option value={4.0}>4.0 ⭐ ou mais</option>
                    <option value={4.5}>4.5 ⭐ ou mais</option>
                  </select>
                </div>

                {/* Limite de Leads */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Limite de Resultados</label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="bg-[#0d1117] border border-gray-800 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00ff9d]/50 transition-all"
                  >
                    <option value={5}>5 Leads</option>
                    <option value={10}>10 Leads (Recomendado)</option>
                    <option value={15}>15 Leads</option>
                  </select>
                </div>
              </div>

              {/* Filtros Binários adicionais e botão */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-gray-800/80 pt-5">
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-300 font-bold hover:text-white">
                    <input
                      type="checkbox"
                      checked={filterNoWebsite}
                      onChange={(e) => setFilterNoWebsite(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#0d1117] border-gray-800 accent-[#00ff9d] text-black focus:ring-0 cursor-pointer"
                    />
                    Apenas sem Website próprio
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-300 font-bold hover:text-white">
                    <input
                      type="checkbox"
                      checked={filterNoPhone}
                      onChange={(e) => setFilterNoPhone(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#0d1117] border-gray-800 accent-[#00ff9d] text-black focus:ring-0 cursor-pointer"
                    />
                    Apenas sem Telefone cadastrado
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[9px] text-gray-500 font-bold uppercase max-w-[200px] leading-tight text-right hidden lg:block">
                    ⚠️ Limite padrão de 10 leads ativo para otimizar suas chamadas de APIs do Google Maps.
                  </span>
                  {leads.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Deseja realmente limpar toda a pesquisa atual e começar do zero?')) {
                          setLeads([]);
                          setAiRecs({ topLeads: [], whatsappMessages: {} });
                          setReport(null);
                          setNiche('');
                          setLocation('');
                          try {
                            localStorage.removeItem('gsc_prospect_leads');
                            localStorage.removeItem('gsc_prospect_recs');
                            localStorage.removeItem('gsc_prospect_report');
                            localStorage.removeItem('gsc_prospect_subtab');
                            localStorage.removeItem('gsc_prospect_niche');
                            localStorage.removeItem('gsc_prospect_loc');
                          } catch (e) {}
                        }
                      }}
                      className="px-4 py-3 bg-[#0d1117] hover:bg-rose-500/10 border border-gray-800 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 font-bold rounded-xl text-xs uppercase transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Trash2 size={14} />
                      <span>Limpar</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={batchLoading}
                    className="bg-[#00ff9d] hover:bg-[#02e08a] text-black font-black py-3 px-8 rounded-xl transition-all disabled:opacity-50 text-xs uppercase tracking-widest whitespace-nowrap shadow-[0_0_15px_rgba(0,255,157,0.2)]"
                  >
                    {batchLoading ? 'Buscando Radar...' : 'Disparar Radar (IA)'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Loading Radar */}
          {batchLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 border-4 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest animate-pulse">
                Localizando negócios e avaliando parâmetros com o Gemini 2.5...
              </p>
              <span className="text-[10px] text-gray-600 font-bold">Isso pode levar de 10 a 20 segundos dependendo das APIs.</span>
            </div>
          )}

          {/* Erro Radar */}
          {batchError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-center gap-3">
              <AlertTriangle className="text-red-400 shrink-0" size={20} />
              <p className="text-red-300 text-xs font-bold uppercase">{batchError}</p>
            </div>
          )}

          {/* RESULTADOS DA PROSPECÇÃO EM LOTE */}
          {leads.length > 0 && !batchLoading && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* TOP LEADS QUENTES (RECOMENDAÇÃO INTELIGENTE GEMINI) */}
              {aiRecs.topLeads && aiRecs.topLeads.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-yellow-500 animate-pulse" size={20} />
                    <h3 className="text-white font-black text-sm uppercase tracking-widest">
                      Top 3 Leads Quentes <span className="text-yellow-500">(Recomendados pela IA)</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aiRecs.topLeads.map((item: any, idx: number) => {
                      // Busca o lead correspondente na lista para herdar os dados
                      const matchedLead = leads.find(l => l.name.toLowerCase() === item.name.toLowerCase()) || {};
                      const whatsappMsg = aiRecs.whatsappMessages[item.name] || '';

                      return (
                        <div
                          key={idx}
                          className="bg-gradient-to-b from-[#1c212b] to-[#12161f] border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between gap-5 group hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all"
                        >
                          <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-xl shadow-md">
                            ★ HOT LEAD #{idx + 1}
                          </div>

                          <div className="space-y-3">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{matchedLead.category || niche}</span>
                            <h4 className="text-white font-black text-base line-clamp-1">{item.name}</h4>
                            <p className="text-yellow-300/80 text-[11px] leading-relaxed font-bold bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3">
                              {item.why}
                            </p>
                            <p className="text-gray-400 text-xs leading-relaxed italic">
                              &ldquo;{item.strategy}&rdquo;
                            </p>
                          </div>

                          {/* Seção inferior com ações rápidas para o lead quente */}
                          <div className="border-t border-gray-800 pt-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                              <span>GBP Score:</span>
                              <span style={{ color: matchedLead.score >= 70 ? '#00ff9d' : matchedLead.score >= 40 ? '#f59e0b' : '#ef4444' }} className="font-black">
                                {matchedLead.score || 0}/100
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {/* Auditar completo */}
                              <button
                                onClick={() => handleGenerateDemandReport(matchedLead, false)}
                                disabled={loadingDiagnostico[matchedLead.id]}
                                title="Fazer auditoria completa"
                                className="flex-1 bg-[#161b22] border border-gray-800 hover:border-gray-700 text-white disabled:opacity-50 p-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-black uppercase transition-all"
                              >
                                {loadingDiagnostico[matchedLead.id] ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Eye size={12} />
                                )}
                                {loadingDiagnostico[matchedLead.id] ? 'Analisando...' : 'Diagnóstico'}
                              </button>

                              {/* Vender (Blur) */}
                              <button
                                onClick={() => handleGenerateDemandReport(matchedLead, true)}
                                disabled={loadingDiagnostico[matchedLead.id]}
                                className="flex-1 bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 text-green-400 font-black p-2 rounded-lg text-[10px] uppercase flex items-center justify-center gap-1 transition-all"
                              >
                                {loadingDiagnostico[matchedLead.id] ? (
                                  <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <MessageSquare size={12} />
                                )}
                                {loadingDiagnostico[matchedLead.id] ? 'Carregando...' : 'Vender (Blur)'}
                              </button>

                              {/* Importar */}
                              <button
                                onClick={() => handleImportClient(matchedLead)}
                                disabled={importedLeads[matchedLead.id] || importingLeadId === matchedLead.id}
                                className={`p-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-black uppercase transition-all shrink-0 ${
                                  importedLeads[matchedLead.id]
                                    ? 'bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/30'
                                    : 'bg-[#00ff9d] hover:bg-[#02e08a] text-black disabled:opacity-50'
                                }`}
                              >
                                {importingLeadId === matchedLead.id ? '...' : importedLeads[matchedLead.id] ? 'OK ✓' : <Plus size={12} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LISTAGEM GERAL DE LEADS PROSPECTADOS */}
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-white font-black text-sm uppercase tracking-widest">Leads Prospectados ({leads.length})</h3>
                    <p className="text-gray-500 text-[10px] uppercase font-bold mt-1">Clique nas ações para vender ou cadastrar como cliente.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-500 font-black bg-[#0d1117]/50">
                        <th className="py-4 px-6">Empresa / Ficha</th>
                        <th className="py-4 px-6 text-center">Score GBP</th>
                        <th className="py-4 px-6">Autoridade</th>
                        <th className="py-4 px-6">Oportunidades GBP</th>
                        <th className="py-4 px-6 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {leads.map((lead) => {
                        const whatsappMsg = aiRecs.whatsappMessages[lead.name] || '';
                        
                        return (
                          <tr key={lead.id} className="hover:bg-[#12161f]/50 transition-all group">
                            {/* Nome e Categorias */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {lead.thumbnail ? (
                                  <img src={lead.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-800" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-gray-600 font-bold text-xs uppercase">
                                    G
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-white font-black text-sm truncate max-w-[240px]">{lead.name}</p>
                                  <p className="text-gray-500 text-xs truncate max-w-[240px]">{lead.address}</p>
                                </div>
                              </div>
                            </td>

                            {/* Score circular resumido */}
                            <td className="py-4 px-6 text-center">
                              <span
                                style={{
                                  color: lead.score >= 70 ? '#00ff9d' : lead.score >= 40 ? '#f59e0b' : '#ef4444',
                                  borderColor: lead.score >= 70 ? '#00ff9d25' : lead.score >= 40 ? '#f59e0b25' : '#ef444425',
                                  background: lead.score >= 70 ? '#00ff9d10' : lead.score >= 40 ? '#f59e0b10' : '#ef444410'
                                }}
                                className="px-3 py-1.5 rounded-lg border font-black text-xs inline-block shadow-sm"
                              >
                                {lead.score}/100
                              </span>
                            </td>

                            {/* Avaliações */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col justify-center">
                                <span className="text-white font-black text-xs flex items-center gap-1">
                                  {lead.rating > 0 ? `${lead.rating} ⭐` : 'S/N'}
                                </span>
                                <span className="text-gray-500 text-[10px] uppercase font-bold mt-0.5">({lead.reviews} avaliações)</span>
                              </div>
                            </td>

                            {/* Badges Coloridos de Oportunidades */}
                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-2 max-w-[350px]">
                                {/* Badge de Site */}
                                {lead.websiteStatus === 'bom' && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-500/10 border border-green-500/20 text-green-400">
                                    Site Próprio ✓
                                  </span>
                                )}
                                {lead.websiteStatus === 'razoável' && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                                    Link Social ⚠️
                                  </span>
                                )}
                                {lead.websiteStatus === 'fraco' && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400">
                                    Sem Website 🔴
                                  </span>
                                )}

                                {/* Badge de Telefone */}
                                {lead.phone ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-500/10 border border-green-500/20 text-green-400">
                                    Telefone OK ✓
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400">
                                    Sem Contato 🔴
                                  </span>
                                )}

                                {/* Outras mini oportunidades */}
                                {lead.reviews < 30 && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-800 text-gray-400 border border-gray-700">
                                    Pouca prova social
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Ações de Linha */}
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                {/* Lupa: Auditar completo */}
                                <button
                                  onClick={() => handleGenerateDemandReport(lead, false)}
                                  disabled={loadingDiagnostico[lead.id]}
                                  title="Fazer auditoria completa"
                                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all hover:scale-105 flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  {loadingDiagnostico[lead.id] ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                </button>

                                {/* Vender (Blur) */}
                                <button
                                  onClick={() => handleGenerateDemandReport(lead, true)}
                                  disabled={loadingDiagnostico[lead.id]}
                                  title="Vender com relatório em modo Blur"
                                  className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all hover:scale-105 flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  {loadingDiagnostico[lead.id] ? (
                                    <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <MessageSquare size={14} />
                                  )}
                                </button>

                                {/* Plus: Importar Cliente no Supabase */}
                                <button
                                  onClick={() => handleImportClient(lead)}
                                  disabled={importedLeads[lead.id] || importingLeadId === lead.id}
                                  className={`p-2 rounded-lg transition-all hover:scale-105 ${
                                    importedLeads[lead.id]
                                      ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                                      : 'bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] hover:bg-[#00ff9d]/20 disabled:opacity-50'
                                  }`}
                                  title={importedLeads[lead.id] ? 'Cliente Cadastrado ✓' : 'Cadastrar no Supabase'}
                                >
                                  {importingLeadId === lead.id ? (
                                    <div className="w-3.5 h-3.5 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
                                  ) : importedLeads[lead.id] ? (
                                    <CheckCircle size={14} />
                                  ) : (
                                    <Plus size={14} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDERIZAÇÃO DA SUB-ABA 2: AUDITORIA INDIVIDUAL */}
      {activeSubTab === 'individual' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Histórico colapsável */}
          <div className="flex justify-between items-center print:hidden bg-[#161b22] border border-gray-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[#00ff9d]" />
              <span className="text-xs font-black uppercase text-white tracking-widest">Base de Histórico de Auditoria</span>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-all text-xs font-bold"
            >
              Histórico ({history.length})
              {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {showHistory && (
            <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-5 space-y-3 print:hidden">
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

          {/* Barra de Busca de Análise Única */}
          <form onSubmit={handleSearch} className="flex gap-3 print:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text" value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Digite o nome da empresa ou cole o link do Google Maps para auditoria individual..."
                className="w-full bg-[#161b22] border border-gray-800 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#00ff9d]/50 transition-all placeholder:text-gray-600"
              />
            </div>
            <button type="submit" disabled={loading}
              className="bg-[#00ff9d] text-black font-black px-7 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-sm uppercase tracking-wide whitespace-nowrap shadow-[0_0_15px_rgba(0,255,157,0.2)]">
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

          {/* Exibição do Report Detalhado */}
          {report && !loading && (
            <div className="space-y-6" id="report-content">

              {/* Print Header */}
              <div className="hidden print:flex justify-between items-center mb-8 border-b border-gray-800/50 pb-6">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" className="h-24 w-auto object-contain" alt="Focus Arts Logo" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Barra de Ações do Report */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden bg-[#161b22]/50 border border-gray-800 p-4 rounded-xl">
                <div className="flex flex-wrap items-center justify-between lg:justify-start gap-4 w-full lg:w-auto">
                  <div className="flex items-center gap-3">
                    {report.thumbnail && (
                      <img src={report.thumbnail} alt="Thumb" className="w-8 h-8 rounded-lg object-cover border border-gray-800 shrink-0" />
                    )}
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest truncate max-w-[180px] sm:max-w-[300px]">
                      Análise: <span className="text-white font-black">{report.name}</span>
                    </p>
                  </div>
                  
                  {/* Toggle do Modo Blur Visual na Tela (Excelente para print no celular) */}
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] sm:text-xs text-gray-400 font-black uppercase tracking-wider bg-[#0d1117]/80 border border-gray-800 rounded-xl px-3 py-2 hover:border-gray-700 hover:text-white transition-all shrink-0">
                    <input
                      type="checkbox"
                      checked={isBlurMode}
                      onChange={(e) => setIsBlurMode(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#0d1117] border-gray-800 accent-[#ef4444] text-black focus:ring-0 cursor-pointer"
                    />
                    <span>🔒 Modo Pré-Venda (Blur)</span>
                  </label>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center justify-center gap-2 bg-[#161b22] border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl transition-all text-xs font-bold disabled:opacity-50 w-full sm:w-auto shrink-0">
                    <BookmarkPlus size={14} />
                    {saving ? 'Salvando...' : 'Salvar no Histórico'}
                  </button>
                  <button onClick={handlePrintWithBlur}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30 text-red-400 px-4 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.1)] w-full sm:w-auto shrink-0">
                    <span>🔒 PDF Pré-Venda (Blur)</span>
                  </button>
                  <button onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 bg-[#00ff9d] hover:bg-[#02e08a] text-black px-4 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-wider shadow-[0_0_10px_rgba(0,255,157,0.2)] w-full sm:w-auto shrink-0">
                    <Download size={14} /> PDF Completo
                  </button>
                </div>
              </div>

              {/* Card de Abordagem Comercial Inteligente Pro Max */}
              {isBlurMode && (
                <div className="bg-gradient-to-r from-red-500/15 via-orange-500/10 to-transparent border border-red-500/30 rounded-2xl p-5 print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
                  <div className="space-y-1">
                    <h4 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      🔒 Relatório em Modo Pré-Venda (Blur)
                    </h4>
                    <p className="text-gray-400 text-xs uppercase font-bold leading-relaxed">
                      O diagnóstico técnico detalhado está borrado. Envie a abordagem comercial padrão com a análise de ranking!
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                    {report.phone ? (
                      <a
                        href={getWhatsAppLink(report.phone, getFormattedFocusMsg(report.name))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-black px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:scale-105 w-full sm:w-auto"
                      >
                        <MessageSquare size={14} /> Enviar Abordagem (Whats)
                      </a>
                    ) : null}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getFormattedFocusMsg(report.name));
                        setSavedMsg('✅ Abordagem comercial copiada com sucesso!');
                        setTimeout(() => setSavedMsg(''), 3000);
                      }}
                      className="flex items-center justify-center gap-2 bg-[#00ff9d] hover:bg-[#02e08a] text-black px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] hover:scale-105 w-full sm:w-auto"
                    >
                      <Clipboard size={14} /> Copiar Mensagem de Venda
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback de salvo */}
              {savedMsg && (
                <div className={`text-xs font-bold px-4 py-2 rounded-lg border ${savedMsg.startsWith('✅') ? 'bg-[#00ff9d]/10 border-[#00ff9d]/20 text-[#00ff9d]' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {savedMsg}
                </div>
              )}

              {/* Score + Info + Oportunidades */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="report-impact-header">

                {/* Score */}
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden print:break-inside-avoid">
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

              {/* Ranking Concorrentes (Apenas se tiver concorrentes para exibir) */}
              {report.competitors && report.competitors.length > 0 && (
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

              {/* Mapa de Localização */}
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 mt-6 break-inside-avoid">
                 <div className="flex items-center justify-between mb-6 border-b border-gray-800/50 pb-4">
                    <div>
                      <h3 className="text-white font-black text-sm uppercase tracking-widest">Mapa de Localização</h3>
                      <p className="text-gray-500 text-[10px] uppercase font-bold mt-1">Região de Busca Local</p>
                    </div>
                 </div>
                 <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-800 relative bg-[#0d1117] flex items-center justify-center">
                    <div className="w-full h-full">
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
                            
                            <div className="relative">
                              <div style={isBlurMode ? { filter: 'blur(5.5px)', userSelect: 'none', pointerEvents: 'none' } : {}}>
                                <p className="text-gray-400 text-sm leading-relaxed mb-5 pr-4">
                                   {desc}
                                </p>
                                
                                <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-3 inline-block mb-6">
                                   <p className="text-gray-300 text-xs font-bold uppercase tracking-wider">
                                      Diagnóstico: <span className={`ml-1 ${isGood ? 'text-[#00ff9d]' : isWarning ? 'text-yellow-500' : 'text-red-500'}`}>{m.value}</span>
                                   </p>
                                </div>
                               </div>
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
      )}
    </div>
  );
}
