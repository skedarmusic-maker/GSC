'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TabSEOInsights from '@/components/tabs/TabSEOInsights';
import TabSEOKeywords from '@/components/tabs/TabSEOKeywords';
import TabSEOPages from '@/components/tabs/TabSEOPages';
import TabSEOOpportunities from '@/components/tabs/TabSEOOpportunities';
import TabGBPDashboard from '@/components/tabs/TabGBPDashboard';
import TabGBPAudit from '@/components/tabs/TabGBPAudit';
import TabGBPRank from '@/components/tabs/TabGBPRank';
import TabGBPReviews from '@/components/tabs/TabGBPReviews';
import TabGBPPosts from '@/components/tabs/TabGBPPosts';
import TabHostinger from '@/components/tabs/TabHostinger';
import TabClientConfig from '@/components/tabs/TabClientConfig';
import TabProspecting from '@/components/tabs/TabProspecting';
import TabIntegrations from '@/components/tabs/TabIntegrations';
import TabAdminPanel from '@/components/tabs/TabAdminPanel';
import TabSettings from '@/components/tabs/TabSettings';
import MonthRangePicker from '@/components/MonthRangePicker';
import SubscriptionGate from '@/components/SubscriptionGate';

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [seoAllowed, setSeoAllowed] = useState(false);

  // Estados Gerais
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [activeTab, setActiveTab] = useState('seo-insights');
  const [appMode, setAppMode] = useState<'seo' | 'gbp'>('seo');
  
  const [selectedGbp, setSelectedGbp] = useState<any>(null);
  const [gbpData, setGbpData] = useState<any>(null);
  
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
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  
  const [auditData, setAuditData] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  
  const [trackedKeywords, setTrackedKeywords] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loadingRank, setLoadingRank] = useState(false);
  const [rankRadius, setRankRadius] = useState('15z');
  
  const [competitorData, setCompetitorData] = useState<{ [key: string]: any }>({});
  const [loadingComp, setLoadingComp] = useState<{ [key: string]: boolean }>({});
  
  const [seoOpportunities, setSeoOpportunities] = useState<any[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);
  const [generatingContent, setGeneratingContent] = useState<{ [key: string]: boolean }>({});
  const [viewingDraft, setViewingDraft] = useState<any>(null);

  const [days, setDays] = useState(28);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [isCustom, setIsCustom] = useState(false);
  
  const handleGbpDateChange = (start: string, end: string) => {
    setCustomRange({ start, end });
    setIsCustom(true);
    if (selectedGbp) {
      handleSelectGbpProfile(selectedGbp, { start, end });
    }
  };
  
  const [configLocalPath, setConfigLocalPath] = useState('');
  const [configBusinessContext, setConfigBusinessContext] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [kbTitle, setKbTitle] = useState('');
  const [kbContent, setKbContent] = useState('');
  const [loadingKB, setLoadingKB] = useState(false);
  const [savingKB, setSavingKB] = useState(false);
  const [syncingDesign, setSyncingDesign] = useState(false);
  const [configBranded, setConfigBranded] = useState('');
  const [configProjectFolder, setConfigProjectFolder] = useState('');
  const [configStitchPrompt, setConfigStitchPrompt] = useState('');
  const [savingBranded, setSavingBranded] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [manualDesignCode, setManualDesignCode] = useState('');

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites', { cache: 'no-store' });
      const d = await res.json();
      if (Array.isArray(d)) setSites(d);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const checkUserStatus = async (userId: string, email: string) => {
    if (email === 'gabrielamorimseo@gmail.com' || email === 'focus.earts@gmail.com') {
      setIsAdmin(true);
      setSubscriptionStatus('active');
      setSeoAllowed(true);
      return;
    }
    setCheckingSubscription(true);
    try {
      const res = await fetch('/api/auth/subscription');
      const data = await res.json();
      
      if (data.success) {
        setSubscriptionStatus(data.subscription_status || 'pending');
        const isAllowed = data.seo_allowed ?? false;
        setSeoAllowed(isAllowed);
        if (!isAllowed) {
          setAppMode('gbp');
          setActiveTab('gbp-dashboard');
        }
        if (data.role === 'super_admin') {
          setIsAdmin(true);
        }
      } else {
        console.warn('Erro ao verificar status via API, tentando fallback direto...');
        const { data: dbCredits } = await supabase
          .from('user_credits')
          .select('subscription_status, seo_allowed')
          .eq('user_id', userId)
          .maybeSingle();
        
        const status = (dbCredits as any)?.subscription_status || 'pending';
        const isAllowed = (dbCredits as any)?.seo_allowed ?? false;
        
        setSubscriptionStatus(status);
        setSeoAllowed(isAllowed);
        
        if (!isAllowed) {
          setAppMode('gbp');
          setActiveTab('gbp-dashboard');
        }

        const { data: dbRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        if (dbRole && dbRole.role === 'super_admin') {
          setIsAdmin(true);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status do usuário:', err);
      setSubscriptionStatus('pending');
      setSeoAllowed(false);
      setAppMode('gbp');
      setActiveTab('gbp-dashboard');
    } finally {
      setCheckingSubscription(false);
    }
  };

  useEffect(() => {
    // 1. Validar e capturar sessão atual no Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
      
      if (session) {
        // Interceptar o fetch global para injetar automaticamente o Bearer Token do usuário logado
        const originalFetch = window.fetch;
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          if (session.access_token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${session.access_token}`);
          }
          return originalFetch(input, { ...init, headers });
        };
        fetchSites();
        if (session.user?.id && session.user?.email) {
          checkUserStatus(session.user.id, session.user.email);
        }
      } else {
        window.location.href = '/login';
      }
    });

    // 2. Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
      if (session) {
        const originalFetch = window.fetch;
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          if (session.access_token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${session.access_token}`);
          }
          return originalFetch(input, { ...init, headers });
        };
        fetchSites();
        if (session.user?.id && session.user?.email) {
          checkUserStatus(session.user.id, session.user.email);
        }
      } else {
        window.location.href = '/login';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    window.addEventListener('refresh-clients', fetchSites);
    return () => window.removeEventListener('refresh-clients', fetchSites);
  }, []);

  useEffect(() => {
    if (selectedClient) fetchData(selectedClient.gscUrl, days, selectedClient.gbpData);
    if (selectedGbp && !isCustom) handleSelectGbpProfile(selectedGbp);
  }, [days]);

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
      if (!d.maps && gbpFallback) {
         d.maps = {
           title: gbpFallback.title,
           accountId: gbpFallback.accountId,
           locationId: gbpFallback.name.replace('locations/', ''),
           metrics: { totals: { calls: 0, directions: 0, websiteClicks: 0 }, chartData: [] }
         };
      }
      setData(d);
      if (d.maps?.accountId && d.maps?.locationId) {
        fetchLocalProfile(d.maps.accountId, d.maps.locationId);
        fetchScheduledPosts(d.maps.locationId);
        fetchAudit(d.maps.accountId, d.maps.locationId);
        fetchRankData(d.maps.locationId);
      }
    } catch (err) { console.error(err); } finally { setLoadingPerf(false); }
  };

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
    const { data: posts } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('location_id', locationId)
      .eq('status', 'pending');
    setScheduledPosts(posts || []);
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
  
  const fetchOpportunities = async (clientId: string) => {
    setLoadingOpps(true);
    try {
      const res = await fetch(`/api/opportunities?clientId=${clientId}`);
      const opps = await res.json();
      if (Array.isArray(opps)) setSeoOpportunities(opps);
    } catch (e) { console.error(e); } finally { setLoadingOpps(false); }
  };

  const handleApproveOpportunity = async (oppId: string) => {
    const res = await fetch('/api/opportunities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: oppId, status: 'aprovada' })
    });
    if (res.ok) {
      setSeoOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, status: 'aprovada' } : o));
      handleGenerateContent(oppId);
    }
  };

  const handleGenerateContent = async (oppId: string) => {
    setGeneratingContent(prev => ({ ...prev, [oppId]: true }));
    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: oppId })
      });
      const result = await res.json();
      if (result.success && result.draft && result.draft.length > 50) {
        setSeoOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, status: 'rascunho_gerado', content_draft: result.draft } : o));
        setViewingDraft({ id: oppId, draft: result.draft });
      } else {
        alert('Falha crítica: A IA não conseguiu gerar o texto. Verifique sua chave do Gemini ou o contexto do cliente.');
        setSeoOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, status: 'pendente' } : o));
      }
    } catch (e) { 
      console.error(e); 
      alert('Erro de conexão ao gerar conteúdo.');
    } finally { 
      setGeneratingContent(prev => ({ ...prev, [oppId]: false })); 
    }
  };

  const handleViewLayout = async (opp: any) => {
    if (opp.layout_draft) {
      setViewingDraft({ id: opp.id, draft: opp.content_draft, layout_draft: opp.layout_draft });
      return;
    }
    
    setGeneratingContent(prev => ({ ...prev, [opp.id]: true }));
    try {
      const res = await fetch('/api/ai/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: opp.id })
      });
      const result = await res.json();
      if (result.success) {
        setSeoOpportunities(prev => prev.map(o => o.id === opp.id ? { ...o, status: 'layout_gerado', layout_draft: result.layout_draft } : o));
        setViewingDraft({ id: opp.id, draft: opp.content_draft, layout_draft: result.layout_draft });
      } else {
        alert('Erro ao gerar layout: ' + result.error);
      }
    } catch (e) { console.error(e); } finally { setGeneratingContent(prev => ({ ...prev, [opp.id]: false })); }
  };

  const handleAddKeyword = async () => {
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
          keyword: newKeyword,
          zoom: rankRadius
        })
      });
      const resData = await res.json();
      if (res.ok) { 
        setNewKeyword(''); 
        fetchRankData(mapsData.locationId); 
      } else {
        alert(resData.error || 'Falha ao monitorar palavra-chave.');
      }
    } catch(e) { 
      console.error(e); 
      alert('Erro de conexão ao salvar palavra-chave.');
    } finally { 
      setLoadingRank(false); 
    }
  };

  const fetchCompetitors = async (keyword: string) => {
    const mapsData = data?.maps || (selectedGbp ? {
      locationId: selectedGbp.id.replace('locations/', ''),
      accountId: selectedGbp.accountId,
      title: selectedGbp.name
    } : null);
    if (!mapsData) return;
    setLoadingComp(prev => ({ ...prev, [keyword]: true }));
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: mapsData.locationId,
          accountId: mapsData.accountId,
          businessName: mapsData.title,
          keyword
        })
      });
      const resData = await res.json();
      if (resData.competitors) setCompetitorData(prev => ({ ...prev, [keyword]: resData.competitors }));
    } catch(e) { console.error(e); } finally { setLoadingComp(prev => ({ ...prev, [keyword]: false })); }
  };

  const handleSaveSettings = async () => {
    if (!selectedClient) return;
    setSavingConfig(true);
    try {
      const res = await fetch('/api/sites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedClient.id,
          localPath: configLocalPath,
          businessContext: configBusinessContext
        })
      });
      if (res.ok) {
        alert('Configurações salvas!');
        setSites(prev => prev.map(s => s.id === selectedClient.id ? { ...s, localPath: configLocalPath, businessContext: configBusinessContext } : s));
      }
    } catch (e) { console.error(e); } finally { setSavingConfig(false); }
  };

  const fetchKnowledgeBase = async (clientId: string) => {
    setLoadingKB(true);
    try {
      const res = await fetch(`/api/knowledge?clientId=${clientId}`);
      const data = await res.json();
      if (Array.isArray(data)) setKnowledgeBase(data);
    } catch (e) { console.error(e); } finally { setLoadingKB(false); }
  };

  const handleAddKnowledge = async () => {
    if (!selectedClient || !kbTitle || !kbContent) return;
    setSavingKB(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id, title: kbTitle, content: kbContent })
      });
      if (res.ok) { setKbTitle(''); setKbContent(''); fetchKnowledgeBase(selectedClient.id); }
    } catch (e) { console.error(e); } finally { setSavingKB(false); }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Excluir este conhecimento?')) return;
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchKnowledgeBase(selectedClient.id);
    } catch (e) { console.error(e); }
  };

  const handleSaveBranded = async () => {
    if (!selectedClient) return;
    setSavingBranded(true);
    try {
        const res = await fetch('/api/sites', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedClient.id,
                design_context: { ...selectedClient.design_context, branded_keywords: configBranded },
                projectFolder: configProjectFolder,
                stitchPrompt: configStitchPrompt
            })
        });
        if (res.ok) {
          alert('Configurações de Design (Stitch) atualizadas!');
          setSites(prev => prev.map(s => s.id === selectedClient.id ? { 
            ...s, 
            designContext: { ...s.designContext, branded_keywords: configBranded },
            projectFolder: configProjectFolder,
            stitchPrompt: configStitchPrompt
          } : s));
        }
    } catch(e) { console.error(e); } finally { setSavingBranded(false); }
  };

  const handleSyncDesign = async () => {
    if (!selectedClient || !configLocalPath) return;
    setSyncingDesign(true);
    try {
        const res = await fetch('/api/sites/sync-design', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: selectedClient.id, localPath: configLocalPath })
        });
        const result = await res.json();
        if (result.success) {
          alert('Design sincronizado e Manual da Marca gerado!');
          if (result.stitchPrompt) setConfigStitchPrompt(result.stitchPrompt);
          const folderName = configLocalPath.split(/[\\/]/).pop() || '';
          setConfigProjectFolder(folderName);
          
          setSites(prev => prev.map(s => s.id === selectedClient.id ? { 
            ...s, 
            stitchPrompt: result.stitchPrompt,
            projectFolder: folderName,
            localPath: configLocalPath,
            designContext: {
              ...s.designContext,
              layout: "Sincronizado",
              designTokens: "Sincronizado",
              homePage: "Sincronizado"
            }
          } : s));
          setSelectedClient((prev: any) => prev ? {
            ...prev,
            stitchPrompt: result.stitchPrompt,
            projectFolder: folderName,
            localPath: configLocalPath,
            designContext: {
              ...prev.designContext,
              layout: "Sincronizado",
              designTokens: "Sincronizado",
              homePage: "Sincronizado"
            }
          } : null);
        } else {
          alert('Erro ao sincronizar: ' + result.error);
        }
    } catch (e) { console.error(e); } finally { setSyncingDesign(false); }
  };

  const handleManualSync = async () => {
    if (!selectedClient || !manualDesignCode) return;
    setSyncingDesign(true);
    try {
        const res = await fetch('/api/sites/sync-design', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              clientId: selectedClient.id, 
              manualCode: manualDesignCode 
            })
        });
        const result = await res.json();
        if (result.success) {
          alert('Design Manual Processado!');
          if (result.stitchPrompt) setConfigStitchPrompt(result.stitchPrompt);
          setManualDesignCode('');
          
          setSites(prev => prev.map(s => s.id === selectedClient.id ? { 
            ...s, 
            stitchPrompt: result.stitchPrompt,
            designContext: {
              ...s.designContext,
              designTokens: manualDesignCode
            }
          } : s));
          setSelectedClient((prev: any) => prev ? {
            ...prev,
            stitchPrompt: result.stitchPrompt,
            designContext: {
              ...prev.designContext,
              designTokens: manualDesignCode
            }
          } : null);
        } else {
          alert('Erro ao processar: ' + result.error);
        }
    } catch (e) { console.error(e); } finally { setSyncingDesign(false); }
  };

  const handleSelectClient = (client: any) => {
    fetchKnowledgeBase(client.id);
    setSelectedClient(client);
    setConfigLocalPath(client.localPath || '');
    setConfigBusinessContext(client.businessContext || '');
    setConfigBranded(client.designContext?.branded_keywords || '');
    setConfigProjectFolder(client.projectFolder || '');
    setConfigStitchPrompt(client.stitchPrompt || '');
    setData(null);
    
    // Limpar campos de postagem ao trocar de cliente
    setPostText('');
    setImageUrl('');
    setButtonType('NONE');
    setButtonUrl('');
    setScheduledDate('');
    setEditingPostId(null);

    const gbpTabs = ['gbp-dashboard', 'gbp-audit', 'gbp-rank', 'gbp-reviews', 'gbp-posts'];
    const seoTabs = ['seo-insights', 'seo-keywords', 'seo-pages', 'seo-opportunities', 'client-config'];
    const globalTabs = ['hostinger', 'prospecting', 'integrations', 'agency-settings', 'admin-panel'];

    if (appMode === 'gbp') {
      // Se estamos no modo Maps, tentamos permanecer no Maps
      if (client.gbpData) {
        setSelectedGbp(client.gbpData);
        handleSelectGbpProfile(client.gbpData);
        if (!gbpTabs.includes(activeTab) && !globalTabs.includes(activeTab)) {
          setActiveTab('gbp-dashboard');
        }
      } else {
        setSelectedGbp(null);
        setGbpData(null);
        if (!globalTabs.includes(activeTab)) {
          setActiveTab('gbp-dashboard');
        }
      }
      
      // Carrega dados de SEO em segundo plano se disponível para o caso do usuário mudar de aba
      if (client.seoEnabled && client.type !== 'GBP_ONLY') {
        fetchData(client.gscUrl, days, client.gbpData);
      }
    } else {
      // Se estamos no modo SEO
      if (client.seoEnabled && client.type !== 'GBP_ONLY') {
        setAppMode('seo');
        if (!seoTabs.includes(activeTab) && !globalTabs.includes(activeTab)) {
          setActiveTab('seo-insights');
        }
        fetchData(client.gscUrl, days, client.gbpData);
      } else {
        // Redireciona para o Maps caso o cliente não tenha SEO ativo
        setAppMode('gbp');
        if (!gbpTabs.includes(activeTab) && !globalTabs.includes(activeTab)) {
          setActiveTab('gbp-dashboard');
        }
        if (client.gbpData) {
          setSelectedGbp(client.gbpData);
          handleSelectGbpProfile(client.gbpData);
        } else {
          setSelectedGbp(null);
          setGbpData(null);
        }
      }
    }
  };

  const handleSelectGbpProfile = async (profile: any, range?: { start: string, end: string }) => {
    if (!profile) return;
    
    setSelectedGbp(profile);
    setLoadingPerf(true);

    // Limpar campos de postagem ao trocar de perfil GBP
    setPostText('');
    setImageUrl('');
    setButtonType('NONE');
    setButtonUrl('');
    setScheduledDate('');
    setEditingPostId(null);

    try {
      const accountId = profile.gbpData?.accountId || profile.accountId;
      const rawLocationId = profile.gbpData?.id || profile.id;
      const locationId = rawLocationId?.replace('locations/', '').replace(/^accounts\/[^/]+\//, '');
      const fullLocationName = `locations/${locationId}`;

      const res = await fetch('/api/maps/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          locationName: fullLocationName, 
          days: range ? undefined : days,
          startDate: range?.start,
          endDate: range?.end
        })
      });
      
      const perfData = await res.json();
      
      const safeMetrics = (perfData && !perfData.error) 
        ? perfData 
        : { totals: { calls: 0, directions: 0, websiteClicks: 0 }, chartData: [] };

      const mapsData = {
        title: profile.name || profile.title,
        accountId,
        locationId,
        metrics: safeMetrics.totals,
        chartData: safeMetrics.chartData
      };
      
      setGbpData(mapsData);
      
      if (accountId && locationId) {
        fetchLocalProfile(accountId, locationId);
        fetchAudit(accountId, locationId);
      }
      fetchScheduledPosts(locationId);
      fetchRankData(locationId);
      
    } catch (err) { 
      console.error('Erro ao selecionar perfil GBP:', err); 
    } finally { 
      setLoadingPerf(false); 
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
          businessName: gbpData?.title || 'nossa empresa'
        })
      });
      const result = await res.json();
      if (result.reply) {
        setReplyText(prev => ({ ...prev, [review.name]: result.reply }));
      } else {
        alert('Erro ao gerar resposta: ' + (result.error || 'A IA não retornou texto.'));
      }
    } catch (e) { 
      console.error(e); 
      alert('Falha na comunicação com a API de IA.');
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
      if (res.ok) {
        alert('Resposta enviada!');
        setReplyText({ ...replyText, [reviewName]: '' });
        if (gbpData) fetchLocalProfile(gbpData.accountId, gbpData.locationId);
      }
    } catch(e) { console.error(e); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const filePath = `posts/${Math.random()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('post_image').upload(filePath, file);
      const { data } = supabase.storage.from('post_image').getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
    } catch (error) { console.error(error); } finally { setUploadingImage(false); }
  };

  const [generatingAIPost, setGeneratingAIPost] = useState(false);

  const handleButtonTypeChange = (val: string) => {
    setButtonType(val);
    
    const rawName = gbpData?.title || selectedClient?.name;
    if (val === 'LEARN_MORE') {
      let wpp = '';
      
      // 1. Tentar obter o telefone de forma totalmente dinâmica do auditData (Google Meu Negócio real)
      const phoneItem = auditData?.checklist?.find((item: any) => item.id === 'phone');
      if (phoneItem?.passed && phoneItem.value) {
        const digits = phoneItem.value.replace(/\D/g, '');
        if (digits.length >= 10) {
          wpp = `https://wa.me/${digits.startsWith('55') ? digits : '55' + digits}`;
          console.log('📱 WhatsApp gerado dinamicamente via Google:', wpp);
        }
      }
      
      // 2. Fallback para demonstrações estáticas caso o auditData não tenha telefone ou esteja carregando
      if (!wpp && rawName) {
        const clientName = rawName.toLowerCase();
        if (clientName.includes('amor & patas')) wpp = 'https://wa.me/5534997622017';
        else if (clientName.includes('chaveiro urgente')) wpp = 'https://wa.me/5516993499652';
        else if (clientName.includes('pagani')) wpp = 'https://wa.me/554832495596';
        else if (clientName.includes('simone')) wpp = 'https://wa.me/5511992299294';
        else if (clientName.includes('soft english')) wpp = 'https://wa.me/5511958694687';
      }
      
      if (wpp) {
        setButtonUrl(wpp);
      }
    }
  };

  const handleGenerateAIPost = async (topic: string) => {
    if (!topic || !gbpData) return;
    setGeneratingAIPost(true);
    try {
      const res = await fetch('/api/ai/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          businessName: gbpData.title,
        })
      });
      const result = await res.json();
      if (result.postText) {
        setPostText(result.postText);
      } else {
        alert('Erro ao gerar postagem: ' + (result.error || 'A IA não retornou texto.'));
      }
    } catch (e) {
      console.error(e);
      alert('Falha na comunicação com a API de IA.');
    } finally {
      setGeneratingAIPost(false);
    }
  };

  const handlePost = async () => {
    if (!postText || !gbpData) return;
    try {
      if (scheduledDate) {
        const scheduledTime = new Date(scheduledDate);
        const now = new Date();
        const minTime = Date.now() - 5 * 60 * 1000; // 5 min tolerance
        
        if (scheduledTime.getMonth() !== now.getMonth() || scheduledTime.getFullYear() !== now.getFullYear()) {
          alert('🚫 Limite Excedido: Você só pode agendar postagens para o mês vigente atual.');
          return;
        }
        if (scheduledTime.getTime() < minTime) {
          alert('🚫 Data Inválida: Não é possível agendar uma postagem em data retroativa.');
          return;
        }
      }

      if (editingPostId) {
        await supabase.from('scheduled_posts').update({
          scheduled_for: scheduledDate ? new Date(scheduledDate).toISOString() : new Date().toISOString(),
          content: postText,
          image_url: imageUrl,
          button_type: buttonType,
          button_url: buttonUrl,
          status: 'pending'
        }).eq('id', editingPostId);
        alert('Agendamento atualizado!');
        setEditingPostId(null);
        fetchScheduledPosts(gbpData.locationId);
      } else if (scheduledDate) {
        await supabase.from('scheduled_posts').insert([{
          scheduled_for: new Date(scheduledDate).toISOString(),
          content: postText,
          image_url: imageUrl,
          button_type: buttonType,
          button_url: buttonUrl,
          location_id: gbpData.locationId,
          account_id: gbpData.accountId,
          status: 'pending'
        }]);
        alert('Agendado!');
        fetchScheduledPosts(gbpData.locationId);
      } else {
        await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: gbpData.accountId,
            locationId: gbpData.locationId,
            postText, imageUrl, buttonType, buttonUrl
          })
        });
        alert('Publicado!');
      }
      setPostText(''); setImageUrl(''); setScheduledDate(''); setButtonType('NONE'); setButtonUrl('');
      setEditingPostId(null);
    } catch(e) { console.error(e); }
  };

  const handleEditScheduledPost = (post: any) => {
    setPostText(post.content || '');
    setImageUrl(post.image_url || '');
    setButtonType(post.button_type || 'NONE');
    setButtonUrl(post.button_url || '');
    if (post.scheduled_for) {
      const d = new Date(post.scheduled_for);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
      setScheduledDate(localISOTime);
    } else {
      setScheduledDate('');
    }
    setEditingPostId(post.id);
  };

  const handleDeleteScheduledPost = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      await supabase.from('scheduled_posts').delete().eq('id', id);
      setScheduledPosts(prev => prev.filter((p: any) => p.id !== id));
      if (editingPostId === id) {
        setPostText(''); setImageUrl(''); setScheduledDate(''); setButtonType('NONE'); setButtonUrl('');
        setEditingPostId(null);
      }
      alert('Agendamento cancelado!');
    } catch(e) {
      console.error(e);
      alert('Erro ao cancelar agendamento.');
    }
  };

  const getStrategicInsights = () => {
    if (!data?.keywords) return [];
    return data.keywords.filter((k:any) => k.position > 3 && k.position <= 12).slice(0, 3).map((k:any) => ({
      type: 'gold',
      title: '🚀 Oportunidade de Ouro',
      desc: `"${k.keys[0]}" na pos ${k.position.toFixed(1)}. Salte para o Top 3!`
    }));
  };

  useEffect(() => {
    if (activeTab === 'seo-opportunities' && selectedClient?.id) fetchOpportunities(selectedClient.id);
  }, [activeTab, selectedClient]);

  const gscSites = seoAllowed ? sites.filter((s: any) => !!s.gscUrl && s.type !== 'PROSPECT' && s.seoEnabled) : [];
  const gbpProfiles = sites.filter((s: any) => !!s.gbpData && s.type !== 'PROSPECT');

  if (loadingSession || checkingSubscription) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff9d]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Portão de assinatura — bloqueia acesso ao dashboard se não for assinante ativo
  if (subscriptionStatus !== null && subscriptionStatus !== 'active') {
    return <SubscriptionGate userEmail={session.user?.email || ''} />;
  }

  return (
    <div className="min-h-screen bg-[#06090e] text-[#f0f6fc] flex flex-col lg:flex-row font-sans">
      
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#00ff9d]/10 bg-[#080b10] sticky top-0 z-50 print:hidden">
          <div className="flex items-center gap-2">
            <svg className="w-7 h-7 text-[#00ff9d] filter drop-shadow-[0_0_6px_rgba(0,255,157,0.5)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="mobLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00ff9d" />
                  <stop offset="100%" stopColor="#05c475" />
                </linearGradient>
              </defs>
              <path d="M50 15 L85 75 A4 4 0 0 1 81.5 81 L18.5 81 A4 4 0 0 1 15 75 Z" stroke="url(#mobLogoGrad)" strokeWidth="11" strokeLinejoin="round" strokeLinecap="round" />
              <path d="M50 32 L70 67 L30 67 Z" fill="url(#mobLogoGrad)" fillOpacity="0.18" />
            </svg>
            <span className="text-base font-black tracking-tighter text-white">GSC<span className="text-[#00ff9d]">Strategy</span></span>
          </div>
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-gray-400">
              {showMobileMenu ? '✕' : '☰'}
          </button>
      </div>

      <aside className={`${showMobileMenu ? 'flex' : 'hidden lg:flex'} fixed lg:static inset-0 lg:inset-auto z-40 w-full lg:w-[270px] bg-[#080b10] border-r border-[#00ff9d]/10 flex-col shrink-0 h-screen print:hidden`}>
        <div className="p-5 pt-20 lg:pt-5 border-b border-[#00ff9d]/10">
          <div className="flex items-center gap-3.5 mb-6 hidden lg:flex">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[#00ff9d]/10 blur-md rounded-full w-8 h-8"></div>
              <svg className="w-8 h-8 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sideLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00ff9d" />
                    <stop offset="100%" stopColor="#05c475" />
                  </linearGradient>
                </defs>
                <path d="M50 15 L85 75 A4 4 0 0 1 81.5 81 L18.5 81 A4 4 0 0 1 15 75 Z" stroke="url(#sideLogoGrad)" strokeWidth="11" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M50 32 L70 67 L30 67 Z" fill="url(#sideLogoGrad)" fillOpacity="0.18" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tighter text-white">GSC<span className="text-[#00ff9d] ml-0.5">Strategy</span></span>
          </div>
          
          {/* Ocultar seletor se o cliente atual tiver SEO desativado ou se o Módulo SEO não for permitido globalmente */}
          {seoAllowed && (!selectedClient?.id || selectedClient.seoEnabled) && (!selectedGbp?.id || selectedGbp.seoEnabled) && (
            <div className="flex bg-[#06090e] p-1 rounded-lg border border-gray-800 gap-1">
              <button onClick={() => { setAppMode('seo'); setActiveTab('seo-insights'); setShowMobileMenu(false); }}
                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${appMode === 'seo' ? 'bg-[#00ff9d] text-gray-900 shadow-[0_0_10px_rgba(0,255,157,0.35)]' : 'text-gray-400'}`}>🌐 SEO</button>
              <button onClick={() => { setAppMode('gbp'); setActiveTab('gbp-dashboard'); setShowMobileMenu(false); }}
                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${appMode === 'gbp' ? 'bg-[#00ff9d] text-gray-900 shadow-[0_0_10px_rgba(0,255,157,0.35)]' : 'text-gray-400'}`}>📍 Maps</button>
            </div>
          )}
        </div>

        <div className="p-4 border-b border-gray-800">
          {appMode === 'seo' ? (
            <select value={selectedClient?.id || ''} onChange={(e) => {
                const client = gscSites.find((c:any) => c.id === e.target.value);
                if (client) handleSelectClient(client);
                else { setSelectedClient(null); setData(null); }
                setShowMobileMenu(false);
              }}
              className="w-full bg-[#0d1117] border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2.5">
              <option value="">Selecionar GSC...</option>
              {gscSites.map((c:any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          ) : (
            <select value={selectedGbp?.id || ''} onChange={(e) => {
                const client = gbpProfiles.find((p:any) => p.id === e.target.value);
                if (client) handleSelectClient(client);
                else { setSelectedClient(null); setSelectedGbp(null); setGbpData(null); }
                setShowMobileMenu(false);
              }}
              className="w-full bg-[#0d1117] border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2.5">
              <option value="">Selecionar Maps...</option>
              {gbpProfiles.map((p:any) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {appMode === 'seo' && selectedClient && (
            <ul className="space-y-1 text-sm">
              <li><button onClick={() => { setActiveTab('seo-insights'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'seo-insights' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400'}`}>✨ Insights IA</button></li>
              <li><button onClick={() => { setActiveTab('seo-keywords'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'seo-keywords' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400'}`}>📊 Palavras-chave</button></li>
              <li><button onClick={() => { setActiveTab('seo-pages'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'seo-pages' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400'}`}>📄 Top Páginas</button></li>
              <li><button onClick={() => { setActiveTab('seo-opportunities'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'seo-opportunities' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400'}`}>🎯 Oportunidades</button></li>
              <li><button onClick={() => { setActiveTab('client-config'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'client-config' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400'}`}>⚙️ Configurações</button></li>
            </ul>
          )}
          {appMode === 'gbp' && selectedGbp && (
            <ul className="space-y-1 text-sm">
              <li><button onClick={() => { setActiveTab('gbp-dashboard'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'gbp-dashboard' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400'}`}>🏪 Resumo Local</button></li>
              <li><button onClick={() => { setActiveTab('gbp-audit'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'gbp-audit' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400'}`}>🛡️ Auditoria</button></li>
              <li><button onClick={() => { setActiveTab('gbp-rank'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'gbp-rank' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400'}`}>📈 Rank Tracker</button></li>
              <li><button onClick={() => { setActiveTab('gbp-reviews'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${activeTab === 'gbp-reviews' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400'}`}>
                <span>⭐ Avaliações</span>
                {localReviews.filter((r: any) => !r.reviewReply).length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {localReviews.filter((r: any) => !r.reviewReply).length}
                  </span>
                )}
              </button></li>
              <li><button onClick={() => { setActiveTab('gbp-posts'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'gbp-posts' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400'}`}>📣 Postagens</button></li>
            </ul>
          )}
          
          {/* Botão Hostinger Global */}
          <div className="pt-4 mt-4 border-t border-gray-800">
            <button onClick={() => { setActiveTab('hostinger'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md font-bold transition-all ${activeTab === 'hostinger' ? 'bg-purple-500/10 text-purple-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}>
              🟣 Hostinger
            </button>
            <button onClick={() => { setActiveTab('prospecting'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md font-bold transition-all mt-1 ${activeTab === 'prospecting' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}>
              🔍 Prospecção
            </button>
            <button onClick={() => { setActiveTab('integrations'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md font-bold transition-all mt-1 ${activeTab === 'integrations' ? 'bg-blue-500/10 text-blue-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}>
              🔌 Integrações
            </button>
            <button onClick={() => { setActiveTab('agency-settings'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md font-bold transition-all mt-1 ${activeTab === 'agency-settings' ? 'bg-orange-500/10 text-orange-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}>
              🎨 Personalizar Agência
            </button>
            {isAdmin && (
              <button onClick={() => { setActiveTab('admin-panel'); setShowMobileMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md font-bold transition-all mt-1 ${activeTab === 'admin-panel' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}>
                👑 Super Admin
              </button>
            )}
          </div>

          {/* Rodapé: info do usuário + botão sair */}
          <div className="mt-auto pt-4 border-t border-gray-800">
            <div className="px-3 py-2 mb-2">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Logado como</p>
              <p className="text-xs text-gray-400 font-semibold truncate mt-0.5">{session?.user?.email || ''}</p>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="w-full text-left px-3 py-2 rounded-md font-bold transition-all text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 text-sm"
            >
              <span>⏻</span>
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden print:h-auto print:overflow-visible">
        <header className="h-[64px] border-b border-[#00ff9d]/10 bg-[#080b10] flex items-center justify-between px-8 print:hidden">
          <span className="text-sm font-bold text-white">
            {appMode === 'seo' ? (selectedClient?.name || 'Dashboard') : (selectedGbp?.name || 'Dashboard')}
          </span>
          

          {appMode === 'seo' && selectedClient && (
            <div className="flex bg-[#06090e] p-1 rounded-lg border border-gray-800 gap-1">
              {[7, 28, 90, 180, 365].map(v => (
                <button key={v} onClick={() => setDays(v)} className={`px-3 py-1 rounded text-[10px] font-bold ${days === v ? 'bg-[#00ff9d] text-gray-900 shadow-[0_0_10px_rgba(0,255,157,0.35)]' : 'text-gray-400'}`}>
                  {v === 180 ? '6m' : v === 365 ? '12m' : `${v}d`}
                </button>
              ))}
            </div>
          )}

          {appMode === 'gbp' && selectedGbp && (
            <MonthRangePicker 
              onRangeSelect={handleGbpDateChange}
              initialStart={customRange.start}
              initialEnd={customRange.end}
            />
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible print:bg-[#06090e]">
          {appMode === 'seo' && selectedClient && (
            <div className="max-w-6xl mx-auto">
              {activeTab === 'seo-insights' && <TabSEOInsights data={data} getStrategicInsights={getStrategicInsights} />}
              {activeTab === 'seo-keywords' && <TabSEOKeywords data={data} />}
              {activeTab === 'seo-pages' && <TabSEOPages data={data} selectedClient={selectedClient} />}
              {activeTab === 'seo-opportunities' && (
                <TabSEOOpportunities
                  seoOpportunities={seoOpportunities}
                  loadingOpps={loadingOpps}
                  generatingContent={generatingContent}
                  viewingDraft={viewingDraft}
                  configBranded={configBranded}
                  selectedClient={selectedClient}
                  setViewingDraft={setViewingDraft}
                  fetchOpportunities={fetchOpportunities}
                  handleApproveOpportunity={handleApproveOpportunity}
                  handleViewLayout={handleViewLayout}
                />
              )}
              {activeTab === 'client-config' && (
                <TabClientConfig
                  configLocalPath={configLocalPath}
                  configBusinessContext={configBusinessContext}
                  configBranded={configBranded}
                  configProjectFolder={configProjectFolder}
                  configStitchPrompt={configStitchPrompt}
                  savingConfig={savingConfig}
                  savingBranded={savingBranded}
                  syncingDesign={syncingDesign}
                  knowledgeBase={knowledgeBase}
                  loadingKB={loadingKB}
                  savingKB={savingKB}
                  kbTitle={kbTitle}
                  kbContent={kbContent}
                  selectedClient={selectedClient}
                  setConfigLocalPath={setConfigLocalPath}
                  setConfigBusinessContext={setConfigBusinessContext}
                  setConfigBranded={setConfigBranded}
                  setConfigProjectFolder={setConfigProjectFolder}
                  setConfigStitchPrompt={setConfigStitchPrompt}
                  setKbTitle={setKbTitle}
                  setKbContent={setKbContent}
                  handleSaveSettings={handleSaveSettings}
                  handleSaveBranded={handleSaveBranded}
                  handleSyncDesign={handleSyncDesign}
                  handleAddKnowledge={handleAddKnowledge}
                  handleDeleteKnowledge={handleDeleteKnowledge}
                  manualDesignCode={manualDesignCode}
                  setManualDesignCode={setManualDesignCode}
                  handleManualSync={handleManualSync}
                />
              )}
            </div>
          )}

          {appMode === 'gbp' && selectedGbp && (
            <div className="max-w-6xl mx-auto">
              {activeTab === 'gbp-dashboard' && <TabGBPDashboard gbpData={gbpData} days={days} />}
              {activeTab === 'gbp-audit' && <TabGBPAudit auditData={auditData} loadingAudit={loadingAudit} />}
              {activeTab === 'gbp-rank' && (
                <TabGBPRank
                  trackedKeywords={trackedKeywords}
                  newKeyword={newKeyword}
                  loadingRank={loadingRank}
                  rankRadius={rankRadius}
                  competitorData={competitorData}
                  loadingComp={loadingComp}
                  gbpData={gbpData}
                  selectedGbp={selectedGbp}
                  setNewKeyword={setNewKeyword}
                  setRankRadius={setRankRadius}
                  handleAddKeyword={handleAddKeyword}
                  fetchCompetitors={fetchCompetitors}
                />
              )}
              {activeTab === 'gbp-reviews' && (
                <TabGBPReviews
                  localReviews={localReviews}
                  loadingLocal={loadingLocal}
                  replyText={replyText}
                  generatingAI={generatingAI}
                  setReplyText={setReplyText}
                  handleGenerateAI={handleGenerateAI}
                  handleReply={handleReply}
                />
              )}
              {activeTab === 'gbp-posts' && (
                <TabGBPPosts
                  postText={postText}
                  imageUrl={imageUrl}
                  uploadingImage={uploadingImage}
                  buttonType={buttonType}
                  buttonUrl={buttonUrl}
                  scheduledDate={scheduledDate}
                  generatingAIPost={generatingAIPost}
                  gbpTitle={gbpData?.title}
                  scheduledPosts={scheduledPosts}
                  editingPostId={editingPostId}
                  setPostText={setPostText}
                  setImageUrl={setImageUrl}
                  setButtonType={handleButtonTypeChange}
                  setButtonUrl={setButtonUrl}
                  setScheduledDate={setScheduledDate}
                  handleImageUpload={handleImageUpload}
                  handlePost={handlePost}
                  handleGenerateAIPost={handleGenerateAIPost}
                  handleDeleteScheduledPost={handleDeleteScheduledPost}
                  handleEditScheduledPost={handleEditScheduledPost}
                  cancelEdit={() => {
                    setPostText('');
                    setImageUrl('');
                    setButtonType('NONE');
                    setButtonUrl('');
                    setScheduledDate('');
                    setEditingPostId(null);
                  }}
                />
              )}
            </div>
          )}

          {appMode === 'gbp' && !selectedGbp && selectedClient && (
            <div className="max-w-md mx-auto my-20 bg-[#161b22] border border-gray-800 rounded-2xl p-8 text-center relative overflow-hidden animate-fadeIn">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/5 blur-[60px] pointer-events-none" />
              <svg
                className="text-yellow-500 w-12 h-12 mx-auto mb-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3 className="text-white font-black text-lg uppercase tracking-tight">Sem Ficha de Maps</h3>
              <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                Este cliente ({selectedClient.name}) não possui uma ficha do Google Meu Negócio vinculada ao GSC Strategy.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    setActiveTab('client-config');
                    setAppMode('seo');
                  }}
                  className="bg-[#00ff9d] hover:bg-[#02e08a] text-black font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,157,0.2)]"
                >
                  Configurar Cliente
                </button>
              </div>
            </div>
          )}

          {/* Renderização Global (Não depende de cliente selecionado) */}
          {activeTab === 'hostinger' && (
            <div className="max-w-6xl mx-auto">
              <TabHostinger sites={sites} />
            </div>
          )}
          {activeTab === 'prospecting' && (
            <div className="max-w-6xl mx-auto">
              <TabProspecting session={session} />
            </div>
          )}
          {activeTab === 'integrations' && (
            <div className="max-w-6xl mx-auto">
              <TabIntegrations session={session} />
            </div>
          )}
          {activeTab === 'agency-settings' && (
            <div className="max-w-6xl mx-auto">
              <TabSettings session={session} />
            </div>
          )}
          {activeTab === 'admin-panel' && isAdmin && (
            <div className="max-w-6xl mx-auto">
              <TabAdminPanel session={session} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
