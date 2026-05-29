
'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { MousePointer2, Eye, Percent, ArrowDownUp } from 'lucide-react';

interface Props {
  history: any[];
}

export default function GSCChart({ history }: Props) {
  const [activeMetrics, setActiveMetrics] = useState({
    clicks: true,
    impressions: true,
    ctr: false,
    position: false
  });

  if (!history || history.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center border-gray-800">
        <p className="text-gray-500 italic">Nenhum dado histórico disponível para o período selecionado.</p>
      </div>
    );
  }

  // Formatar dados para o gráfico
  const chartData = history.map(row => ({
    date: new Date(row.keys[0]).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    fullDate: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: (row.ctr * 100).toFixed(1),
    position: row.position.toFixed(1)
  })).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  const toggleMetric = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  return (
    <div className="glass-card rounded-2xl border-gray-800 p-6 flex flex-col gap-6">
      {/* Seletores de Métricas (Cards Estilo GSC) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* CLIQUES */}
        <button
          onClick={() => toggleMetric('clicks')}
          className={`p-4 rounded-xl border transition-all text-left flex flex-col gap-1 ${
            activeMetrics.clicks 
            ? 'bg-[#4285f4]/10 border-[#4285f4] shadow-[0_0_15px_rgba(66,133,244,0.1)]' 
            : 'bg-transparent border-gray-800 opacity-50 hover:opacity-80'
          }`}
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#4285f4]">
            <MousePointer2 size={12} /> Cliques
          </div>
          <div className="text-2xl font-black text-white">
            {chartData.reduce((acc, curr) => acc + curr.clicks, 0).toLocaleString()}
          </div>
        </button>

        {/* IMPRESSÕES */}
        <button
          onClick={() => toggleMetric('impressions')}
          className={`p-4 rounded-xl border transition-all text-left flex flex-col gap-1 ${
            activeMetrics.impressions 
            ? 'bg-[#8133f1]/10 border-[#8133f1] shadow-[0_0_15px_rgba(129,51,241,0.1)]' 
            : 'bg-transparent border-gray-800 opacity-50 hover:opacity-80'
          }`}
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#8133f1]">
            <Eye size={12} /> Impressões
          </div>
          <div className="text-2xl font-black text-white">
            {chartData.reduce((acc, curr) => acc + curr.impressions, 0).toLocaleString()}
          </div>
        </button>

        {/* CTR */}
        <button
          onClick={() => toggleMetric('ctr')}
          className={`p-4 rounded-xl border transition-all text-left flex flex-col gap-1 ${
            activeMetrics.ctr 
            ? 'bg-[#00ff9d]/10 border-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.1)]' 
            : 'bg-transparent border-gray-800 opacity-50 hover:opacity-80'
          }`}
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00ff9d]">
            <Percent size={12} /> CTR Médio
          </div>
          <div className="text-2xl font-black text-white">
            {(chartData.reduce((acc, curr) => acc + Number(curr.ctr), 0) / chartData.length).toFixed(1)}%
          </div>
        </button>

        {/* POSIÇÃO */}
        <button
          onClick={() => toggleMetric('position')}
          className={`p-4 rounded-xl border transition-all text-left flex flex-col gap-1 ${
            activeMetrics.position 
            ? 'bg-[#ffbb00]/10 border-[#ffbb00] shadow-[0_0_15px_rgba(255,187,0,0.1)]' 
            : 'bg-transparent border-gray-800 opacity-50 hover:opacity-80'
          }`}
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#ffbb00]">
            <ArrowDownUp size={12} /> Pos. Média
          </div>
          <div className="text-2xl font-black text-white">
            {(chartData.reduce((acc, curr) => acc + Number(curr.position), 0) / chartData.length).toFixed(1)}
          </div>
        </button>
      </div>

      {/* ÁREA DO GRÁFICO */}
      <div className="h-[350px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#4b5563" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              interval={Math.ceil(chartData.length / 10)}
            />
            <YAxis 
              yAxisId="left"
              stroke="#4b5563" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#4b5563" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              hide={!activeMetrics.ctr}
            />
            <YAxis 
              yAxisId="position"
              orientation="right"
              reversed={true}
              stroke="#ffbb00" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={[1, 'dataMax + 10']}
              hide={!activeMetrics.position}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#161b22', border: '1px solid #374151', borderRadius: '12px' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '10px' }}
            />
            
            {activeMetrics.impressions && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="impressions"
                stroke="#8133f1"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: '#8133f1', strokeWidth: 2, fill: '#0d1117' }}
                animationDuration={1000}
              />
            )}

            {activeMetrics.clicks && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="clicks"
                stroke="#4285f4"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: '#4285f4', strokeWidth: 2, fill: '#0d1117' }}
                animationDuration={1000}
              />
            )}

            {activeMetrics.ctr && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ctr"
                stroke="#00ff9d"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                animationDuration={1000}
              />
            )}

            {activeMetrics.position && (
              <Line
                yAxisId="position"
                type="monotone"
                dataKey="position"
                stroke="#ffbb00"
                strokeWidth={2}
                dot={false}
                strokeDasharray="3 3"
                animationDuration={1000}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
