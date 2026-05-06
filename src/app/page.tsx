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
    if (!newKeyword || !data?.maps) return;
    setLoadingRank(true);
    try {
      const res = await fetch('/api/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: data.maps.locationId,
          accountId: data.maps.accountId,
          businessName: data.maps.title,
          keyword: newKeyword
        })
      });
      if (res.ok) {
        setNewKeyword('');
        fetchRankData(data.maps.locationId);
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

  return (
    <div className="flex h-screen bg-[#050505] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR LATERL */}
      <aside className="w-[280px] bg-[#0a0a0a] border-r border-[#222] flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-[#222]">
           <h1 className="text-2xl font-bold tracking-tighter" style={{ color: '#0070f3' }}>GSC<span style={{ color: '#fff' }}>Strategy</span></h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {selectedClient ? (
             <>
               {/* SESSÃO SEO (GSC) */}
               {selectedClient.type !== 'GBP_ONLY' && (
                 <div>
                   <p className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider pl-3">SEO & Orgânico</p>
                   <ul className="space-y-1">
                     <li>
                        <button onClick={() => setActiveTab('seo-insights')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'seo-insights' ? 'bg-[#0070f3]/10 text-[#0070f3]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>✨ Visão Geral (IA)</button>
                     </li>
                     <li>
                        <button onClick={() => setActiveTab('seo-keywords')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'seo-keywords' ? 'bg-[#0070f3]/10 text-[#0070f3]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>📊 Palavras-chave</button>
                     </li>
                     <li>
                        <button onClick={() => setActiveTab('seo-pages')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'seo-pages' ? 'bg-[#0070f3]/10 text-[#0070f3]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>📄 Top Páginas</button>
                     </li>
                   </ul>
                 </div>
               )}

               {/* SESSÃO LOCAL (GBP) */}
               <div>
                 <p className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider pl-3 flex items-center gap-2">Perfil Google Maps <span className={`w-1.5 h-1.5 rounded-full ${data?.maps ? 'bg-green-500' : 'bg-gray-600'}`}></span></p>
                 <ul className="space-y-1">
                   <li>
                      <button onClick={() => setActiveTab('gbp-dashboard')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'gbp-dashboard' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>🏪 Resumo Local</button>
                   </li>
                   <li>
                      <button onClick={() => setActiveTab('gbp-audit')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'gbp-audit' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>🛡️ Auditoria de Saúde</button>
                   </li>
                   <li>
                      <button onClick={() => setActiveTab('gbp-rank')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'gbp-rank' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>📈 Rank Tracker</button>
                   </li>
                   <li>
                      <button onClick={() => setActiveTab('gbp-reviews')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium flex justify-between items-center transition-all ${activeTab === 'gbp-reviews' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>
                         <span>⭐ Avaliações</span>
                         {(localReviews || []).filter((r:any) => !r.reviewReply).length > 0 && (
                             <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{(localReviews || []).filter((r:any) => !r.reviewReply).length}</span>
                         )}
                      </button>
                   </li>
                   <li>
                      <button onClick={() => setActiveTab('gbp-posts')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'gbp-posts' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-gray-400 hover:text-white hover:bg-[#111]'}`}>📣 Atualizações</button>
                   </li>
                 </ul>
               </div>
             </>
          ) : (
             <div className="text-gray-500 text-sm p-4 text-center border border-dashed border-[#333] rounded-lg mt-4 bg-[#111]/50">
                Selecione um cliente no menu superior para exibir as ferramentas.
             </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP HEADER */}
        <header className="h-[80px] border-b border-[#222] bg-[#0a0a0a]/95 backdrop-blur flex items-center justify-between px-8 shrink-0 z-10">
           <div className="flex-1 max-w-xl relative">
              {/* Dropdown de Clientes */}
              {loading ? (
                 <div className="text-sm text-[#0070f3] animate-pulse font-medium">Sincronizando ecossistema de APIs...</div>
              ) : (
                 <select 
                   value={selectedClient?.id || ''}
                   onChange={(e) => {
                      const client = sites.find(c => c.id === e.target.value);
                      if (client) handleSelectClient(client);
                      else { setSelectedClient(null); setData(null); }
                   }}
                   className="w-full bg-[#111] border border-[#333] text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#0070f3] appearance-none cursor-pointer shadow-sm hover:border-[#444] transition-colors font-medium"
                   style={{ WebkitAppearance: 'none' }}
                 >
                    <option value="">🔍 Buscar ou Selecionar Cliente...</option>
                    {sites.map(c => (
                       <option key={c.id} value={c.id}>
                          {c.type === 'GBP_ONLY' ? '📍 [Maps] ' : c.type === 'HYBRID' ? '🌐📍 [Full] ' : '🌐 [SEO] '}
                          {c.name}
                       </option>
                    ))}
                 </select>
              )}
           </div>

           {/* Filtros de Data (se for GSC/Hybrid) */}
           {selectedClient && selectedClient.type !== 'GBP_ONLY' && (
              <div className="flex items-center gap-4 ml-6">
                 <div className="flex bg-[#111] p-1 rounded-lg border border-[#222]">
                    {[7, 28, 90].map(v => (
                        <button 
                           key={v} 
                           onClick={() => { setIsCustom(false); setDays(v); fetchData(selectedClient.gscUrl, v, selectedClient.gbpData); }} 
                           className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${!isCustom && days === v ? 'bg-[#0070f3] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                        >
                            {v}d
                        </button>
                    ))}
                    <button 
                       onClick={() => setIsCustom(true)} 
                       className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${isCustom ? 'bg-[#0070f3] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                    >
                       Data Fixa
                    </button>
                 </div>
                 {isCustom && (
                    <div className="flex gap-2 items-center animate-fade-in bg-[#111] p-1 rounded-lg border border-[#222]">
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
           {!selectedClient ? (
              // TELA INICIAL BEM-VINDO
              <div className="max-w-4xl mx-auto mt-20 text-center animate-fade-in">
                 <div className="text-6xl mb-6">🚀</div>
                 <h2 className="text-3xl font-bold mb-4 tracking-tight">Bem-vindo ao Dashboard Master</h2>
                 <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
                    Selecione um cliente no topo para visualizar suas métricas de SEO no Google Search Console ou gerenciar e auditar seu Perfil no Google Maps.
                 </p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl hover:border-[#0070f3] transition-colors cursor-default">
                       <h3 className="text-lg font-bold text-[#0070f3] mb-3 flex items-center gap-2">🌐 GSC Insights</h3>
                       <p className="text-sm text-gray-400 leading-relaxed">Auditoria automatizada das principais métricas orgânicas, páginas e termos que mais convertem via Search Console.</p>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl hover:border-[#4285F4] transition-colors cursor-default">
                       <h3 className="text-lg font-bold text-[#4285F4] mb-3 flex items-center gap-2">🏪 Gestão Local</h3>
                       <p className="text-sm text-gray-400 leading-relaxed">Controle total de avaliações, rank tracker no mapa e checkup de saúde completo do Google My Business.</p>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl hover:border-green-500 transition-colors cursor-default">
                       <h3 className="text-lg font-bold text-green-500 mb-3 flex items-center gap-2">✨ Inteligência IA</h3>
                       <p className="text-sm text-gray-400 leading-relaxed">Respostas automáticas estratégicas de avaliações e análise profunda de oportunidades geradas pelo modelo Gemini.</p>
                    </div>
                 </div>
              </div>
           ) : (
              // CONTEÚDO DO CLIENTE
              <div className="max-w-6xl mx-auto animate-fade-in">
                 
                 {loadingPerf ? (
                    <div className="flex flex-col items-center justify-center py-40 opacity-50">
                       <div className="w-12 h-12 border-4 border-[#0070f3] border-t-transparent rounded-full animate-spin mb-6"></div>
                       <p className="text-xl font-bold tracking-tight animate-pulse">Agregando ecossistema de dados...</p>
                    </div>
                 ) : data && (
                    <>
                       {/* ---------------- SEO INSIGHTS ---------------- */}
                       {activeTab === 'seo-insights' && selectedClient.type !== 'GBP_ONLY' && (
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
                       {activeTab === 'seo-keywords' && selectedClient.type !== 'GBP_ONLY' && (
                          <div className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden animate-fade-in shadow-xl">
                              <table className="w-full text-left border-collapse text-sm">
                                 <thead className="bg-[#111] border-b border-[#222]">
                                     <tr className="text-gray-400 text-xs uppercase tracking-wider">
                                        <th className="px-6 py-4 font-bold">Termo de Pesquisa</th>
                                        <th className="px-6 py-4 font-bold">Cliques</th>
                                        <th className="px-6 py-4 font-bold">Impressões</th>
                                        <th className="px-6 py-4 font-bold">Posição</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-[#181818]">
                                    {data.keywords.slice(0, 50).map((k:any, i:number) => {
                                        const prevK = data.previousKeywords?.find((pk:any) => pk.keys[0] === k.keys[0]);
                                        const diff = prevK ? k.position - prevK.position : 0;
                                        return (
                                          <tr key={i} className="hover:bg-[#111]/80 transition-colors">
                                             <td className="px-6 py-4 font-medium">{k.keys[0]}</td>
                                             <td className="px-6 py-4 text-white font-bold">{k.clicks}</td>
                                             <td className="px-6 py-4 text-gray-400">{k.impressions}</td>
                                             <td className="px-6 py-4">
                                                <span className={k.position <= 3 ? 'text-[#0070f3] font-bold' : 'text-gray-300'}>{k.position.toFixed(1)}</span>
                                                <span className={`text-[10px] ml-2 font-bold ${diff < 0 ? 'text-green-500' : diff > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                                                   {diff !== 0 && (diff < 0 ? `↑ ${Math.abs(diff).toFixed(1)}` : `↓ ${diff.toFixed(1)}`)}
                                                </span>
                                             </td>
                                          </tr>
                                        );
                                    })}
                                 </tbody>
                              </table>
                          </div>
                       )}

                       {/* ---------------- SEO PAGES ---------------- */}
                       {activeTab === 'seo-pages' && selectedClient.type !== 'GBP_ONLY' && (
                          <div className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden animate-fade-in shadow-xl">
                              <table className="w-full text-left border-collapse text-sm">
                                 <thead className="bg-[#111] border-b border-[#222]">
                                     <tr className="text-gray-400 text-xs uppercase tracking-wider">
                                        <th className="px-6 py-4 font-bold">URL da Página</th>
                                        <th className="px-6 py-4 font-bold">Cliques</th>
                                        <th className="px-6 py-4 font-bold">CTR</th>
                                        <th className="px-6 py-4 font-bold">Posição</th>
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

                       {/* ======================================================== */}
                       {/* ======================= SESSÃO GBP ======================= */}
                       {/* ======================================================== */}
                       
                       {!data.maps && activeTab.startsWith('gbp-') ? (
                           <div className="flex flex-col items-center justify-center p-24 text-center bg-[#0a0a0a] border border-[#222] rounded-2xl animate-fade-in shadow-2xl">
                               <div className="text-6xl mb-6">📍</div>
                               <h3 className="text-3xl font-bold mb-3 text-[#4285F4]">Perfil Google Não Encontrado</h3>
                               <p className="text-gray-400 max-w-md mx-auto leading-relaxed">Não encontramos um Perfil de Empresa do Google vinculado a esta conta ou a URL cadastrada no mapa difere do Search Console.</p>
                           </div>
                       ) : data.maps && (
                           <>
                               {/* ---------------- GBP DASHBOARD ---------------- */}
                               {activeTab === 'gbp-dashboard' && (
                                   <div className="space-y-8 animate-fade-in">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-[#4285F4]/10 to-transparent border border-[#4285F4]/30 rounded-2xl p-8">
                                            <div>
                                                <p className="text-xs text-[#4285F4] font-bold uppercase tracking-wider mb-2">Visão Geral do Perfil</p>
                                                <h2 className="text-3xl font-bold text-white tracking-tight">{data.maps.title}</h2>
                                            </div>
                                            <a href={`https://google.com/maps?cid=${data.maps.locationId}`} target="_blank" className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-3 px-6 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(66,133,244,0.3)] hover:shadow-[0_0_30px_rgba(66,133,244,0.5)]">
                                                Visualizar no Maps ↗
                                            </a>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-sm">
                                                <div className="text-4xl mb-4">📞</div>
                                                <h3 className="text-5xl font-black tracking-tighter mb-2">{data.maps.metrics.calls}</h3>
                                                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Chamadas Recebidas</p>
                                            </div>
                                            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-sm">
                                                <div className="text-4xl mb-4">🗺️</div>
                                                <h3 className="text-5xl font-black tracking-tighter mb-2">{data.maps.metrics.directions}</h3>
                                                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Rotas Solicitadas</p>
                                            </div>
                                            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-sm">
                                                <div className="text-4xl mb-4">🖱️</div>
                                                <h3 className="text-5xl font-black tracking-tighter mb-2">{data.maps.metrics.websiteClicks}</h3>
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
                                           <div className={`border-l-[6px] rounded-2xl p-10 bg-[#0a0a0a] border-y border-r border-y-[#222] border-r-[#222] shadow-2xl flex flex-col md:flex-row gap-16`} style={{ borderLeftColor: auditData.color }}>
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
                                        <h2 className="text-2xl font-bold mb-2">📈 Rank Tracker (Local Pack)</h2>
                                        <p className="text-gray-400 mb-8">Descubra em qual posição você aparece no Google Maps quando o cliente pesquisa pela palavra-chave na sua cidade.</p>
                                        
                                        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-sm">
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <input 
                                                    type="text" 
                                                    value={newKeyword} 
                                                    onChange={(e) => setNewKeyword(e.target.value)}
                                                    placeholder="Digite o termo de pesquisa. Ex: advogado trabalhista em são paulo" 
                                                    className="flex-1 bg-[#111] border border-[#333] text-white px-5 py-3.5 rounded-xl focus:outline-none focus:border-[#4285F4] text-sm font-medium transition-colors hover:border-[#444]"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                                                />
                                                <button 
                                                    onClick={handleAddKeyword}
                                                    disabled={loadingRank || !newKeyword}
                                                    className="bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-[#222] disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(66,133,244,0.39)] disabled:shadow-none"
                                                >
                                                    {loadingRank ? '⏳ Analisando a cidade...' : 'Adicionar Monitoramento'}
                                                </button>
                                            </div>
                                        </div>

                                        {trackedKeywords.length === 0 ? (
                                            <div className="text-center p-16 border border-dashed border-[#333] rounded-2xl text-gray-500 bg-[#0a0a0a]/50 mt-8">
                                                Nenhuma palavra-chave sendo monitorada.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
                                                {trackedKeywords.map((kw: any, i: number) => {
                                                    const lastPos = kw.rank_history?.[0]?.position || 99;
                                                    const colorClass = lastPos <= 3 ? 'text-green-500' : lastPos <= 10 ? 'text-yellow-500' : 'text-red-500';
                                                    
                                                    return (
                                                        <div key={i} className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 flex flex-col shadow-sm">
                                                            <div className="flex justify-between items-start mb-8 border-b border-[#111] pb-6">
                                                                <div>
                                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Termo Monitorado</p>
                                                                    <h4 className="text-xl font-bold">{kw.keyword}</h4>
                                                                </div>
                                                                <div className={`text-4xl font-black tracking-tighter ${colorClass}`}>
                                                                    {lastPos === 99 ? '20+' : `#${lastPos}`}
                                                                </div>
                                                            </div>

                                                            {!competitorData[kw.keyword] ? (
                                                                <button 
                                                                    onClick={() => fetchCompetitors(kw.keyword)}
                                                                    disabled={loadingComp[kw.keyword]}
                                                                    className="mt-auto w-full bg-[#111] hover:bg-[#222] border border-[#333] text-gray-300 font-bold py-3.5 rounded-xl text-sm transition-colors"
                                                                >
                                                                    {loadingComp[kw.keyword] ? '🔍 Mapeando Concorrentes (SerpApi)...' : '🔍 Benchmark com Top 3 (Local Pack)'}
                                                                </button>
                                                            ) : (
                                                                <div className="mt-auto bg-[#111] rounded-xl p-5 border border-[#222]">
                                                                    <p className="text-[10px] text-[#4285F4] uppercase font-bold tracking-widest mb-4">Grid de Concorrentes (Top 3)</p>
                                                                    <div className="space-y-4">
                                                                        {competitorData[kw.keyword].map((c: any, idx: number) => (
                                                                            <div key={idx} className={`flex justify-between items-center text-sm ${c.isUs ? 'text-[#4285F4] font-bold' : 'text-gray-300'}`}>
                                                                                <span className="truncate w-48 xl:w-64">{idx + 1}. {c.isUs ? '⭐ Você' : c.title}</span>
                                                                                <div className="flex gap-4 text-xs bg-black/40 px-3 py-1.5 rounded-full">
                                                                                    <span className="font-bold">{c.rating}⭐</span>
                                                                                    <span className="text-gray-500">({c.reviews})</span>
                                                                                </div>
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
                                       <p className="text-gray-400 mb-8">Responda seus clientes rapidamente utilizando inteligência artificial para manter seu Health Score alto.</p>

                                       {loadingLocal ? (
                                           <div className="text-center p-16 text-[#4285F4] animate-pulse bg-[#0a0a0a] border border-[#222] rounded-2xl">Sincronizando banco de avaliações do Maps...</div>
                                       ) : localReviews.length === 0 ? (
                                           <div className="text-center p-16 border border-dashed border-[#333] rounded-2xl text-gray-500 bg-[#0a0a0a]/50">
                                               Nenhuma avaliação disponível para este perfil.
                                           </div>
                                       ) : (
                                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                               {localReviews.map((review: any, i: number) => (
                                                   <div key={i} className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-sm flex flex-col">
                                                       <div className="flex justify-between items-start mb-6">
                                                           <div className="flex items-center gap-4">
                                                               <img src={review.reviewer.profilePhotoUrl} alt="Reviewer" className="w-12 h-12 rounded-full bg-[#222] border border-[#333]" />
                                                               <div>
                                                                   <p className="font-bold text-white text-lg">{review.reviewer.displayName}</p>
                                                                   <div className="text-yellow-500 text-sm tracking-widest mt-1">{'★'.repeat(review.starRating)}{'☆'.repeat(5 - review.starRating)}</div>
                                                               </div>
                                                           </div>
                                                           <div className="text-xs font-bold text-gray-500 px-3 py-1 bg-[#111] rounded-full border border-[#222]">{new Date(review.createTime).toLocaleDateString()}</div>
                                                       </div>
                                                       
                                                       <p className="text-gray-300 text-sm mb-8 leading-relaxed italic flex-1">"{review.comment || '(O cliente deixou apenas a nota, sem comentário escrito.)'}"</p>

                                                       {review.reviewReply ? (
                                                           <div className="bg-[#111] border border-[#222] rounded-xl p-5 border-l-4 border-l-green-500 mt-auto">
                                                               <p className="text-[10px] text-green-500 font-bold mb-2 uppercase tracking-widest">Resposta Pública (Enviada)</p>
                                                               <p className="text-gray-400 text-sm leading-relaxed">{review.reviewReply.comment}</p>
                                                           </div>
                                                       ) : (
                                                           <div className="bg-black/50 border border-[#222] rounded-xl p-5 mt-auto">
                                                               <p className="text-[10px] text-red-400 font-bold mb-3 uppercase tracking-widest flex items-center gap-2">⚠️ Requer Atenção</p>
                                                               
                                                               <textarea 
                                                                   value={replyText[review.name] || ''}
                                                                   onChange={e => setReplyText({ ...replyText, [review.name]: e.target.value })}
                                                                   placeholder="Escreva sua resposta de forma profissional..."
                                                                   className="w-full bg-[#111] border border-[#333] text-gray-200 p-4 rounded-xl text-sm mb-4 focus:outline-none focus:border-[#4285F4] min-h-[100px] resize-none"
                                                               />
                                                               
                                                               <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                                                   <button 
                                                                       onClick={() => handleGenerateAI(review)}
                                                                       disabled={generatingAI[review.name]}
                                                                       className="bg-transparent hover:bg-white/5 border border-[#333] text-gray-300 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                                                   >
                                                                       {generatingAI[review.name] ? '⏳ Consultando Gemini...' : '✨ Sugestão IA'}
                                                                   </button>
                                                                   <button 
                                                                       onClick={() => handleReply(review.name)}
                                                                       disabled={!replyText[review.name]}
                                                                       className="bg-[#4285F4] hover:bg-[#3367D6] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(66,133,244,0.39)] disabled:shadow-none"
                                                                   >
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
                                       <p className="text-gray-400 mb-8">Crie atualizações para manter o perfil ativo. Postagens frequentes aumentam a relevância do seu negócio nas pesquisas.</p>
                                       
                                       <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 lg:p-10 shadow-2xl">
                                            <div className="flex gap-4 mb-8 pb-6 border-b border-[#222]">
                                                <button className="bg-[#4285F4]/10 text-[#4285F4] border border-[#4285F4]/30 px-5 py-2 rounded-full text-xs font-bold tracking-wide">✓ Atualização Padrão</button>
                                                <button className="bg-transparent text-gray-500 border border-[#333] px-5 py-2 rounded-full text-xs font-bold tracking-wide cursor-not-allowed">Oferta (Breve)</button>
                                                <button className="bg-transparent text-gray-500 border border-[#333] px-5 py-2 rounded-full text-xs font-bold tracking-wide cursor-not-allowed">Evento (Breve)</button>
                                            </div>

                                            <div className="space-y-8">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">O que você quer contar aos clientes?</label>
                                                    <textarea 
                                                        value={postText}
                                                        onChange={(e) => setPostText(e.target.value)}
                                                        placeholder="Ex: Estamos abertos no feriado! Venha nos visitar ou faça seu pedido..."
                                                        className="w-full h-40 bg-[#111] border border-[#333] rounded-xl p-5 text-white text-sm focus:outline-none focus:border-[#4285F4] resize-none hover:border-[#444] transition-colors"
                                                    />
                                                    <div className="text-right text-[11px] text-gray-500 mt-2 font-medium">{postText.length} / 1500 caracteres permitidos pelo Google</div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Foto ou Arte (Opcional)</label>
                                                        <div className={`border-2 border-dashed ${imageUrl ? 'border-[#4285F4]' : 'border-[#333] hover:border-[#555]'} rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-40 transition-colors bg-[#111]`}>
                                                            {imageUrl ? (
                                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
                                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                                        <button onClick={() => setImageUrl('')} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl">🗑️ Remover Imagem</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="text-4xl mb-3">📸</div>
                                                                    <p className="text-xs text-gray-400 font-medium">Clique para selecionar do computador</p>
                                                                    {uploadingImage && <p className="text-[#4285F4] text-xs font-bold mt-3 animate-pulse bg-[#4285F4]/10 px-3 py-1 rounded-full">⏳ Fazendo upload...</p>}
                                                                </>
                                                            )}
                                                            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Call to Action (Botão)</label>
                                                            <div className="relative">
                                                                <select value={buttonType} onChange={e => setButtonType(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#4285F4] appearance-none hover:border-[#444] transition-colors font-medium cursor-pointer">
                                                                    <option value="NONE">Nenhum botão</option>
                                                                    <option value="LEARN_MORE">🔗 Saiba Mais</option>
                                                                    <option value="BOOK">📅 Reservar</option>
                                                                    <option value="ORDER">🛍️ Fazer Pedido</option>
                                                                    <option value="CALL">📞 Ligar Agora</option>
                                                                </select>
                                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">▼</div>
                                                            </div>
                                                        </div>
                                                        {(buttonType !== 'NONE' && buttonType !== 'CALL') && (
                                                            <div className="animate-fade-in">
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">URL de Destino</label>
                                                                <input type="url" value={buttonUrl} onChange={e => setButtonUrl(e.target.value)} placeholder="https://seudominio.com.br/promo" className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#4285F4] hover:border-[#444] transition-colors" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-10 pt-8 border-t border-[#222] flex flex-col md:flex-row justify-between items-center gap-6 bg-[#111]/30 -mx-8 -mb-8 p-8 rounded-b-2xl">
                                                <div className="w-full md:w-auto">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Agendar para Depois? (Opcional)</label>
                                                    <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full md:w-64 bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#4285F4] font-medium" />
                                                </div>
                                                <button 
                                                    onClick={handlePost} 
                                                    disabled={!postText}
                                                    className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-sm transition-all shadow-lg ${postText ? (scheduledDate ? 'bg-[#ffbb00] text-black hover:bg-yellow-400 shadow-yellow-500/20' : 'bg-[#4285F4] text-white hover:bg-[#3367D6] shadow-blue-500/20 hover:shadow-blue-500/40') : 'bg-[#222] text-gray-500 cursor-not-allowed shadow-none'}`}
                                                >
                                                    {scheduledDate ? '🕒 Agendar no Banco de Dados' : '🚀 Publicar Imediatamente'}
                                                </button>
                                            </div>
                                       </div>
                                   </div>
                               )}
                           </>
                       )}
                    </>
                 )}
              </div>
           )}
        </main>
      </div>
    </div>
  );
}
