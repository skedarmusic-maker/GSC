'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MonthRangePicker from '@/components/MonthRangePicker';

interface Props {
  gbpData: any;
  clientId: string;
}

export default function TabGBPComparison({ gbpData, clientId }: Props) {
  const [loading, setLoading] = useState(false);
  const [periodA, setPeriodA] = useState({ start: '', end: '' });
  const [periodB, setPeriodB] = useState({ start: '', end: '' });
  const [comparisonData, setComparisonData] = useState<any>(null);

  const handleSyncHistory = async () => {
    if (!gbpData?.locationId) return;
    setLoading(true);
    try {
      // Chamada para uma API que vai varrer os ultimos 18 meses do Google 
      // e inserir na tabela gbp_metrics_history
      const res = await fetch('/api/maps/sync-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          locationId: gbpData.locationId, 
          clientId,
          locationName: `locations/${gbpData.locationId}`
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Histórico sincronizado com sucesso!');
      } else {
        alert('Erro ao sincronizar: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao sincronizar histórico.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!periodA.start || !periodA.end || !periodB.start || !periodB.end) {
      alert('Selecione ambos os períodos para comparar');
      return;
    }
    setLoading(true);
    try {
      // Busca dados do período A
      const { data: dataA, error: errA } = await supabase
        .from('gbp_metrics_history')
        .select('*')
        .eq('location_id', gbpData.locationId)
        .gte('date', periodA.start)
        .lte('date', periodA.end);

      // Busca dados do período B
      const { data: dataB, error: errB } = await supabase
        .from('gbp_metrics_history')
        .select('*')
        .eq('location_id', gbpData.locationId)
        .gte('date', periodB.start)
        .lte('date', periodB.end);

      if (errA || errB) throw errA || errB;

      // Soma métricas
      const sumMetrics = (records: any[]) => {
        return records.reduce((acc, curr) => ({
          calls: acc.calls + (curr.calls || 0),
          directions: acc.directions + (curr.directions || 0),
          website_clicks: acc.website_clicks + (curr.website_clicks || 0)
        }), { calls: 0, directions: 0, website_clicks: 0 });
      };

      const totalsA = sumMetrics(dataA || []);
      const totalsB = sumMetrics(dataB || []);

      setComparisonData({ periodA: totalsA, periodB: totalsB });
    } catch (error: any) {
      console.error(error);
      alert('Erro ao buscar dados do banco: ' + (error?.message || error?.details || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  const calcDiff = (valA: number, valB: number) => {
    if (valB === 0 && valA > 0) return '+100%';
    if (valB === 0 && valA === 0) return '0%';
    const diff = ((valA - valB) / valB) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const chartData = comparisonData ? [
    {
      name: 'Chamadas',
      'Período A': comparisonData.periodA.calls,
      'Período B': comparisonData.periodB.calls,
    },
    {
      name: 'Rotas',
      'Período A': comparisonData.periodA.directions,
      'Período B': comparisonData.periodB.directions,
    },
    {
      name: 'Cliques no Site',
      'Período A': comparisonData.periodA.website_clicks,
      'Período B': comparisonData.periodB.website_clicks,
    }
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-[#a855f7]/10 to-transparent border border-[#a855f7]/30 rounded-2xl p-8">
        <div>
          <p className="text-xs text-[#a855f7] font-bold uppercase tracking-wider mb-2">Análise Histórica</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Comparar Períodos</h2>
          <p className="text-sm text-gray-400 mt-2">Compare a evolução do perfil no Google Maps selecionando períodos distintos.</p>
        </div>
        <button
          onClick={handleSyncHistory}
          disabled={loading}
          className="bg-[#161b22] text-[#a855f7] border border-[#a855f7]/30 hover:border-[#a855f7] font-bold py-3 px-6 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Sincronizar Últimos 18 Meses'}
        </button>
      </div>

      <div className="glass-card rounded-2xl border-white/5 p-8 shadow-2xl relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-4">Período A (Atual)</h3>
            <MonthRangePicker 
              onRangeSelect={(start, end) => setPeriodA({ start, end })}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-4">Período B (Comparativo / Passado)</h3>
            <MonthRangePicker 
              onRangeSelect={(start, end) => setPeriodB({ start, end })}
            />
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !periodA.start || !periodB.start}
          className="w-full bg-[#a855f7] text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50"
        >
          Analisar e Comparar
        </button>
      </div>

      {comparisonData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['calls', 'directions', 'website_clicks'].map((metricKey) => {
              const valA = comparisonData.periodA[metricKey];
              const valB = comparisonData.periodB[metricKey];
              const diffStr = calcDiff(valA, valB);
              const isPositive = !diffStr.startsWith('-');
              
              const label = metricKey === 'calls' ? 'Chamadas' : metricKey === 'directions' ? 'Rotas' : 'Cliques Site';

              return (
                <div key={metricKey} className="glass-card rounded-2xl p-6 border-white/5">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">{label}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Período A</p>
                      <h4 className="text-3xl font-black text-white">{valA}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Período B</p>
                      <h4 className="text-3xl font-black text-gray-300">{valB}</h4>
                    </div>
                  </div>
                  <div className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    Evolução: {diffStr}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-card rounded-2xl border-white/5 p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#4b5563" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="Período A" fill="#00ff9d" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Período B" fill="#4b5563" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
