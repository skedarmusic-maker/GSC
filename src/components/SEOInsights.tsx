import React from 'react';

interface SEOInsightsProps {
  data: any;
  insights: any[];
}

export const SEOInsights: React.FC<SEOInsightsProps> = ({ data, insights }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPIS GSC */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-8 text-center border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-4">Cliques Orgânicos</p>
          <h2 className="text-5xl font-black tracking-tight text-[#00ff9d] mb-3 drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{data.current.clicks}</h2>
          <p className={`text-xs font-bold ${data.current.clicks >= data.previous.clicks ? 'text-[#00ff9d]' : 'text-red-400'}`}>
            {data.current.clicks >= data.previous.clicks ? '↑' : '↓'} {Math.abs(data.current.clicks - data.previous.clicks)} vs prev.
          </p>
        </div>
        <div className="glass-card rounded-xl p-8 text-center border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-4">Impressões</p>
          <h2 className="text-5xl font-black tracking-tight text-[#00ff9d] mb-3 drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{data.current.impressions}</h2>
        </div>
        <div className="glass-card rounded-xl p-8 text-center border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-4">CTR Médio</p>
          <h2 className="text-5xl font-black tracking-tight text-[#00ff9d] mb-3 drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{(data.current.ctr * 100).toFixed(1)}%</h2>
        </div>
        <div className="glass-card rounded-xl p-8 text-center border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-4">Posição Média</p>
          <h2 className="text-5xl font-black tracking-tight text-[#00ff9d] mb-3 drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{data.current.position.toFixed(1)}</h2>
        </div>
      </div>

      {/* IA Insights */}
      <h3 className="text-xl font-bold mt-12 mb-6 flex items-center gap-2">✨ Recomendações da IA</h3>
      <div className="space-y-4">
        {insights.length > 0 ? insights.map((ins: any, i: number) => (
          <div key={i} className={`glass-card border-l-4 rounded-r-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${ins.type === 'gold' ? 'border-l-[#00ff9d]' : ins.type === 'maps' ? 'border-l-[#4285F4]' : 'border-l-[#ffbb00]'}`}>
            <div>
              <h4 className="text-lg font-bold mb-2 text-white">{ins.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">{ins.desc}</p>
            </div>
            <button className="bg-white/5 hover:bg-white/10 text-white border border-gray-700 font-bold py-2.5 px-5 rounded-lg text-sm transition-colors whitespace-nowrap">
              Investigar
            </button>
          </div>
        )) : <div className="text-gray-500 p-8 text-center border border-dashed border-gray-800 rounded-xl">Coletando padrões comportamentais do site...</div>}
      </div>
    </div>
  );
};
