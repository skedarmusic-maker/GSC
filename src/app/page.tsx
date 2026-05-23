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
import MonthRangePicker from '@/components/MonthRangePicker';

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

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

  useEffect(() => {
    fetchSites();
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
      if (res.ok) { setNewKeyword(''); fetchRankData(mapsData.locationId); }
    } catch(e) { console.error(e); } finally { setLoadingRank(false); }
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
          setSelectedClient(prev => prev ? {
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
          setSelectedClient(prev => prev ? {
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

    if (client.type !== 'GBP_ONLY') {
       setActiveTab('seo-insights');
       fetchData(client.gscUrl, days, client.gbpData);
    } else {
       setActiveTab('gbp-dashboard');
       handleSelectGbpProfile(client.gbpData);
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
    if (val === 'LEARN_MORE' && rawName) {
      const clientName = rawName.toLowerCase();
      let wpp = '';
      
      if (clientName.includes('amor & patas')) wpp = 'https://wa.me/5534997622017';
      else if (clientName.includes('chaveiro urgente')) wpp = 'https://wa.me/5516993499652';
      else if (clientName.includes('pagani')) wpp = 'https://wa.me/554832495596';
      else if (clientName.includes('simone')) wpp = 'https://wa.me/5511992299294';
      else if (clientName.includes('soft english')) wpp = 'https://wa.me/5511958694687';
      
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

  const gscSites = sites.filter((s: any) => !!s.gscUrl && s.type !== 'PROSPECT');
  const gbpProfiles = sites.filter((s: any) => !!s.gbpData && s.type !== 'PROSPECT');

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col lg:flex-row font-sans">
      
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-[#0d1117] sticky top-0 z-50 print:hidden">
          <h1 className="text-lg font-black tracking-tighter" style={{ color: '#00ff9d' }}>GSC<span className="text-white">Strategy</span></h1>
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-gray-400">
              {showMobileMenu ? '✕' : '☰'}
          </button>
      </div>

      <aside className={`${showMobileMenu ? 'flex' : 'hidden lg:flex'} fixed lg:static inset-0 lg:inset-auto z-40 w-full lg:w-[270px] bg-[#0d1117] border-r border-gray-800 flex-col shrink-0 h-screen print:hidden`}>
        <div className="p-5 pt-20 lg:pt-5 border-b border-gray-800">
          <h1 className="text-2xl font-black tracking-tighter mb-6 hidden lg:block text-white">GSC<span className="text-[#00ff9d] ml-1">Strategy</span></h1>
          <div className="flex bg-[#161b22] p-1 rounded-lg border border-gray-800 gap-1">
            <button onClick={() => { setAppMode('seo'); setActiveTab('seo-insights'); setShowMobileMenu(false); }}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${appMode === 'seo' ? 'bg-[#00ff9d] text-gray-900' : 'text-gray-400'}`}>🌐 SEO</button>
            <button onClick={() => { setAppMode('gbp'); setActiveTab('gbp-dashboard'); setShowMobileMenu(false); }}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${appMode === 'gbp' ? 'bg-[#00ff9d] text-gray-900' : 'text-gray-400'}`}>📍 Maps</button>
          </div>
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
                handleSelectGbpProfile(gbpProfiles.find((p:any) => p.id === e.target.value));
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
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden print:h-auto print:overflow-visible">
        <header className="h-[64px] border-b border-gray-800 bg-[#0d1117] flex items-center justify-between px-8 print:hidden">
          <span className="text-sm font-bold text-white">
            {appMode === 'seo' ? (selectedClient?.name || 'Dashboard') : (selectedGbp?.name || 'Dashboard')}
          </span>
          

          {appMode === 'seo' && selectedClient && (
            <div className="flex bg-[#161b22] p-1 rounded-lg border border-gray-800 gap-1">
              {[7, 28, 90, 180, 365].map(v => (
                <button key={v} onClick={() => setDays(v)} className={`px-3 py-1 rounded text-[10px] font-bold ${days === v ? 'bg-[#00ff9d] text-gray-900' : 'text-gray-400'}`}>
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

        <main className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible print:bg-[#0d1117]">
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

          {/* Renderização Global (Não depende de cliente selecionado) */}
          {activeTab === 'hostinger' && (
            <div className="max-w-6xl mx-auto">
              <TabHostinger sites={sites} />
            </div>
          )}
          {activeTab === 'prospecting' && (
            <div className="max-w-6xl mx-auto">
              <TabProspecting />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
