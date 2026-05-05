'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  
  // Estado para Gestão do Perfil Local
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [postText, setPostText] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  
  // Controle de Datas Avançado
  const [days, setDays] = useState(28);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch('/api/sites');
        const d = await res.json();
        setSites(d);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchSites();
  }, []);

  const fetchLocalProfile = async (accountId: string, locationId: string) => {
    setLoadingLocal(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, locationId })
      });
      const data = await res.json();
      if (!data.error) setLocalReviews(data);
    } catch(e) { console.error(e); } finally { setLoadingLocal(false); }
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

  const fetchData = async (url: string, period: any) => {
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
      setData(d);
      
      // Se houver dados do Maps cruzados, já busca as avaliações e agendamentos
      if (d.maps && d.maps.accountId && d.maps.locationId) {
        fetchLocalProfile(d.maps.accountId, d.maps.locationId);
        fetchScheduledPosts(d.maps.locationId);
      }
    } catch (err) { console.error(err); } finally { setLoadingPerf(false); }
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

  const handlePost = async () => {
    if (!postText || !data?.maps) return;

    try {
      // Se tiver data agendada, salva no Supabase
      if (scheduledDate) {
        const { error } = await supabase.from('scheduled_posts').insert([{
          scheduled_for: new Date(scheduledDate).toISOString(),
          content: postText,
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
          body: JSON.stringify({ accountId: data.maps.accountId, locationId: data.maps.locationId, postText })
        });
        const resData = await res.json();
        if (resData.error) throw new Error(resData.error);
        alert('Postagem enviada com sucesso ao Google Maps!');
      }
      setPostText('');
    } catch(e: any) { 
      alert('Erro na postagem: ' + (e.message || 'Erro desconhecido')); 
    }
  };

  const handleSelectSite = (url: string) => {
    setSelectedSite(url);
    fetchData(url, days);
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

  if (selectedSite) {
    const insights = getStrategicInsights();

    return (
      <div className="container" style={{ paddingTop: '20px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
             <div>
                <button onClick={() => { setSelectedSite(null); setData(null); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '10px' }}>← Ver todos os sites</button>
                <h1 className="title" style={{ fontSize: '1.8rem', textAlign: 'left', margin: 0 }}>{getDisplayUrl(selectedSite)}</h1>
             </div>
             
             {/* Filtros de Data Avançados */}
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '5px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '12px', border: '1px solid #222' }}>
                    {[7, 28, 90].map(v => (
                        <button key={v} onClick={() => { setIsCustom(false); setDays(v); fetchData(selectedSite, v); }} style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', background: !isCustom && days === v ? '#0070f3' : 'transparent', color: '#fff', fontWeight: 'bold' }}>
                            {v} dias
                        </button>
                    ))}
                    <button onClick={() => setIsCustom(true)} style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', background: isCustom ? '#0070f3' : 'transparent', color: '#fff', fontWeight: 'bold' }}>Personalizado</button>
                </div>
                {isCustom && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="animate-fade-in">
                        <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '7px', fontSize: '0.85rem' }} />
                        <span style={{ color: '#444' }}>-</span>
                        <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '7px', fontSize: '0.85rem' }} />
                        <button onClick={() => { if(customRange.start && customRange.end) fetchData(selectedSite, customRange); }} style={{ background: '#fff', color: '#000', border: 'none', padding: '6px 15px', borderRadius: '7px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>Aplicar</button>
                    </div>
                )}
             </div>
        </header>

        {loadingPerf ? <div style={{ textAlign: 'center', padding: '100px' }} className="animate-pulse">Gerando análise estratégica...</div> : data && (
          <div className="animate-fade-in">
             
             {/* RESUMO DE MÉTRICAS */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div className="site-card" style={{ padding: '20px' }}>
                    <p className="site-meta">Cliques Orgânicos</p>
                    <h2 style={{ fontSize: '2rem' }}>{data.current.clicks}</h2>
                    <p style={{ fontSize: '0.8rem', color: data.current.clicks >= data.previous.clicks ? '#00ff00' : '#ff4444' }}>{data.current.clicks >= data.previous.clicks ? '↑' : '↓'} {Math.abs(data.current.clicks - data.previous.clicks)} vs prev.</p>
                </div>
                <div className="site-card" style={{ padding: '20px' }}>
                    <p className="site-meta">CTR Médio</p>
                    <h2 style={{ fontSize: '2rem' }}>{(data.current.ctr * 100).toFixed(1)}%</h2>
                </div>
                <div className="site-card" style={{ padding: '20px' }}>
                    <p className="site-meta">Posição Média</p>
                    <h2 style={{ fontSize: '2rem' }}>{data.current.position.toFixed(1)}</h2>
                </div>
                <div className="site-card" style={{ padding: '20px', background: '#0070f305' }}>
                    <p className="site-meta">Local Rank (Maps)</p>
                    <h2 style={{ fontSize: '2rem' }}>{data.maps ? data.maps.metrics.calls : '--'}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>Chamadas no Maps</p>
                </div>
             </div>

             <nav style={{ display: 'flex', gap: '40px', marginBottom: '30px', borderBottom: '1px solid #222' }}>
                {['insights', 'performance', 'páginas', 'perfil local'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '15px 0', background: 'none', border: 'none', color: activeTab === t ? '#fff' : '#666', borderBottom: activeTab === t ? '2px solid #0070f3' : 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                        {t === 'insights' ? '✨ INSIGHTS & IA' : t === 'perfil local' ? '🏪 PERFIL LOCAL' : t.toUpperCase()}
                    </button>
                ))}
             </nav>

             {/* ABA: INSIGHTS & IA */}
             {activeTab === 'insights' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {insights.length > 0 ? insights.map((ins, i) => (
                      <div key={i} className="site-card" style={{ borderLeft: `5px solid ${ins.type === 'gold' ? '#0070f3' : ins.type === 'maps' ? '#4285F4' : '#ffbb00'}`, padding: '25px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                         <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{ins.title}</h3>
                            <p style={{ color: '#ccc', lineHeight: '1.5' }}>{ins.desc}</p>
                         </div>
                         <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', color: '#fff' }}>Ação Recomendada</div>
                      </div>
                   )) : <div className="site-card">Coletando dados para gerar recomendações estratégicas...</div>}
                </div>
             )}

             {/* ABA: PERFORMANCE */}
             {activeTab === 'performance' && (
                <div className="site-card" style={{ padding: 0 }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#0a0a0a' }}><tr style={{ textAlign: 'left', color: '#555', borderBottom: '1px solid #222' }}><th style={{ padding: '15px' }}>Consulta</th><th>Cliques</th><th>Impressões</th><th>Posição</th></tr></thead>
                      <tbody>
                        {data.keywords.slice(0, 50).map((k:any, i:number) => {
                           const prevK = data.previousKeywords?.find((pk:any) => pk.keys[0] === k.keys[0]);
                           const diff = prevK ? k.position - prevK.position : 0;
                           return (
                             <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                                <td style={{ padding: '12px 15px' }}>{k.keys[0]}</td>
                                <td style={{ fontWeight: 'bold' }}>{k.clicks}</td>
                                <td>{k.impressions}</td>
                                <td style={{ color: k.position <= 3 ? '#0070f3' : '#fff' }}>
                                   {k.position.toFixed(1)}
                                   <span style={{ fontSize: '0.75rem', marginLeft: '8px', color: diff < 0 ? '#00ff00' : diff > 0 ? '#ff4444' : '#555' }}>
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

             {/* ABA: PÁGINAS */}
             {activeTab === 'páginas' && (
                <div className="site-card" style={{ padding: 0 }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#0a0a0a' }}><tr style={{ textAlign: 'left', color: '#555', borderBottom: '1px solid #222' }}><th style={{ padding: '15px' }}>URL da Página</th><th>Cliques</th><th>CTR</th><th>Posição</th></tr></thead>
                      <tbody>
                        {data.pages.slice(0, 30).map((p:any, i:number) => (
                           <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                              <td style={{ padding: '12px 15px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                 <a href={p.keys[0]} target="_blank" style={{ color: '#0070f3' }}>{p.keys[0].replace(selectedSite, '') || '/'}</a>
                              </td>
                              <td style={{ fontWeight: 'bold' }}>{p.clicks}</td>
                              <td>{(p.ctr * 100).toFixed(1)}%</td>
                              <td>{p.position.toFixed(1)}</td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             )}

             {/* ABA: PERFIL LOCAL (Google Business Profile) */}
             {activeTab === 'perfil local' && data.maps && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-fade-in">
                    
                    {/* Criar Postagem */}
                    <div className="site-card" style={{ padding: '25px', background: '#0a0a0a' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#fff' }}>Criar Nova Postagem (Update)</h3>
                        <p style={{ color: '#888', marginBottom: '15px', fontSize: '0.9rem' }}>Publique novidades, ofertas ou atualizações diretamente no Google Maps da empresa.</p>
                        <textarea 
                            value={postText}
                            onChange={(e) => setPostText(e.target.value)}
                            placeholder="Ex: Estamos com uma promoção especial de Dia das Mães na Podologia! Agende seu horário..."
                            style={{ width: '100%', minHeight: '100px', background: '#111', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '15px', fontFamily: 'inherit' }}
                        />

                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Agendar para (opcional):</p>
                                <input 
                                    type="datetime-local" 
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px' }}
                                />
                            </div>
                            <button 
                                onClick={handlePost}
                                disabled={!postText}
                                style={{ alignSelf: 'flex-end', background: postText ? (scheduledDate ? '#ffbb00' : '#0070f3') : '#333', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: postText ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                            >
                                {scheduledDate ? 'Agendar Postagem' : 'Publicar Agora'}
                            </button>
                        </div>

                        {/* Lista de Agendados */}
                        {scheduledPosts.length > 0 && (
                            <div style={{ marginTop: '20px', borderTop: '1px solid #222', paddingTop: '20px' }}>
                                <h4 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px' }}>📌 Postagens Agendadas:</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {scheduledPosts.map((p, i) => (
                                        <div key={i} style={{ background: 'rgba(255,187,0,0.05)', border: '1px solid rgba(255,187,0,0.1)', padding: '10px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#ccc', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.content}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#ffbb00' }}>{new Date(p.scheduled_for).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Avaliações */}
                    <div className="site-card" style={{ padding: '25px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Últimas Avaliações</h3>
                        {loadingLocal ? <p style={{ color: '#888' }}>Buscando avaliações...</p> : localReviews.length === 0 ? <p style={{ color: '#888' }}>Nenhuma avaliação encontrada ou ID da conta ausente.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {localReviews.map((review: any, i: number) => {
                                    const ratingNum = review.starRating === 'FIVE' ? 5 : review.starRating === 'FOUR' ? 4 : review.starRating === 'THREE' ? 3 : review.starRating === 'TWO' ? 2 : 1;
                                    const stars = '⭐'.repeat(ratingNum);
                                    const isReplied = !!review.reviewReply;

                                    return (
                                        <div key={i} style={{ borderBottom: '1px solid #222', paddingBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <strong>{review.reviewer?.displayName || 'Cliente Google'}</strong>
                                                <span>{stars}</span>
                                            </div>
                                            <p style={{ color: '#ccc', marginBottom: '15px', fontStyle: 'italic' }}>"{review.comment || 'Avaliação sem texto'}"</p>
                                            
                                            {isReplied ? (
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #00ff00' }}>
                                                    <strong style={{ fontSize: '0.85rem', color: '#00ff00', display: 'block', marginBottom: '5px' }}>Sua Resposta:</strong>
                                                    <p style={{ color: '#aaa', fontSize: '0.9rem' }}>{review.reviewReply.comment}</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input 
                                                        type="text" 
                                                        value={replyText[review.name] || ''}
                                                        onChange={(e) => setReplyText({...replyText, [review.name]: e.target.value})}
                                                        placeholder="Digite sua resposta..."
                                                        style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#fff', padding: '10px 15px', borderRadius: '8px' }}
                                                    />
                                                    <button 
                                                        onClick={() => handleReply(review.name)}
                                                        disabled={!replyText[review.name]}
                                                        style={{ background: replyText[review.name] ? '#0070f3' : '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: replyText[review.name] ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                                                    >
                                                        Responder
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
             )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header className="header"><h1 className="title" style={{ fontSize: '2.5rem' }}>GSC Strategy Engine</h1></header>
      {loading ? <div>Carregando ecossistema...</div> : (
        <div className="sites-grid">
          {sites.map((s) => (
            <div key={s.siteUrl} className="site-card" onClick={() => handleSelectSite(s.siteUrl)} style={{ cursor: 'pointer' }}>
                <h3 className="site-name">{getDisplayUrl(s.siteUrl)}</h3>
                <div className="btn-insight" style={{ marginTop: '20px' }}>Gerar Insights Estratégicos →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
