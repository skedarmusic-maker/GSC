'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  const [appMode, setAppMode] = useState<'seo' | 'gbp'>('seo');
  
  // Cliente GBP selecionado independentemente
  const [selectedGbp, setSelectedGbp] = useState<any>(null);
  const [gbpData, setGbpData] = useState<any>(null);
  
  // Estado para Gestão do Perfil Local
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [generatingAI, setGeneratingAI] = useState<{ [key: string]: boolean }>({});
  const [postText, setPostText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [buttonType, setButtonType] = useState('LEARN_MORE');
  const [buttonUrl, setButtonUrl] = useState(''); 
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  
  // Estado para Auditoria de Perfil
  const [auditData, setAuditData] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  
  // Estado para Rank Tracking
  const [trackedKeywords, setTrackedKeywords] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loadingRank, setLoadingRank] = useState(false);
  
  // Estado para Análise de Concorrentes
  const [competitorData, setCompetitorData] = useState<{ [key: string]: any }>({});
  const [loadingComp, setLoadingComp] = useState<{ [key: string]: boolean }>({});
  
  // Controle de Datas Avançado
  const [days, setDays] = useState(28);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch('/api/sites');
        const d = await res.json();
        if (Array.isArray(d)) {
          setSites(d);
        } else {
          setSites([]);
          console.error('API /api/sites não retornou um array:', d);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchData(selectedClient.gscUrl, days, selectedClient.gbpData);
    }
    if (selectedGbp) {
      handleSelectGbpProfile(selectedGbp);
    }
  }, [days]);

  const fetchLocalProfile = async (accountId: string, locationId: string) => {
    setLoadingLocal(true);
    setLocalError(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, locationId })
      });
      const data = await res.json();
      if (data.error) {
        setLocalError(data.error);
      } else {
        setLocalReviews(data);
      }
    } catch(e: any) { 
        setLocalError('Falha na conexão com a API local');
        console.error(e); 
    } finally { setLoadingLocal(false); }
  };

  const fetchScheduledPosts = async (locationId: string) => {
    const { data: posts, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('location_id', locationId)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true });
    
    if (!error) setScheduledPosts(posts || []);
  };

  const fetchAudit = async (accountId: string, locationId: string) => {
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, locationId })
      });
      const data = await res.json();
      if (!data.error) setAuditData(data);
    } catch(e) { console.error(e); } finally { setLoadingAudit(false); }
  };

  const fetchRankData = async (locationId: string) => {
    try {
      const res = await fetch(`/api/rank?locationId=${locationId}`);
      const data = await res.json();
      if (!data.error) setTrackedKeywords(data);
    } catch(e) { console.error(e); }
  };

  const handleAddKeyword = async () => {
    // Busca dados do Maps do objeto unificado ou do perfil selecionado (para Maps Only)
    const mapsData = data?.maps || (selectedGbp ? {
      locationId: selectedGbp.id.replace('locations/', ''),
      accountId: selectedGbp.accountId,
      title: selectedGbp.name
    } : null);

    if (!newKeyword || !mapsData) return;
    
    setLoadingRank(true);
    try {
      const res = await fetch('/api/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: mapsData.locationId,
          accountId: mapsData.accountId,
          businessName: mapsData.title,
          keyword: newKeyword
        })
      });
      if (res.ok) {
        setNewKeyword('');
        fetchRankData(mapsData.locationId);
      }
    } catch(e) { console.error(e); } finally { setLoadingRank(false); }
  };

  const fetchCompetitors = async (keyword: string) => {
    if (!data?.maps) return;
    setLoadingComp(prev => ({ ...prev, [keyword]: true }));
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: data.maps.locationId,
          accountId: data.maps.accountId,
          businessName: data.maps.title,
          keyword: keyword
        })
      });
      const resData = await res.json();
      if (!resData.error) {
        setCompetitorData(prev => ({ ...prev, [keyword]: resData.competitors }));
      }
    } catch(e) { console.error(e); } finally {
      setLoadingComp(prev => ({ ...prev, [keyword]: false }));
    }
  };

  const fetchData = async (url: string, period: any, gbpFallback?: any) => {
    setLoadingPerf(true);
    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            siteUrl: url, 
            days: typeof period === 'number' ? period : undefined,
            startDate: typeof period === 'object' ? period.start : undefined,
            endDate: typeof period === 'object' ? period.end : undefined
        }),
      });
      const d = await res.json();
      
      // Se não houver d.maps e tivemos um fallback (HYBRID), tentamos forçar o vínculo manual
      if (!d.maps && gbpFallback) {
         d.maps = {
           title: gbpFallback.title,
           accountId: gbpFallback.accountId,
           locationId: gbpFallback.name.replace('locations/', ''),
           metrics: { calls: 0, directions: 0, websiteClicks: 0 }
         };
      }
      
      setData(d);
      
      if (d.maps && d.maps.accountId && d.maps.locationId) {
        fetchLocalProfile(d.maps.accountId, d.maps.locationId);
        fetchScheduledPosts(d.maps.locationId);
        fetchAudit(d.maps.accountId, d.maps.locationId);
        fetchRankData(d.maps.locationId);
      }
    } catch (err) { console.error(err); } finally { setLoadingPerf(false); }
  };

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    setData(null);
    setLocalReviews([]);
    setScheduledPosts([]);
    setAuditData(null);
    setTrackedKeywords([]);
    setLocalError(null);
    
    if (client.type === 'GSC_ONLY' || client.type === 'HYBRID') {
       setActiveTab('seo-insights');
       fetchData(client.gscUrl, days, client.gbpData);
    } else if (client.type === 'GBP_ONLY') {
       // Cliente Exclusivo de Maps (Não chama API de Performance GSC)
       setActiveTab('gbp-dashboard');
       const accountId = client.gbpData.accountId;
       const locationId = client.gbpData.name.replace('locations/', '');
       
       setData({
         current: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
         previous: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
         keywords: [],
         pages: [],
         maps: {
           title: client.gbpData.title,
           accountId: accountId,
           locationId: locationId,
           metrics: { calls: 0, directions: 0, websiteClicks: 0 }
         }
       });
       
       fetchLocalProfile(accountId, locationId);
       fetchScheduledPosts(locationId);
       fetchAudit(accountId, locationId);
       fetchRankData(locationId);
    }
  };

  const handleGenerateAI = async (review: any) => {
    setGeneratingAI(prev => ({ ...prev, [review.name]: true }));
    try {
      const res = await fetch('/api/ai/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.comment,
          reviewerName: review.reviewer.displayName,
          rating: review.starRating,
          businessName: data?.maps?.title || 'nossa empresa'
        })
      });
      const result = await res.json();
      if (result.reply) {
        setReplyText(prev => ({ ...prev, [review.name]: result.reply }));
      }
    } catch (e) {
      alert('Erro ao gerar resposta com IA.');
    } finally {
      setGeneratingAI(prev => ({ ...prev, [review.name]: false }));
    }
  };

  const handleReply = async (reviewName: string) => {
    const text = replyText[reviewName];
    if (!text) return;
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewName, replyText: text })
      });
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);
      alert('Resposta enviada com sucesso ao Google Maps!');
      setReplyText({ ...replyText, [reviewName]: '' });
      if (data?.maps) fetchLocalProfile(data.maps.accountId, data.maps.locationId);
    } catch(e) { alert('Erro ao responder a avaliação.'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post_image')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('post_image').getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
    } catch (error: any) {
      alert('Erro ao fazer upload da imagem: ' + (error.message || 'Desconhecido'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePost = async () => {
    if (!postText || !data?.maps) return;

    try {
      const payload = {
        accountId: data.maps.accountId,
        locationId: data.maps.locationId,
        postText,
        imageUrl,
        buttonType,
        buttonUrl
      };

      // Se tiver data agendada, salva no Supabase
      if (scheduledDate) {
        const { error } = await supabase.from('scheduled_posts').insert([{
          scheduled_for: new Date(scheduledDate).toISOString(),
          content: postText,
          image_url: imageUrl,
          button_type: buttonType,
          button_url: buttonUrl,
          location_id: data.maps.locationId,
          account_id: data.maps.accountId,
          status: 'pending'
        }]);

        if (error) throw error;
        alert('Postagem agendada com sucesso!');
        setScheduledDate('');
        fetchScheduledPosts(data.maps.locationId);
      } else {
        // Caso contrário, publica imediatamente
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const resData = await res.json();
        if (resData.error) throw new Error(resData.error);
        alert('Postagem enviada com sucesso ao Google Maps!');
      }
      setPostText('');
      setImageUrl('');
      setButtonType('LEARN_MORE');
      // Mantém o link do Whats atual da empresa selecionada
    } catch(e: any) { 
      alert('Erro na postagem: ' + (e.message || 'Erro desconhecido')); 
    }
  };




  // Funções de Inteligência (Insights)
  const getStrategicInsights = () => {
    if (!data || !data.keywords) return [];
    const insights: any[] = [];

    // 1. OPORTUNIDADES DE OURO (Striking Distance - Pos 4 a 12)
    const striking = data.keywords.filter((k:any) => k.position > 3 && k.position <= 12).slice(0, 3);
    striking.forEach((k:any) => {
      insights.push({
        type: 'gold',
        title: '🚀 Oportunidade de Ouro',
        desc: `O termo "${k.keys[0]}" está na posição ${k.position.toFixed(1)}. Com um leve ajuste de conteúdo, você pula para o Top 3 e captura parte das ${k.impressions} visualizações atuais.`
      });
    });

    // 2. CANIBALIZAÇÃO E GAP DE CTR (Alta impressão, CTR abaixo da média)
    const avgCtr = data.current.ctr * 100;
    const ctrGap = data.keywords.filter((k:any) => k.impressions > 300 && (k.ctr * 100) < (avgCtr / 2)).slice(0, 2);
    ctrGap.forEach((k:any) => {
      insights.push({
        type: 'gap',
        title: '⚓ Gap de CTR Crítico',
        desc: `"${k.keys[0]}" aparece muito, mas quase ninguém clica. Seu título ou meta-description no Google não está atraente para este termo.`
      });
    });

    // 3. INSIGHTS DE NEGÓCIO (Se tiver Maps)
    if (data.maps) {
        insights.push({
            type: 'maps',
            title: '📱 Força Local (GSC + Maps)',
            desc: `O perfil "${data.maps.title}" gerou ${data.maps.metrics.calls} chamadas. Isso confirma que seu SEO está convertendo em clientes reais!`
        });
    }

    return insights;
  };

  const getDisplayUrl = (url: string) => url.replace('sc-domain:', '').replace('https://', '').replace(/\/$/, '');

  // Listas separadas por tipo
  const gscSites = sites.filter((s: any) => s.type === 'GSC_ONLY' || s.type === 'HYBRID');
  const gbpProfiles = sites.filter((s: any) => s.gbpData);

  const handleSelectGbpProfile = async (profile: any) => {
    setSelectedGbp(profile);
    setLoadingPerf(true);
    try {
      // Buscar métricas reais de performance (Chamadas, Rotas, Cliques)
      const res = await fetch('/api/maps/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          locationName: profile.id, // profile.id já é "locations/XXXX"
          days: days 
        })
      });
      const perfData = await res.json();
      
      const mapsData = {
        title: profile.name,
        accountId: profile.gbpData.accountId,
        locationId: profile.id.replace('locations/', ''),
        metrics: perfData || { calls: 0, directions: 0, websiteClicks: 0 }
      };
      
      setGbpData(mapsData);
      
      // Carregar outros dados do perfil
      fetchLocalProfile(profile.gbpData.accountId, mapsData.locationId);
      fetchScheduledPosts(mapsData.locationId);
      fetchAudit(profile.gbpData.accountId, mapsData.locationId);
      fetchRankData(mapsData.locationId);
      
    } catch (err) {
      console.error('Erro ao carregar dados do perfil:', err);
    } finally {
      setLoadingPerf(false);
    }
  };

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER MOBILE */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#222] bg-[#0a0a0a] sticky top-0 z-50">
          <h1 className="text-lg font-bold tracking-tighter" style={{ color: '#0070f3' }}>GSC<span style={{ color: '#fff' }}>Strategy</span></h1>
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-gray-400">
              {showMobileMenu ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
          </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`${showMobileMenu ? 'translate-x-0 opacity-100' : '-translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100 hidden lg:flex'} fixed lg:static inset-0 lg:inset-auto z-40 transition-all duration-300 w-full lg:w-[270px] bg-[#0a0a0a] border-r border-[#222] flex flex-col shrink-0 h-[calc(100vh-60px)] lg:h-screen top-[60px] lg:top-0`}>
        {/* Logo + Seletor de Modo */}
        <div className="p-5 border-b border-[#222]">
          <h1 className="text-xl font-bold tracking-tighter mb-4 hidden lg:block" style={{ color: '#0070f3' }}>GSC<span style={{ color: '#fff' }}>Strategy</span></h1>
          <div className="flex bg-[#111] p-1 rounded-lg border border-[#222] gap-1">
            <button
              onClick={() => { setAppMode('seo'); setActiveTab('seo-insights'); setShowMobileMenu(false); }}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${appMode === 'seo' ? 'bg-[#0070f3] text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              🌐 SEO
            </button>
            <button
              onClick={() => { setAppMode('gbp'); setActiveTab('gbp-dashboard'); setShowMobileMenu(false); }}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${appMode === 'gbp' ? 'bg-[#4285F4] text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              📍 Maps
            </button>
          </div>
        </div>

        {/* Seletor de Cliente no Sidebar */}
        <div className="p-4 border-b border-[#111]" key={sites.length}>
          {loading ? (
            <div className="text-xs text-gray-500 animate-pulse px-2">Carregando clientes...</div>
          ) : appMode === 'seo' ? (
            <select
              value={selectedClient?.id || ''}
              onChange={(e) => {
                const client = gscSites.find((c:any) => c.id === e.target.value);
                if (client) { handleSelectClient(client); setShowMobileMenu(false); }
                else { setSelectedClient(null); setData(null); }
              }}
              className="w-full bg-[#111] border border-[#333] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#0070f3] appearance-none cursor-pointer font-medium"
            >
              <option value="">🌐 Selecionar site GSC...</option>
              {gscSites.map((c:any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <select
              value={selectedGbp?.id || ''}
              onChange={(e) => {
                const profile = gbpProfiles.find((p:any) => p.id === e.target.value);
                if (profile) { handleSelectGbpProfile(profile); setShowMobileMenu(false); }
                else { setSelectedGbp(null); setGbpData(null); }
              }}
              className="w-full bg-[#111] border border-[#333] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#4285F4] appearance-none cursor-pointer font-medium"
            >
              <option value="">📍 Selecionar perfil Maps...</option>
              {gbpProfiles.map((p:any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Itens de navegação */}
        <div className="flex-1 overflow-y-auto p-4">
          {appMode === 'seo' ? (
            selectedClient ? (
              <ul className="space-y-1">
                <p className="text-[10px] font-bold text-gray-600 mb-3 uppercase tracking-wider px-2">SEO &amp; Orgânico</p>
                <li><button onClick={() => setActiveTab('seo-insights')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'seo-insights' ? 'bg-[#0070f3]/10 text-[#0070f3]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>✨ Visão Geral (IA)</button></li>
                <li><button onClick={() => setActiveTab('seo-keywords')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'seo-keywords' ? 'bg-[#0070f3]/10 text-[#0070f3]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>📊 Palavras-chave</button></li>
                <li><button onClick={() => setActiveTab('seo-pages')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'seo-pages' ? 'bg-[#0070f3]/10 text-[#0070f3]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>📄 Top Páginas</button></li>
              </ul>
            ) : (
              <p className="text-xs text-gray-600 px-3 py-4 text-center">Selecione um site GSC acima</p>
            )
          ) : (
            selectedGbp ? (
              <ul className="space-y-1">
                <p className="text-[10px] font-bold text-gray-600 mb-3 uppercase tracking-wider px-2 flex items-center gap-2">Perfil Google Maps <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span></p>
                <li><button onClick={() => setActiveTab('gbp-dashboard')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'gbp-dashboard' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>🏪 Resumo Local</button></li>
                <li><button onClick={() => setActiveTab('gbp-audit')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'gbp-audit' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>🛡️ Auditoria de Saúde</button></li>
                <li><button onClick={() => setActiveTab('gbp-rank')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'gbp-rank' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>📈 Rank Tracker</button></li>
                <li>
                  <button onClick={() => setActiveTab('gbp-reviews')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium flex justify-between items-center transition-all ${activeTab === 'gbp-reviews' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>
                    <span>⭐ Avaliações</span>
                    {(localReviews || []).filter((r:any) => !r.reviewReply).length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{(localReviews || []).filter((r:any) => !r.reviewReply).length}</span>
                    )}
                  </button>
                </li>
                <li><button onClick={() => setActiveTab('gbp-posts')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'gbp-posts' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>📣 Atualizações</button></li>
              </ul>
            ) : (
              <p className="text-xs text-gray-600 px-3 py-4 text-center">Selecione um perfil do Maps acima</p>
            )
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP HEADER */}
        <header className="h-[64px] border-b border-[#222] bg-[#0a0a0a]/95 backdrop-blur flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-3">
            {appMode === 'seo' && selectedClient && (
              <span className="text-sm font-semibold text-white truncate max-w-xs">{selectedClient.name}</span>
            )}
            {appMode === 'gbp' && selectedGbp && (
              <span className="text-sm font-semibold text-white truncate max-w-xs">{selectedGbp.name}</span>
            )}
          </div>

          {/* Filtros de Data — apenas no modo SEO */}
          {appMode === 'seo' && selectedClient && (
            <div className="flex items-center gap-3">
              <div className="flex bg-[#111] p-1 rounded-lg border border-[#222]">
                {[7, 28, 90].map(v => (
                  <button key={v} onClick={() => { setIsCustom(false); setDays(v); fetchData(selectedClient.gscUrl, v, selectedClient.gbpData); }} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!isCustom && days === v ? 'bg-[#0070f3] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}>{v}d</button>
                ))}
                <button onClick={() => setIsCustom(true)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${isCustom ? 'bg-[#0070f3] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}>Data Fixa</button>
              </div>
              {isCustom && (
                <div className="flex gap-2 items-center bg-[#111] p-1 rounded-lg border border-[#222]">
                  <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="bg-transparent border-none text-gray-300 text-xs px-2 py-1 focus:outline-none" />
                  <span className="text-gray-600">-</span>
                  <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="bg-transparent border-none text-gray-300 text-xs px-2 py-1 focus:outline-none" />
                  <button onClick={() => { if(customRange.start && customRange.end) fetchData(selectedClient.gscUrl, customRange, selectedClient.gbpData); }} className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-200">OK</button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#050505] pb-32">

          {/* ===== MODO SEO ===== */}
          {appMode === 'seo' && (
            !selectedClient ? (
              <div className="max-w-3xl mx-auto mt-24 text-center">
                <div className="text-6xl mb-6">🌐</div>
                <h2 className="text-3xl font-bold mb-3 tracking-tight">Google Search Console</h2>
                <p className="text-gray-400 text-base mb-8 max-w-xl mx-auto">Selecione um site no menu lateral para visualizar cliques orgânicos, palavras-chave e recomendações de IA.</p>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto animate-fade-in">
                 {loadingPerf ? (
                    <div className="flex flex-col items-center justify-center py-40 opacity-50">
                       <div className="w-12 h-12 border-4 border-[#0070f3] border-t-transparent rounded-full animate-spin mb-6"></div>
                       <p className="text-xl font-bold tracking-tight animate-pulse">Agregando ecossistema de dados...</p>
                    </div>
                 ) : data && (
                    <>
                       {/* ---------------- SEO INSIGHTS ---------------- */}
                       {activeTab === 'seo-insights' && (
                          <div className="space-y-8 animate-fade-in">
                             {/* KPIS GSC */}
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 shadow-sm">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">Cliques Orgânicos</p>
                                    <h2 className="text-4xl font-bold tracking-tight">{data.current.clicks}</h2>
                                    <p className={`text-xs mt-3 font-medium ${data.current.clicks >= data.previous.clicks ? 'text-green-500' : 'text-red-500'}`}>
                                       {data.current.clicks >= data.previous.clicks ? '↑' : '↓'} {Math.abs(data.current.clicks - data.previous.clicks)} vs prev.
                                    </p>
                                </div>
                                <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 shadow-sm">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">Impressões</p>
                                    <h2 className="text-4xl font-bold tracking-tight">{data.current.impressions}</h2>
                                </div>
                                <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 shadow-sm">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">CTR Médio</p>
                                    <h2 className="text-4xl font-bold tracking-tight">{(data.current.ctr * 100).toFixed(1)}%</h2>
                                </div>
                                <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 shadow-sm">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">Posição Média</p>
                                    <h2 className="text-4xl font-bold tracking-tight">{data.current.position.toFixed(1)}</h2>
                                </div>
                             </div>

                             {/* IA Insights */}
                             <h3 className="text-xl font-bold mt-12 mb-6 flex items-center gap-2">✨ Recomendações da IA</h3>
                             <div className="space-y-4">
                                {getStrategicInsights().length > 0 ? getStrategicInsights().map((ins: any, i: number) => (
                                    <div key={i} className={`bg-[#0a0a0a] border-l-4 rounded-r-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${ins.type === 'gold' ? 'border-l-[#0070f3]' : ins.type === 'maps' ? 'border-l-[#4285F4]' : 'border-l-[#ffbb00]'}`}>
                                        <div>
                                            <h4 className="text-lg font-bold mb-2">{ins.title}</h4>
                                            <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">{ins.desc}</p>
                                        </div>
                                        <button className="bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 px-5 rounded-lg text-sm transition-colors whitespace-nowrap">
                                            Investigar
                                        </button>
                                    </div>
                                )) : <div className="text-gray-500 p-8 text-center border border-dashed border-[#222] rounded-xl">Coletando padrões comportamentais do site...</div>}
                             </div>
                          </div>
                       )}

                       {/* ---------------- SEO KEYWORDS ---------------- */}
                       {activeTab === 'seo-keywords' && (
                          <div className="animate-fade-in">
                              <h2 className="text-2xl font-bold mb-6">📊 Palavras-chave que mais geram cliques</h2>
                              <table className="w-full text-left text-sm border-collapse">
                                 <thead className="bg-[#111] text-gray-400 border-b border-[#222]">
                                     <tr>
                                        <th className="px-6 py-4 font-bold rounded-tl-xl">Palavra-chave</th>
                                        <th className="px-6 py-4 font-bold">Cliques</th>
                                        <th className="px-6 py-4 font-bold">Impressões</th>
                                        <th className="px-6 py-4 font-bold">CTR</th>
                                        <th className="px-6 py-4 font-bold rounded-tr-xl">Posição</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-[#181818]">
                                    {data.keywords.slice(0, 30).map((k:any, i:number) => (
                                        <tr key={i} className="hover:bg-[#111]/80 transition-colors">
                                           <td className="px-6 py-4 text-white font-medium">{k.keys[0]}</td>
                                           <td className="px-6 py-4 text-[#0070f3] font-bold">{k.clicks}</td>
                                           <td className="px-6 py-4 text-gray-400">{k.impressions}</td>
                                           <td className="px-6 py-4 text-gray-400">{(k.ctr * 100).toFixed(1)}%</td>
                                           <td className="px-6 py-4 text-gray-400">{k.position.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                 </tbody>
                              </table>
                          </div>
                       )}

                       {/* ---------------- SEO PAGES ---------------- */}
                       {activeTab === 'seo-pages' && (
                          <div className="animate-fade-in">
                              <h2 className="text-2xl font-bold mb-6">📄 Top Páginas (Landing Pages)</h2>
                              <table className="w-full text-left text-sm border-collapse">
                                 <thead className="bg-[#111] text-gray-400 border-b border-[#222]">
                                     <tr>
                                        <th className="px-6 py-4 font-bold rounded-tl-xl">Página</th>
                                        <th className="px-6 py-4 font-bold">Cliques</th>
                                        <th className="px-6 py-4 font-bold">CTR</th>
                                        <th className="px-6 py-4 font-bold rounded-tr-xl">Posição</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-[#181818]">
                                    {data.pages.slice(0, 30).map((p:any, i:number) => (
                                        <tr key={i} className="hover:bg-[#111]/80 transition-colors">
                                           <td className="px-6 py-4 max-w-sm lg:max-w-xl truncate">
                                              <a href={p.keys[0]} target="_blank" className="text-[#0070f3] hover:underline font-medium">
                                                 {p.keys[0].replace(selectedClient?.gscUrl || '', '') || '/'}
                                              </a>
                                           </td>
                                           <td className="px-6 py-4 text-white font-bold">{p.clicks}</td>
                                           <td className="px-6 py-4 text-gray-400">{(p.ctr * 100).toFixed(1)}%</td>
                                           <td className="px-6 py-4 text-gray-400">{p.position.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                 </tbody>
                              </table>
                          </div>
                       )}
                    </>
                 )}
              </div>
            )
          )}

          {/* ===== MODO GBP ===== */}
          {appMode === 'gbp' && (
            !selectedGbp ? (
              <div className="max-w-3xl mx-auto mt-24 text-center">
                <div className="text-6xl mb-6">📍</div>
                <h2 className="text-3xl font-bold mb-3 tracking-tight">Perfil Google Maps</h2>
                <p className="text-gray-400 text-base mb-8 max-w-xl mx-auto">Selecione um Perfil de Empresa do Google no menu lateral para gerenciar avaliações, auditoria, rank e publicações.</p>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto animate-fade-in">
                {/* ---------------- GBP DASHBOARD ---------------- */}
                {activeTab === 'gbp-dashboard' && (
                    <div className="space-y-8 animate-fade-in">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-[#4285F4]/10 to-transparent border border-[#4285F4]/30 rounded-2xl p-8">
                             <div>
                                 <p className="text-xs text-[#4285F4] font-bold uppercase tracking-wider mb-2">Visão Geral do Perfil</p>
                                 <h2 className="text-3xl font-bold text-white tracking-tight">{gbpData?.title}</h2>
                             </div>
                             <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gbpData?.title)}`} target="_blank" className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-3 px-6 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(66,133,244,0.3)] hover:shadow-[0_0_30px_rgba(66,133,244,0.5)]">
                                 Visualizar no Maps ↗
                             </a>
                         </div>

                         <div className="flex items-center gap-2 mb-2 text-gray-400 text-[10px] bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/10 uppercase font-bold tracking-widest">
                             <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] animate-pulse"></span>
                             Métricas dos últimos <span className="text-white">{days} dias</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-sm">
                                 <div className="text-4xl mb-4">📞</div>
                                 <h3 className="text-5xl font-black tracking-tighter mb-2">{gbpData?.metrics?.calls ?? 0}</h3>
                                 <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Chamadas Recebidas</p>
                             </div>
                             <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-sm">
                                 <div className="text-4xl mb-4">🗺️</div>
                                 <h3 className="text-5xl font-black tracking-tighter mb-2">{gbpData?.metrics?.directions ?? 0}</h3>
                                 <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Rotas Solicitadas</p>
                             </div>
                             <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-sm">
                                 <div className="text-4xl mb-4">🖱️</div>
                                 <h3 className="text-5xl font-black tracking-tighter mb-2">{gbpData?.metrics?.websiteClicks ?? 0}</h3>
                                 <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Visitas ao Site</p>
                             </div>
                         </div>
                    </div>
                )}

                {/* ---------------- GBP AUDIT ---------------- */}
                {activeTab === 'gbp-audit' && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold mb-6">🛡️ Auditoria de Saúde do Perfil</h2>
                        {loadingAudit ? (
                            <div className="p-32 text-center bg-[#0a0a0a] border border-[#222] rounded-2xl">
                                 <div className="w-10 h-10 border-4 border-[#4285F4] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                                 <div className="text-[#4285F4] text-lg font-bold">Processando checklist de 20 pontos de ranking...</div>
                            </div>
                        ) : auditData && !auditData.error && (
                            <div className="border-l-[6px] rounded-2xl p-10 bg-[#0a0a0a] border-y border-r border-y-[#222] border-r-[#222] shadow-2xl flex flex-col md:flex-row gap-16" style={{ borderLeftColor: auditData.color }}>
                                <div className="flex flex-col items-center justify-center text-center min-w-[200px]">
                                    <p className="text-xs uppercase font-bold tracking-widest text-gray-500 mb-4">Health Score</p>
                                    <div className="text-[100px] font-black leading-none mb-4 tracking-tighter" style={{ color: auditData.color }}>{auditData.score}</div>
                                    <div className="text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-black/50" style={{ color: auditData.color, border: `1px solid ${auditData.color}40` }}>{auditData.grade}</div>
                                </div>
                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
                                    {auditData.checklist.map((item: any, i: number) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="mt-1.5 text-xl">{item.passed ? '✅' : '❌'}</div>
                                            <div>
                                                <p className="font-bold text-white text-[15px] mb-1.5">{item.name}</p>
                                                <p className={`text-[13px] ${item.passed ? 'text-gray-500' : 'text-red-400 font-medium'}`}>{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------------- GBP RANK TRACKER ---------------- */}
                {activeTab === 'gbp-rank' && (
                    <div className="space-y-6 animate-fade-in">
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                             <div>
                                 <h2 className="text-2xl font-bold">📈 Rank Tracker (Local Pack)</h2>
                                 <p className="text-gray-400 mt-1">Descubra em qual posição você aparece quando o cliente pesquisa pela palavra-chave na sua cidade.</p>
                             </div>
                             {trackedKeywords.length > 0 && (
                                 <button
                                     onClick={async () => {
                                         const { jsPDF } = await import('jspdf');
                                         const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                                         const blue = [66, 133, 244] as [number, number, number];
                                         const dark = [10, 10, 10] as [number, number, number];
                                         const white = [255, 255, 255] as [number, number, number];
                                         const gray = [120, 120, 120] as [number, number, number];

                                         // --- Fundo ---
                                         doc.setFillColor(...dark);
                                         doc.rect(0, 0, 210, 297, 'F');

                                         // --- Cabeçalho ---
                                         doc.setFillColor(...blue);
                                         doc.rect(0, 0, 210, 36, 'F');
                                         doc.setTextColor(...white);
                                         doc.setFontSize(18);
                                         doc.setFont('helvetica', 'bold');
                                         doc.text('Relatório de Rank Tracker', 14, 16);
                                         doc.setFontSize(10);
                                         doc.setFont('helvetica', 'normal');
                                         doc.text(`Cliente: ${gbpData?.title || selectedGbp?.name || 'N/A'}`, 14, 26);
                                         doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'})}`, 14, 32);

                                         // --- Resumo Metodológico ---
                                         doc.setFillColor(20, 20, 30);
                                         doc.roundedRect(10, 42, 190, 38, 3, 3, 'F');
                                         doc.setTextColor(...blue);
                                         doc.setFontSize(9);
                                         doc.setFont('helvetica', 'bold');
                                         doc.text('SOBRE OS DADOS', 16, 50);
                                         doc.setTextColor(...gray);
                                         doc.setFont('helvetica', 'normal');
                                         doc.setFontSize(8);
                                         const disclaimer = 'As posições são obtidas via SerpApi simulando uma busca no Google Maps a partir das coordenadas do perfil do cliente. O ranking pode variar por localização do usuário, horário e personalização do Google. Use estes dados como referência de tendência — o valor real está na evolução histórica semana a semana, registrada automaticamente.';
                                         const lines = doc.splitTextToSize(disclaimer, 178);
                                         doc.text(lines, 16, 57);

                                         // --- Keywords ---
                                         let y = 90;
                                         doc.setTextColor(...white);
                                         doc.setFontSize(11);
                                         doc.setFont('helvetica', 'bold');
                                         doc.text('PALAVRAS-CHAVE MONITORADAS', 14, y - 4);

                                         trackedKeywords.forEach((kw: any) => {
                                             if (y > 260) { doc.addPage(); doc.setFillColor(...dark); doc.rect(0,0,210,297,'F'); y = 20; }

                                             const pos = kw.rank_history?.[0]?.position || 99;
                                             const posLabel = pos === 99 ? '20+' : `#${pos}`;
                                             const bgColor: [number, number, number] = pos <= 3 ? [0, 80, 0] : pos <= 10 ? [80, 60, 0] : [80, 0, 0];
                                             const posColor: [number, number, number] = pos <= 3 ? [0, 200, 81] : pos <= 10 ? [255, 187, 51] : [255, 68, 68];
                                             const competitors = competitorData[kw.keyword] || [];

                                             // Card background
                                             doc.setFillColor(18, 18, 28);
                                             doc.roundedRect(10, y, 190, competitors.length > 0 ? 46 + (competitors.length * 10) : 28, 3, 3, 'F');

                                             // Position badge
                                             doc.setFillColor(...bgColor);
                                             doc.roundedRect(170, y + 4, 24, 14, 2, 2, 'F');
                                             doc.setTextColor(...posColor);
                                             doc.setFontSize(13);
                                             doc.setFont('helvetica', 'bold');
                                             doc.text(posLabel, 182, y + 13, { align: 'center' });

                                             // Keyword
                                             doc.setTextColor(...white);
                                             doc.setFontSize(10);
                                             doc.setFont('helvetica', 'bold');
                                             doc.text(kw.keyword, 16, y + 12);
                                             doc.setTextColor(...gray);
                                             doc.setFontSize(7);
                                             doc.setFont('helvetica', 'normal');
                                             const histLen = kw.rank_history?.length || 1;
                                             doc.text(`${histLen} registro(s) histórico(s) • posição atual: ${posLabel}`, 16, y + 20);

                                             // Competitors
                                             if (competitors.length > 0) {
                                                 doc.setTextColor(...blue);
                                                 doc.setFontSize(7);
                                                 doc.setFont('helvetica', 'bold');
                                                 doc.text('TOP 3 CONCORRENTES', 16, y + 30);
                                                 competitors.forEach((c: any, idx: number) => {
                                                     doc.setTextColor(...(c.isUs ? blue : white));
                                                     doc.setFont('helvetica', c.isUs ? 'bold' : 'normal');
                                                     doc.setFontSize(8);
                                                     const label = `${idx + 1}. ${c.isUs ? '★ Você' : c.title}`;
                                                     doc.text(label.substring(0, 45), 16, y + 38 + (idx * 9));
                                                     doc.setTextColor(...gray);
                                                     doc.text(`${c.rating}★ (${c.reviews} avaliações)`, 155, y + 38 + (idx * 9), { align: 'right' });
                                                 });
                                                 y += 46 + (competitors.length * 9) + 6;
                                             } else {
                                                 y += 34;
                                             }
                                         });

                                         // Footer
                                         doc.setTextColor(...gray);
                                         doc.setFontSize(7);
                                         doc.text('Gerado por GSCStrategy • Os dados são snapshot no momento da consulta e podem variar.', 105, 292, { align: 'center' });

                                         doc.save(`Rank_Tracker_${(gbpData?.title || 'relatorio').replace(/\s/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`);
                                     }}
                                     className="flex items-center gap-2 bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-[0_4px_14px_0_rgba(66,133,244,0.3)] whitespace-nowrap flex-shrink-0"
                                 >
                                     ⬇️ Baixar Relatório PDF
                                 </button>
                             )}
                         </div>
                         <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-sm">
                             <div className="flex flex-col sm:flex-row gap-4">
                                 <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="Ex: advogado trabalhista em são paulo" className="flex-1 bg-[#111] border border-[#333] text-white px-5 py-3.5 rounded-xl focus:outline-none focus:border-[#4285F4] text-sm font-medium" onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()} />
                                 <button onClick={handleAddKeyword} disabled={loadingRank || !newKeyword} className="bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-[#222] disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(66,133,244,0.39)] disabled:shadow-none">
                                     {loadingRank ? '⏳ Analisando...' : 'Monitorar Palavra-chave'}
                                 </button>
                             </div>
                         </div>
                         {trackedKeywords.length === 0 ? (
                             <div className="text-center p-16 border border-dashed border-[#333] rounded-2xl text-gray-500 bg-[#0a0a0a]/50 mt-8">Nenhuma palavra-chave monitorada.</div>
                         ) : (
                             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
                                 {trackedKeywords.map((kw: any, i: number) => {
                                     const lastPos = kw.rank_history?.[0]?.position || 99;
                                     const colorClass = lastPos <= 3 ? 'text-green-500' : lastPos <= 10 ? 'text-yellow-500' : 'text-red-500';
                                     const histLen = kw.rank_history?.length || 0;
                                     return (
                                         <div key={i} className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 flex flex-col shadow-sm">
                                             <div className="flex justify-between items-start mb-2 border-b border-[#111] pb-6">
                                                 <div>
                                                     <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Termo</p>
                                                     <h4 className="text-xl font-bold">{kw.keyword}</h4>
                                                     <p className="text-[10px] text-gray-600 mt-2">{histLen} atualização{histLen !== 1 ? 'ões' : ''} registrada{histLen !== 1 ? 's' : ''}</p>
                                                 </div>
                                                 <div className={`text-4xl font-black tracking-tighter ${colorClass}`}>{lastPos === 99 ? '20+' : `#${lastPos}`}</div>
                                             </div>
                                             {!competitorData[kw.keyword] ? (
                                                 <button onClick={() => fetchCompetitors(kw.keyword)} disabled={loadingComp[kw.keyword]} className="mt-auto w-full bg-[#111] hover:bg-[#222] border border-[#333] text-gray-300 font-bold py-3.5 rounded-xl text-sm transition-colors">
                                                     {loadingComp[kw.keyword] ? '🔍 Mapeando...' : '🔍 Benchmark com Top 3'}
                                                 </button>
                                             ) : (
                                                 <div className="mt-auto bg-[#111] rounded-xl p-5 border border-[#222]">
                                                     <p className="text-[10px] text-[#4285F4] uppercase font-bold tracking-widest mb-4">Top 3 Concorrentes</p>
                                                     <div className="space-y-4">
                                                         {competitorData[kw.keyword].map((c: any, idx: number) => (
                                                             <div key={idx} className={`flex justify-between items-center text-sm ${c.isUs ? 'text-[#4285F4] font-bold' : 'text-gray-300'}`}>
                                                                 <span className="truncate w-48 xl:w-64">{idx + 1}. {c.isUs ? '⭐ Você' : c.title}</span>
                                                                 <div className="flex gap-4 text-xs bg-black/40 px-3 py-1.5 rounded-full"><span className="font-bold">{c.rating}⭐</span><span className="text-gray-500">({c.reviews})</span></div>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })}
                             </div>
                         )}
                    </div>
                )}

                {/* ---------------- GBP REVIEWS ---------------- */}
                {activeTab === 'gbp-reviews' && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold mb-2">⭐ Gestão de Avaliações (com IA)</h2>
                        <p className="text-gray-400 mb-8">Responda clientes rapidamente com sugestões da IA.</p>
                        {loadingLocal ? (
                            <div className="text-center p-16 text-[#4285F4] animate-pulse bg-[#0a0a0a] border border-[#222] rounded-2xl">Sincronizando avaliações...</div>
                        ) : localReviews.length === 0 ? (
                            <div className="text-center p-16 border border-dashed border-[#333] rounded-2xl text-gray-500 bg-[#0a0a0a]/50">Nenhuma avaliação disponível.</div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {localReviews.map((review: any, i: number) => (
                                    <div key={i} className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-sm flex flex-col">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <img src={review.reviewer?.profilePhotoUrl} alt="" className="w-12 h-12 rounded-full bg-[#222] border border-[#333]" />
                                                <div>
                                                    <p className="font-bold text-white text-lg">{review.reviewer?.displayName}</p>
                                                    <div className="text-yellow-500 text-sm tracking-widest mt-1">{'★'.repeat(review.starRating || 0)}{'☆'.repeat(5 - (review.starRating || 0))}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-bold text-gray-500 px-3 py-1 bg-[#111] rounded-full border border-[#222]">{review.createTime ? new Date(review.createTime).toLocaleDateString() : ''}</div>
                                        </div>
                                        <p className="text-gray-300 text-sm mb-8 leading-relaxed italic flex-1">"{review.comment || '(Avaliação sem comentário)'}"</p>
                                        {review.reviewReply ? (
                                            <div className="bg-[#111] border border-[#222] rounded-xl p-5 border-l-4 border-l-green-500 mt-auto">
                                                <p className="text-[10px] text-green-500 font-bold mb-2 uppercase tracking-widest">Resposta Publicada</p>
                                                <p className="text-gray-400 text-sm leading-relaxed">{review.reviewReply.comment}</p>
                                            </div>
                                        ) : (
                                            <div className="bg-black/50 border border-[#222] rounded-xl p-5 mt-auto">
                                                <p className="text-[10px] text-red-400 font-bold mb-3 uppercase tracking-widest">⚠️ Requer Resposta</p>
                                                <textarea value={replyText[review.name] || ''} onChange={e => setReplyText({ ...replyText, [review.name]: e.target.value })} placeholder="Escreva sua resposta..." className="w-full bg-[#111] border border-[#333] text-gray-200 p-4 rounded-xl text-sm mb-4 focus:outline-none focus:border-[#4285F4] min-h-[100px] resize-none" />
                                                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                                    <button onClick={() => handleGenerateAI(review)} disabled={generatingAI[review.name]} className="bg-transparent hover:bg-white/5 border border-[#333] text-gray-300 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                                                        {generatingAI[review.name] ? '⏳ Gemini pensando...' : '✨ Sugestão IA'}
                                                    </button>
                                                    <button onClick={() => handleReply(review.name)} disabled={!replyText[review.name]} className="bg-[#4285F4] hover:bg-[#3367D6] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(66,133,244,0.39)] disabled:shadow-none">
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
                )}

                {/* ---------------- GBP POSTS ---------------- */}
                {activeTab === 'gbp-posts' && (
                    <div className="space-y-6 animate-fade-in max-w-4xl">
                        <h2 className="text-2xl font-bold mb-2">📣 Atualizações da Empresa (Posts)</h2>
                        <p className="text-gray-400 mb-8">Crie atualizações para manter o perfil ativo no Google.</p>
                        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 lg:p-10 shadow-2xl">
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Mensagem para os clientes</label>
                                    <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Ex: Estamos abertos no feriado! Venha nos visitar..." className="w-full h-40 bg-[#111] border border-[#333] rounded-xl p-5 text-white text-sm focus:outline-none focus:border-[#4285F4] resize-none" />
                                    <div className="text-right text-[11px] text-gray-500 mt-2 font-medium">{postText.length} / 1500</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Foto (Opcional)</label>
                                        <div className={`border-2 border-dashed ${imageUrl ? 'border-[#4285F4]' : 'border-[#333] hover:border-[#555]'} rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-40 transition-colors bg-[#111]`}>
                                            {imageUrl ? (
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                        <button onClick={() => setImageUrl('')} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl">🗑️ Remover</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-4xl mb-3">📸</div>
                                                    <p className="text-xs text-gray-400 font-medium">Clique para selecionar</p>
                                                    {uploadingImage && <p className="text-[#4285F4] text-xs font-bold mt-3 animate-pulse">⏳ Fazendo upload...</p>}
                                                </>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Call to Action</label>
                                            <div className="relative">
                                                <select value={buttonType} onChange={e => setButtonType(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#4285F4] appearance-none cursor-pointer font-medium">
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
                                                <input type="url" value={buttonUrl} onChange={e => setButtonUrl(e.target.value)} placeholder="https://seudominio.com.br" className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#4285F4]" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 pt-8 border-t border-[#222] flex flex-col md:flex-row justify-between items-center gap-6 bg-[#111]/30 -mx-8 -mb-8 p-8 rounded-b-2xl">
                                <div className="w-full md:w-auto">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Agendar? (Opcional)</label>
                                    <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full md:w-64 bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#4285F4] font-medium" />
                                </div>
                                <button onClick={handlePost} disabled={!postText} className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-sm transition-all shadow-lg ${postText ? (scheduledDate ? 'bg-[#ffbb00] text-black hover:bg-yellow-400 shadow-yellow-500/20' : 'bg-[#4285F4] text-white hover:bg-[#3367D6] shadow-blue-500/20 hover:shadow-blue-500/40') : 'bg-[#222] text-gray-500 cursor-not-allowed shadow-none'}`}>
                                    {scheduledDate ? '🕒 Agendar no Banco de Dados' : '🚀 Publicar Imediatamente'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
