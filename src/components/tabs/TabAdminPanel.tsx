import { useState, useEffect } from 'react';
import { 
  Users, 
  Globe, 
  Search, 
  ToggleLeft, 
  ToggleRight, 
  Coins, 
  ShieldAlert, 
  CheckCircle, 
  Sparkles, 
  UserCheck, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Minus,
  Edit2
} from 'lucide-react';

interface TabAdminPanelProps {
  session: any;
}

export default function TabAdminPanel({ session }: TabAdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [data, setData] = useState<{ clients: any[]; users: any[]; logs: any[] }>({ clients: [], users: [], logs: [] });
  const [clientSearch, setClientSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'users' | 'logs'>('clients');
  const [clientFilter, setClientFilter] = useState<'real' | 'prospect' | 'all'>('real');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Estados do modal de edição de créditos
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [modalMonthly, setModalMonthly] = useState<number>(150);
  const [modalPurchased, setModalPurchased] = useState<number>(0);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const resData = await res.json();
      if (resData.success) {
        setData({ clients: resData.clients || [], users: resData.users || [], logs: resData.logs || [] });
      } else {
        setMessage({ text: resData.error || 'Erro ao carregar dados do admin.', type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: 'Falha de rede ao carregar painel admin.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAdminData();
    }
  }, [session]);

  const handleToggleSeo = async (clientId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setActionLoading(`seo-${clientId}`);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'toggle_seo',
          clientId,
          enabled: nextStatus
        })
      });
      const resData = await res.json();
      if (resData.success) {
        // Atualizar lista localmente
        setData(prev => ({
          ...prev,
          clients: prev.clients.map(c => c.id === clientId ? { ...c, seoEnabled: nextStatus } : c)
        }));
        
        // Disparar evento para que a barra lateral ou outros componentes fiquem sabendo
        window.dispatchEvent(new Event('refresh-clients'));

        setMessage({ text: `SEO do cliente atualizado com sucesso!`, type: 'success' });
      } else {
        setMessage({ text: resData.error || 'Erro ao alternar status do SEO.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveCredits = async () => {
    if (!editingUser) return;
    setActionLoading(`credits-${editingUser.id}`);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'update_credits',
          userId: editingUser.id,
          monthlyAllowance: modalMonthly,
          purchasedCredits: modalPurchased
        })
      });
      const resData = await res.json();
      if (resData.success) {
        setData(prev => ({
          ...prev,
          users: prev.users.map(u => u.id === editingUser.id ? { 
            ...u, 
            monthlyAllowance: modalMonthly, 
            purchasedCredits: modalPurchased 
          } : u)
        }));
        setMessage({ text: `Créditos de ${editingUser.email} atualizados com sucesso!`, type: 'success' });
        setEditingUser(null);
      } else {
        setMessage({ text: resData.error || 'Erro ao salvar créditos.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSubscriptionStatus = async (userId: string, nextStatus: string) => {
    setActionLoading(`sub-${userId}`);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'update_subscription',
          userId,
          subscriptionStatus: nextStatus
        })
      });
      const resData = await res.json();
      if (resData.success) {
        let nextAllowance = 0;
        if (nextStatus === 'trial') nextAllowance = 1;
        else if (nextStatus === 'active') nextAllowance = 150;
        else nextAllowance = 0;

        setData(prev => ({
          ...prev,
          users: prev.users.map(u => u.id === userId ? { 
            ...u, 
            subscriptionStatus: nextStatus,
            monthlyAllowance: nextStatus === 'trial' ? 1 : nextStatus === 'active' ? 150 : u.monthlyAllowance
          } : u)
        }));
        setMessage({ text: `Assinatura atualizada para "${nextStatus === 'active' ? 'Ativo' : nextStatus === 'trial' ? 'Teste' : nextStatus === 'cancelled' ? 'Cancelado' : 'Pendente'}" com sucesso!`, type: 'success' });
      } else {
        setMessage({ text: resData.error || 'Erro ao alterar assinatura.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'super_admin' ? 'user' : 'super_admin';
    if (!confirm(`Deseja alterar o perfil deste usuário para ${nextRole}?`)) return;
    
    setActionLoading(`role-${userId}`);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'update_role',
          userId,
          role: nextRole
        })
      });
      const resData = await res.json();
      if (resData.success) {
        setData(prev => ({
          ...prev,
          users: prev.users.map(u => u.id === userId ? { ...u, role: nextRole } : u)
        }));
        setMessage({ text: `Perfil do usuário atualizado para ${nextRole}!`, type: 'success' });
      } else {
        setMessage({ text: resData.error || 'Erro ao alterar perfil do usuário.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserSeo = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setActionLoading(`userseo-${userId}`);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'toggle_user_seo',
          userId,
          enabled: nextStatus
        })
      });
      const resData = await res.json();
      if (resData.success) {
        setData(prev => ({
          ...prev,
          users: prev.users.map(u => u.id === userId ? { ...u, seoAllowed: nextStatus } : u)
        }));
        setMessage({ text: `Módulo SEO do usuário atualizado com sucesso!`, type: 'success' });
      } else {
        setMessage({ text: resData.error || 'Erro ao alternar permissão do módulo SEO.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  // Separação de clientes reais vs leads
  const realClients = data.clients.filter(c => !!c.gscUrl || !!c.gbpLocationId);
  const prospectLeads = data.clients.filter(c => !c.gscUrl && !c.gbpLocationId);

  // Filtragem por tipo + busca
  const clientsByType = clientFilter === 'real' ? realClients : clientFilter === 'prospect' ? prospectLeads : data.clients;
  const filteredClients = clientsByType.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.ownerEmail.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredUsers = data.users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.fullName.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus = userStatusFilter === 'all' || u.subscriptionStatus === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Cards de métricas do SaaS - Filtrando corretamente por status de assinatura
  const activeSubscribers = data.users.filter(u => u.subscriptionStatus === 'active').length;
  const trialUsers = data.users.filter(u => u.subscriptionStatus === 'trial').length;
  const pendingUsers = data.users.filter(u => u.subscriptionStatus === 'pending').length;
  const totalUsersCount = data.users.length;
  
  const estimatedRevenue = activeSubscribers * 89;
  const totalKeywordsMonitored = data.clients.filter(c => c.seoEnabled).length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#00ff9d] mb-1.5 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Painel de Controle Administrativo</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">👑 Super Admin</h2>
          <p className="text-sm text-gray-400">Gerencie todos os clientes ativados, permissões de SEO e saldos de créditos dos usuários.</p>
        </div>
        <button 
          onClick={fetchAdminData}
          disabled={loading}
          className="px-4 py-2.5 bg-[#161b22] hover:bg-[#1f242c] disabled:opacity-50 border border-gray-800 hover:border-gray-700 text-xs font-bold text-gray-300 rounded-xl transition-all flex items-center gap-2 self-start md:self-center"
        >
          {loading ? 'Sincronizando...' : '🔄 Sincronizar Dados'}
        </button>
      </div>

      {/* Alerta de Mensagem Curta */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${message.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[10px] underline uppercase opacity-70 hover:opacity-100">Ignorar</button>
        </div>
      )}

      {/* Cartões de Métricas Corporativas SaaS (Wow effect para Gabriel!) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#161b22]/60 border border-gray-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-[#00ff9d]/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ff9d]/5 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-[#00ff9d]/10"></div>
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 text-[#00ff9d] rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wide">Usuários da Plataforma</span>
              <span className="text-3xl font-black text-white mt-1 block">{totalUsersCount} <span className="text-xs font-semibold text-gray-500">gestores</span></span>
              <div className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider flex flex-wrap gap-x-2">
                <span className="text-[#00ff9d]">{activeSubscribers} Premium</span>
                <span className="text-gray-600">•</span>
                <span className="text-blue-400">{trialUsers} Em Teste</span>
                <span className="text-gray-600">•</span>
                <span className="text-amber-500">{pendingUsers} Pendentes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#161b22]/60 border border-gray-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-blue-500/10"></div>
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wide">Faturamento Estimado</span>
              <span className="text-3xl font-black text-white mt-1 block">R$ {estimatedRevenue.toLocaleString('pt-BR')},00 <span className="text-xs font-semibold text-blue-400">/mês</span></span>
            </div>
          </div>
        </div>

        <div className="bg-[#161b22]/60 border border-gray-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-blue-500/10"></div>
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wide">Módulos SEO Plus</span>
              <span className="text-3xl font-black text-white mt-1 block">{totalKeywordsMonitored} <span className="text-xs font-semibold text-gray-500">licenciados</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Internas */}
      <div className="flex border-b border-gray-800/80">
        <button 
          onClick={() => setActiveSubTab('clients')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-all uppercase tracking-wider ${
            activeSubTab === 'clients' 
              ? 'border-[#00ff9d] text-white' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          📂 Clientes Reais ({realClients.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('users')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-all uppercase tracking-wider ${
            activeSubTab === 'users' 
              ? 'border-[#00ff9d] text-white' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          👥 Usuários & Cotas ({data.users.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('logs')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-all uppercase tracking-wider ${
            activeSubTab === 'logs' 
              ? 'border-[#00ff9d] text-white' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          📊 Requisições & APIs ({data.logs?.length || 0})
        </button>
      </div>

      {/* TAB 1: CLIENTES & TOGGLE SEO */}
      {activeSubTab === 'clients' && (
        <div className="space-y-4">
          {/* Filtros de tipo de cliente */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setClientFilter('real')}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                clientFilter === 'real'
                  ? 'bg-[#00ff9d]/10 border-[#00ff9d]/30 text-[#00ff9d]'
                  : 'bg-[#161b22] border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              🏢 Clientes Reais <span className="ml-1 opacity-70">({realClients.length})</span>
            </button>
            <button
              onClick={() => setClientFilter('prospect')}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                clientFilter === 'prospect'
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-[#161b22] border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              🔍 Leads de Prospecção <span className="ml-1 opacity-70">({prospectLeads.length})</span>
            </button>
            <button
              onClick={() => setClientFilter('all')}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                clientFilter === 'all'
                  ? 'bg-gray-700/50 border-gray-600 text-white'
                  : 'bg-[#161b22] border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              📋 Todos <span className="ml-1 opacity-70">({data.clients.length})</span>
            </button>
          </div>

          {/* Info contextual */}
          {clientFilter === 'prospect' && (
            <div className="p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl text-[11px] text-orange-400/80">
              ⚠️ Estes são leads capturados pelo módulo de Prospecção — não possuem GBP nem GSC vinculado. O módulo SEO não pode ser ativado para eles.
            </div>
          )}

          {/* Caixa de Busca */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input 
              type="text"
              placeholder="Buscar por cliente ou e-mail do gestor..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full bg-[#161b22] border border-gray-800 focus:border-[#00ff9d]/30 text-xs text-white placeholder-gray-600 rounded-xl pl-12 pr-4 py-3 outline-none"
            />
          </div>

          <div className="bg-[#161b22]/40 border border-gray-800/80 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500 text-xs font-bold animate-pulse">
                Carregando base de clientes do SaaS...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs font-bold">
                Nenhum cliente correspondente encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 bg-[#161b22]/80 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">🏢 Nome do Cliente</th>
                      <th className="p-4">🔑 Gestor Responsável</th>
                      <th className="p-4">🔌 Integrações Detectadas</th>
                      <th className="p-4 text-center">🌐 Módulo SEO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 text-gray-300 font-medium">
                    {filteredClients.map((client) => {
                      const isGsc = !!client.gscUrl;
                      const isGbp = !!client.gbpLocationId;
                      return (
                        <tr key={client.id} className="hover:bg-gray-800/20 transition-all duration-150">
                          <td className="p-4 pl-6 font-bold text-white">
                            <div className="flex flex-col">
                              <span>{client.name}</span>
                              {client.websiteUrl && (
                                <span className="text-[10px] font-normal text-gray-500 block truncate max-w-[200px] mt-0.5">{client.websiteUrl}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                              <span className="font-semibold text-gray-400">{client.ownerEmail}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1.5 flex-wrap">
                              {isGbp ? (
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[9px] font-bold">📍 Maps</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-800 text-gray-500 rounded-md text-[9px] font-bold">📍 Maps Ausente</span>
                              )}
                              {isGsc ? (
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-[9px] font-bold">🌐 GSC</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-800 text-gray-500 rounded-md text-[9px] font-bold">🌐 GSC Ausente</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleSeo(client.id, client.seoEnabled)}
                              disabled={actionLoading === `seo-${client.id}`}
                              className={`inline-flex items-center justify-center p-1 rounded-xl transition-all ${
                                client.seoEnabled
                                  ? 'text-[#00ff9d] hover:text-[#00ff9d]/80'
                                  : 'text-gray-600 hover:text-gray-500'
                              } disabled:opacity-50`}
                            >
                              {actionLoading === `seo-${client.id}` ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : client.seoEnabled ? (
                                <div className="flex items-center gap-1.5 bg-[#00ff9d]/10 border border-[#00ff9d]/25 px-2.5 py-1.5 rounded-xl">
                                  <ToggleRight className="w-5 h-5" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">SEO Ativo</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-xl">
                                  <ToggleLeft className="w-5 h-5" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">SEO Inativo</span>
                                </div>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USUÁRIOS, CREDÍTOS & ROLES */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Filtros de status do usuário */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setUserStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                userStatusFilter === 'all'
                  ? 'bg-gray-700/50 border-gray-600 text-white'
                  : 'bg-[#161b22] border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              📋 Todos <span className="ml-1 opacity-70">({totalUsersCount})</span>
            </button>
            <button
              onClick={() => setUserStatusFilter('active')}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                userStatusFilter === 'active'
                  ? 'bg-[#00ff9d]/10 border-[#00ff9d]/30 text-[#00ff9d]'
                  : 'bg-[#161b22] border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              ✅ Ativos (Premium) <span className="ml-1 opacity-70">({activeSubscribers})</span>
            </button>
            <button
              onClick={() => setUserStatusFilter('trial')}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                userStatusFilter === 'trial'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-[#161b22] border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              ⚡ Em Teste Grátis <span className="ml-1 opacity-70">({trialUsers})</span>
            </button>
            <button
              onClick={() => setUserStatusFilter('pending')}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                userStatusFilter === 'pending'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-[#161b22] border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              🔒 Pendentes <span className="ml-1 opacity-70">({pendingUsers})</span>
            </button>
          </div>

          {/* Caixa de Busca */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input 
              type="text"
              placeholder="Buscar por e-mail ou nome do gestor..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-[#161b22] border border-gray-800 focus:border-[#00ff9d]/30 text-xs text-white placeholder-gray-600 rounded-xl pl-12 pr-4 py-3 outline-none"
            />
          </div>

          <div className="bg-[#161b22]/40 border border-gray-800/80 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500 text-xs font-bold animate-pulse">
                Carregando carteira de usuários do SaaS...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs font-bold">
                Nenhum usuário correspondente encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 bg-[#161b22]/80 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">👤 Nome do Gestor</th>
                      <th className="p-4">💳 Assinatura</th>
                      <th className="p-4">🛡️ Perfil de Acesso</th>
                      <th className="p-4 text-center">🌐 Módulo SEO</th>
                      <th className="p-4">📈 Cota Rank Tracker</th>
                      <th className="p-4">🪙 Extra Comprado</th>
                      <th className="p-4 text-center">⚙️ Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 text-gray-300 font-medium">
                    {filteredUsers.map((usr) => {
                      const isAdminRole = usr.role === 'super_admin';
                      return (
                        <tr key={usr.id} className="hover:bg-gray-800/20 transition-all duration-150">
                          <td className="p-4 pl-6 font-bold text-white">
                            <div className="flex flex-col">
                              <span>{usr.fullName}</span>
                              <span className="text-[10px] font-normal text-gray-500 block truncate max-w-[200px] mt-0.5">{usr.email}</span>
                            </div>
                          </td>
                          <td className="p-4">
                             {/* Select de status de assinatura */}
                             <select
                               value={usr.subscriptionStatus || 'pending'}
                               onChange={(e) => handleUpdateSubscriptionStatus(usr.id, e.target.value)}
                               disabled={actionLoading === `sub-${usr.id}`}
                               className={`bg-[#0d1117] border rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all outline-none cursor-pointer ${
                                 usr.subscriptionStatus === 'active'
                                   ? 'border-[#00ff9d]/30 text-[#00ff9d]'
                                   : usr.subscriptionStatus === 'trial'
                                   ? 'border-blue-500/30 text-blue-400'
                                   : usr.subscriptionStatus === 'cancelled'
                                   ? 'border-rose-500/30 text-rose-400'
                                   : 'border-amber-500/30 text-amber-500'
                               }`}
                             >
                               <option value="pending" className="bg-[#161b22] text-amber-500 font-bold">Pendente</option>
                               <option value="trial" className="bg-[#161b22] text-blue-400 font-bold">Teste (Trial)</option>
                               <option value="active" className="bg-[#161b22] text-[#00ff9d] font-bold">Ativo (Premium)</option>
                               <option value="cancelled" className="bg-[#161b22] text-rose-400 font-bold">Cancelado</option>
                             </select>
                           </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleUserRole(usr.id, usr.role)}
                              disabled={actionLoading === `role-${usr.id}`}
                              className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                isAdminRole
                                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300'
                              }`}
                            >
                              {actionLoading === `role-${usr.id}` ? (
                                <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : isAdminRole ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Super Admin</span>
                                </>
                              ) : (
                                <span>Gestor SaaS</span>
                              )}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleUserSeo(usr.id, usr.seoAllowed)}
                              disabled={actionLoading === `userseo-${usr.id}`}
                              className={`inline-flex items-center justify-center p-1 rounded-xl transition-all ${
                                usr.seoAllowed
                                  ? 'text-[#00ff9d] hover:text-[#00ff9d]/80'
                                  : 'text-gray-600 hover:text-gray-500'
                              } disabled:opacity-50`}
                            >
                              {actionLoading === `userseo-${usr.id}` ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : usr.seoAllowed ? (
                                <div className="flex items-center gap-1.5 bg-[#00ff9d]/10 border border-[#00ff9d]/25 px-2.5 py-1.5 rounded-xl">
                                  <ToggleRight className="w-4 h-4 text-[#00ff9d]" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00ff9d]">Habilitado</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-xl">
                                  <ToggleLeft className="w-4 h-4 text-gray-500" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Desabilitado</span>
                                </div>
                              )}
                            </button>
                          </td>
                          <td className="p-4 font-bold text-white text-sm">
                            <span className="text-[#00ff9d]">{usr.monthlyAllowance}</span>{' '}
                            <span className="text-gray-500 text-[10px] font-normal">consultas/mês</span>
                          </td>
                          <td className="p-4 font-bold text-white text-sm">
                            <span className="text-blue-400">{usr.purchasedCredits}</span>{' '}
                            <span className="text-gray-500 text-[10px] font-normal">extras</span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col gap-1.5 justify-center items-center">
                              {usr.subscriptionStatus === 'pending' && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleUpdateSubscriptionStatus(usr.id, 'trial')}
                                    disabled={actionLoading !== null}
                                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-[0.97]"
                                  >
                                    Liberar Teste
                                  </button>
                                  <button
                                    onClick={() => handleUpdateSubscriptionStatus(usr.id, 'active')}
                                    disabled={actionLoading !== null}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-[0.97]"
                                  >
                                    Ativar Premium
                                  </button>
                                </div>
                              )}
                              {usr.subscriptionStatus === 'trial' && (
                                <button
                                  onClick={() => handleUpdateSubscriptionStatus(usr.id, 'active')}
                                  disabled={actionLoading !== null}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-[0.97]"
                                >
                                  Ativar Premium
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingUser(usr);
                                  setModalMonthly(usr.monthlyAllowance);
                                  setModalPurchased(usr.purchasedCredits);
                                }}
                                className="px-3 py-1.5 bg-[#161b22] hover:bg-[#1f242c] border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-xl text-[9px] font-bold tracking-wide uppercase transition-all flex items-center gap-1.5"
                              >
                                <Edit2 className="w-3 h-3 text-blue-400" />
                                <span>Alterar Créditos</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* TAB 3: LOGS DE REQUISIÇÕES & APIS */}
      {activeSubTab === 'logs' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Caixa de Busca */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input 
              type="text"
              placeholder="Buscar por e-mail, nome do gestor ou descrição do log..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full bg-[#161b22] border border-gray-800 focus:border-[#00ff9d]/30 text-xs text-white placeholder-gray-600 rounded-xl pl-12 pr-4 py-3 outline-none"
            />
          </div>

          {/* Seção de Análise de Consumo (O que o usuário pediu!) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Box 1: Usuários que mais usam APIs (Ranking) */}
            <div className="bg-[#161b22]/50 border border-gray-800 rounded-2xl p-5 lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Top Consumidores de APIs</h3>
                <p className="text-gray-500 text-[10px] uppercase font-bold mt-0.5">Ranking acumulado das últimas 300 requisições</p>
              </div>

              <div className="space-y-4 pt-2">
                {(() => {
                  // Agrupar requisições por usuário
                  const userConsumption: Record<string, { email: string; name: string; count: number }> = {};
                  (data.logs || []).forEach(log => {
                    if (!userConsumption[log.userId]) {
                      userConsumption[log.userId] = {
                        email: log.userEmail,
                        name: log.userName,
                        count: 0
                      };
                    }
                    userConsumption[log.userId].count += log.tokensConsumed;
                  });

                  const sortedConsumers = Object.values(userConsumption)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                  if (sortedConsumers.length === 0) {
                    return <p className="text-gray-500 text-xs italic">Sem dados de consumo registrados.</p>;
                  }

                  const maxCount = sortedConsumers[0]?.count || 1;

                  return sortedConsumers.map((c, index) => {
                    const widthPercent = Math.max((c.count / maxCount) * 100, 2);
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-gray-300">
                            {index + 1}º. <span className="text-white">{c.name}</span> ({c.email})
                          </span>
                          <span className="text-[#00ff9d] font-black">{c.count} reqs</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-gray-800">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-[#00ff9d] rounded-full transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Box 2: Total de Custo de Requisições */}
            <div className="bg-[#161b22]/50 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Resumo de Chamadas</h3>
                <p className="text-gray-500 text-[10px] uppercase font-bold mt-0.5">Métricas globais de APIs externas</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs border-b border-gray-800 pb-2.5">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Total Acumulado:</span>
                  <span className="text-white font-black text-sm">
                    {data.logs?.reduce((acc, curr) => acc + (curr.tokensConsumed || 0), 0) || 0} chamadas
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-gray-800 pb-2.5">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Média por Usuário:</span>
                  <span className="text-[#00ff9d] font-black text-sm">
                    {(() => {
                      const totalLogs = data.logs?.reduce((acc, curr) => acc + (curr.tokensConsumed || 0), 0) || 0;
                      const uniqueUsers = new Set(data.logs?.map(l => l.userId)).size || 1;
                      return (totalLogs / uniqueUsers).toFixed(1);
                    })()} reqs
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Carga da API Apify:</span>
                  <span className="text-orange-400 font-black text-sm">
                    {data.logs?.filter(l => l.actionDescription.toLowerCase().includes('radar') || l.actionDescription.toLowerCase().includes('diagnóstico')).length || 0} reqs
                  </span>
                </div>
              </div>
              <p className="text-[9px] text-gray-600 font-semibold uppercase leading-tight">
                💡 Esses dados servem para você planejar a escala do Apify e SerpApi.
              </p>
            </div>
          </div>

          {/* Tabela de Logs de Consumo */}
          <div className="bg-[#161b22]/40 border border-gray-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#161b22]/80 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">👤 Usuário</th>
                    <th className="p-4">⚙️ Ação / API Requisitada</th>
                    <th className="p-4 text-center">📊 Consumo</th>
                    <th className="p-4 text-right pr-6">📅 Data / Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-gray-300 font-medium">
                  {(() => {
                    const filteredLogs = (data.logs || []).filter(log => 
                      log.userEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
                      log.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
                      log.actionDescription.toLowerCase().includes(logSearch.toLowerCase())
                    );

                    if (filteredLogs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-gray-500 text-xs font-bold">
                            Nenhum log de requisição encontrado.
                          </td>
                        </tr>
                      );
                    }

                    return filteredLogs.map((log) => {
                      const logDate = new Date(log.createdAt).toLocaleString('pt-BR');
                      return (
                        <tr key={log.id} className="hover:bg-gray-800/20 transition-all duration-150">
                          <td className="p-4 pl-6 font-bold text-white">
                            <div className="flex flex-col">
                              <span>{log.userName}</span>
                              <span className="text-[10px] font-normal text-gray-500 block truncate max-w-[200px] mt-0.5">{log.userEmail}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-300 font-bold max-w-sm truncate">
                            {log.actionDescription}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider border ${
                              log.tokensConsumed > 1
                                ? 'bg-orange-500/10 border-orange-500/25 text-orange-400'
                                : 'bg-[#00ff9d]/10 border-[#00ff9d]/25 text-[#00ff9d]'
                            }`}>
                              {log.tokensConsumed} {log.tokensConsumed > 1 ? 'reqs' : 'req'}
                            </span>
                          </td>
                          <td className="p-4 text-right pr-6 text-gray-500 text-[10px] font-bold">
                            {logDate}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE CRÉDITOS */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-[420px] p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#00ff9d]" />
                <h3 className="font-extrabold text-sm text-white">Editar Créditos de Ranking</h3>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-gray-300 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-xs text-gray-400">
              <span className="block font-bold text-white">{editingUser.fullName}</span>
              <span className="block truncate text-gray-500">{editingUser.email}</span>
            </div>

            <div className="space-y-4">
              {/* Allowance Mensal */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block tracking-wide uppercase">Cota de Assinatura Mensal</label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setModalMonthly(prev => Math.max(0, prev - 10))}
                    className="p-2 bg-[#0d1117] border border-gray-800 hover:border-gray-700 rounded-lg text-gray-400"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    type="number"
                    value={modalMonthly}
                    onChange={(e) => setModalMonthly(Number(e.target.value))}
                    className="w-full bg-[#0d1117] border border-gray-800 text-center text-sm font-bold text-white rounded-lg py-2 outline-none"
                  />
                  <button 
                    onClick={() => setModalMonthly(prev => prev + 10)}
                    className="p-2 bg-[#0d1117] border border-gray-800 hover:border-gray-700 rounded-lg text-gray-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500">Renovado todo mês automaticamente com base no plano contratado.</p>
              </div>

              {/* Créditos Extras */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block tracking-wide uppercase">Saldo Extra Comprado</label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setModalPurchased(prev => Math.max(0, prev - 10))}
                    className="p-2 bg-[#0d1117] border border-gray-800 hover:border-gray-700 rounded-lg text-gray-400"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    type="number"
                    value={modalPurchased}
                    onChange={(e) => setModalPurchased(Number(e.target.value))}
                    className="w-full bg-[#0d1117] border border-gray-800 text-center text-sm font-bold text-white rounded-lg py-2 outline-none"
                  />
                  <button 
                    onClick={() => setModalPurchased(prev => prev + 10)}
                    className="p-2 bg-[#0d1117] border border-gray-800 hover:border-gray-700 rounded-lg text-gray-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500">Créditos sob demanda comprados em pacotes pontuais. Não expiram.</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-gray-800">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-transparent hover:bg-gray-800/30 text-xs font-bold text-gray-400 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveCredits}
                disabled={actionLoading === `credits-${editingUser.id}`}
                className="px-5 py-2.5 bg-[#00ff9d] hover:bg-[#00e08b] disabled:opacity-50 text-gray-900 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
              >
                {actionLoading === `credits-${editingUser.id}` ? (
                  <div className="w-3.5 h-3.5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Salvar Alterações</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
