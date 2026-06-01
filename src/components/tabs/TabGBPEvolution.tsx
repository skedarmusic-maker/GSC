'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';

interface Props {
  gbpData: any;
  clientId: string;
}

export default function TabGBPEvolution({ gbpData, clientId }: Props) {
  const [loading, setLoading] = useState(true);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'health' | 'metrics'>('health');

  // Carregar histórico de auditoria e métricas
  useEffect(() => {
    async function loadHistory() {
      if (!gbpData?.locationId) return;
      setLoading(true);
      try {
        // 1. Buscar histórico de auditorias de saúde
        const resAudit = await fetch(`/api/audit/history?locationId=${gbpData.locationId}`);
        const audits = await resAudit.json();
        if (Array.isArray(audits)) {
          setAuditHistory(audits);
        }

        // 2. Buscar histórico de métricas diárias e agrupar por mês
        const { data: dbMetrics, error: metricsErr } = await supabase
          .from('gbp_metrics_history')
          .select('*')
          .eq('location_id', gbpData.locationId)
          .order('date', { ascending: true });

        if (metricsErr) throw metricsErr;

        if (dbMetrics && dbMetrics.length > 0) {
          // Agrupar métricas por Ano/Mês
          const monthlyGrouped: { [key: string]: any } = {};
          dbMetrics.forEach((item: any) => {
            const dateObj = new Date(item.date);
            const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyGrouped[yearMonth]) {
              monthlyGrouped[yearMonth] = {
                month: yearMonth,
                formattedMonth: dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase(),
                calls: 0,
                directions: 0,
                website_clicks: 0,
                views_maps: 0,
                views_search: 0,
                total_views: 0,
                total_actions: 0
              };
            }

            monthlyGrouped[yearMonth].calls += (item.calls || 0);
            monthlyGrouped[yearMonth].directions += (item.directions || 0);
            monthlyGrouped[yearMonth].website_clicks += (item.website_clicks || 0);
            monthlyGrouped[yearMonth].views_maps += (item.views_maps || 0);
            monthlyGrouped[yearMonth].views_search += (item.views_search || 0);
            monthlyGrouped[yearMonth].total_views += ((item.views_maps || 0) + (item.views_search || 0));
            monthlyGrouped[yearMonth].total_actions += ((item.calls || 0) + (item.directions || 0) + (item.website_clicks || 0));
          });

          setMetricsHistory(Object.values(monthlyGrouped));
        } else {
          setMetricsHistory([]);
        }
      } catch (err) {
        console.error('Erro ao carregar histórico da evolução:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [gbpData?.locationId]);

  // Função para rodar uma nova auditoria na hora e atualizar o histórico
  const handleRecalculateAudit = async () => {
    if (!gbpData?.locationId || !gbpData?.accountId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountId: gbpData.accountId, 
          locationId: gbpData.locationId 
        })
      });
      const data = await res.json();
      if (!data.error) {
        // Recarregar histórico de auditorias
        const resAudit = await fetch(`/api/audit/history?locationId=${gbpData.locationId}`);
        const audits = await resAudit.json();
        if (Array.isArray(audits)) {
          setAuditHistory(audits);
        }
        alert('Análise recalculada e histórico atualizado com sucesso!');
      } else {
        alert('Erro ao calcular auditoria: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao rodar auditoria.');
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas comparativas de saúde
  const firstAudit = auditHistory[0];
  const lastAudit = auditHistory[auditHistory.length - 1];
  const healthDiff = lastAudit && firstAudit ? lastAudit.score - firstAudit.score : 0;

  // Calcular estatísticas comparativas de métricas
  const firstMonth = metricsHistory[0];
  const lastMonth = metricsHistory[metricsHistory.length - 1];
  const actionsDiffPercent = lastMonth && firstMonth && firstMonth.total_actions > 0
    ? ((lastMonth.total_actions - firstMonth.total_actions) / firstMonth.total_actions) * 100
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d1117] border border-white/10 p-4 rounded-xl shadow-2xl">
          <p className="text-xs text-gray-400 font-bold mb-2">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2 text-xs font-bold py-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.stroke }}></span>
              <span className="text-white capitalize">{p.name === 'score' ? 'Nota de Saúde' : p.name === 'calls' ? 'Chamadas' : p.name === 'directions' ? 'Rotas' : p.name === 'website_clicks' ? 'Cliques Site' : p.name === 'total_views' ? 'Visualizações Totais' : p.name}:</span>
              <span style={{ color: p.color || p.stroke }}>{p.value}{p.name === 'score' ? '%' : ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-[#00ff9d]/10 to-transparent border border-[#00ff9d]/30 rounded-2xl p-8" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
        <div>
          <p className="text-xs text-[#00ff9d] font-bold uppercase tracking-wider mb-2">Evolução do Perfil</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Histórico e Evolução da Análise</h2>
          <p className="text-sm text-gray-400 mt-2">Acompanhe a melhoria de saúde e o crescimento de tráfego do perfil ao longo do tempo.</p>
        </div>
        <button
          onClick={handleRecalculateAudit}
          disabled={loading}
          className="bg-[#161b22] text-[#00ff9d] border border-[#00ff9d]/30 hover:border-[#00ff9d] font-bold py-3 px-6 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(0,255,157,0.1)] hover:shadow-[0_0_30px_rgba(0,255,157,0.3)] disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Atualizar Análise de Saúde Now'}
        </button>
      </div>

      {/* Tabs Switch */}
      <div className="flex border-b border-white/5 gap-6">
        <button
          onClick={() => setActiveSubTab('health')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeSubTab === 'health' 
              ? 'text-[#00ff9d] border-[#00ff9d]' 
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          📈 Saúde do Perfil
        </button>
        <button
          onClick={() => setActiveSubTab('metrics')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeSubTab === 'metrics' 
              ? 'text-[#00ff9d] border-[#00ff9d]' 
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          📊 Desempenho e Engajamento
        </button>
      </div>

      {loading ? (
        <div className="p-32 text-center glass-card border-[#00ff9d]/10 rounded-2xl shadow-[0_0_30px_rgba(0,255,157,0.05)]">
          <div className="w-10 h-10 border-4 border-[#00ff9d] border-t-transparent rounded-full animate-spin mb-4 mx-auto drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]"></div>
          <div className="text-[#00ff9d] text-lg font-bold">Carregando dados históricos da evolução...</div>
        </div>
      ) : activeSubTab === 'health' ? (
        <div className="space-y-6">
          {/* Cards Comparativos Saúde */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 border-white/5">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Primeira Nota Registrada</p>
              <h3 className="text-4xl font-black text-gray-400">
                {firstAudit ? `${firstAudit.score}%` : 'Sem dados'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {firstAudit ? `Analisado em ${new Date(firstAudit.date).toLocaleDateString('pt-BR')}` : '-'}
              </p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 border-[#00ff9d]/10" style={{ boxShadow: '0 0 20px rgba(0, 255, 157, 0.02)' }}>
              <p className="text-xs text-[#00ff9d] font-bold uppercase tracking-wider mb-2">Nota Atual de Saúde</p>
              <h3 className="text-4xl font-black text-white" style={{ color: lastAudit?.color || '#fff' }}>
                {lastAudit ? `${lastAudit.score}%` : 'Sem dados'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {lastAudit ? `Classificação: ${lastAudit.grade}` : '-'}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border-white/5">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Evolução do Score</p>
              <h3 className={`text-4xl font-black ${healthDiff > 0 ? 'text-emerald-400' : healthDiff < 0 ? 'text-red-400' : 'text-white'}`}>
                {healthDiff > 0 ? `+${healthDiff}%` : `${healthDiff}%`}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {healthDiff > 0 ? 'O perfil está mais otimizado!' : healthDiff < 0 ? 'Atenção, houve perda de itens!' : 'Mantido estável'}
              </p>
            </div>
          </div>

          {/* Gráfico do Histórico de Saúde */}
          {auditHistory.length > 0 ? (
            <div className="glass-card rounded-2xl border-white/5 p-8 h-[400px]">
              <h4 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">Evolução da Nota Geral (%)</h4>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={auditHistory.map(h => ({
                  date: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                  score: h.score
                }))}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="#00ff9d" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-20 text-center glass-card border-white/5 rounded-2xl text-gray-500">
              Nenhuma análise de saúde anterior encontrada. Execute a sua primeira auditoria clicando no botão acima!
            </div>
          )}

          {/* Checklist Detalhado das Auditorias */}
          {auditHistory.length > 0 && (
            <div className="glass-card rounded-2xl border-white/5 p-8">
              <h4 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">Histórico de Auditorias Realizadas</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="text-xs uppercase text-gray-500 border-b border-white/5">
                    <tr>
                      <th className="py-4">Data</th>
                      <th className="py-4">Score</th>
                      <th className="py-4">Status</th>
                      <th className="py-4">Detalhes da Otimização</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[...auditHistory].reverse().map((audit) => (
                      <tr key={audit.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 text-white font-bold">
                          {new Date(audit.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="py-4 font-black" style={{ color: audit.color }}>
                          {audit.score}%
                        </td>
                        <td className="py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/40" style={{ color: audit.color, border: `1px solid ${audit.color}30` }}>
                            {audit.grade}
                          </span>
                        </td>
                        <td className="py-4 text-xs">
                          {audit.checklist?.map((c: any) => `${c.name}: ${c.passed ? '✅' : '❌'}`).join(' | ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cards Comparativos Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 border-white/5">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Ações Totais no Primeiro Mês</p>
              <h3 className="text-4xl font-black text-gray-400">
                {firstMonth ? firstMonth.total_actions : 0}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Referência: {firstMonth ? firstMonth.formattedMonth : '-'}
              </p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 border-[#007aff]/10" style={{ boxShadow: '0 0 20px rgba(0, 122, 255, 0.02)' }}>
              <p className="text-xs text-[#007aff] font-bold uppercase tracking-wider mb-2">Ações Totais no Último Mês</p>
              <h3 className="text-4xl font-black text-white">
                {lastMonth ? lastMonth.total_actions : 0}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Referência: {lastMonth ? lastMonth.formattedMonth : '-'}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border-white/5">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Crescimento de Ações</p>
              <h3 className={`text-4xl font-black ${actionsDiffPercent > 0 ? 'text-emerald-400' : actionsDiffPercent < 0 ? 'text-red-400' : 'text-white'}`}>
                {actionsDiffPercent > 0 ? `+${actionsDiffPercent.toFixed(1)}%` : `${actionsDiffPercent.toFixed(1)}%`}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {actionsDiffPercent > 0 ? 'Aumento no volume de leads!' : actionsDiffPercent < 0 ? 'Queda no volume de contatos!' : 'Sem alteração'}
              </p>
            </div>
          </div>

          {/* Gráfico da Evolução das Métricas Mensais */}
          {metricsHistory.length > 0 ? (
            <div className="glass-card rounded-2xl border-white/5 p-8 h-[400px]">
              <h4 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">Histórico Mensal de Ações de Clientes</h4>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="formattedMonth" stroke="#4b5563" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#4b5563" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '15px' }} />
                  <Line type="monotone" dataKey="calls" name="calls" stroke="#00ff9d" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="directions" name="directions" stroke="#007aff" strokeWidth={3} />
                  <Line type="monotone" dataKey="website_clicks" name="website_clicks" stroke="#a855f7" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-20 text-center glass-card border-white/5 rounded-2xl text-gray-500">
              Nenhum histórico de métricas encontrado no banco de dados. Sincronize os dados na aba "Comparar Períodos" primeiro!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
