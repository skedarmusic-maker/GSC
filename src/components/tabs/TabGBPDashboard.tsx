'use client';

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

interface Props {
  gbpData: any;
  days: number;
}

export default function TabGBPDashboard({ gbpData, days }: Props) {
  const chartData = gbpData?.chartData || [];
  
  // Calcular interações totais (soma de todas as métricas)
  const totalInteractions = (gbpData?.metrics?.calls || 0) + 
                          (gbpData?.metrics?.directions || 0) + 
                          (gbpData?.metrics?.websiteClicks || 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d1117] border border-white/10 p-3 rounded-lg shadow-2xl">
          <p className="text-[10px] text-gray-400 font-bold mb-2">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2 text-xs font-bold py-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
              <span className="text-white capitalize">{p.name === 'calls' ? 'Chamadas' : p.name === 'directions' ? 'Rotas' : 'Site'}:</span>
              <span style={{ color: p.color }}>{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header do Perfil */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-[#00ff9d]/10 to-transparent border border-[#00ff9d]/30 rounded-2xl p-8" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
        <div>
          <p className="text-xs text-[#00ff9d] font-bold uppercase tracking-wider mb-2">Visão Geral do Perfil</p>
          <h2 className="text-3xl font-black text-white tracking-tight">{gbpData?.title}</h2>
        </div>
        <a href={gbpData?.mapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gbpData?.title)}`} target="_blank"
          className="bg-[#00ff9d] text-gray-900 font-bold py-3 px-6 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)]">
          Visualizar no Maps ↗
        </a>
      </div>

      {/* Gráfico de Interações */}
      <div className="glass-card rounded-2xl border-white/5 p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-5xl font-black text-white tracking-tighter mb-1">{totalInteractions.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
              Interações no Perfil da Empresa
              <span className="w-1.5 h-1.5 rounded-full bg-[#007aff] animate-pulse"></span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff9d]"></span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Chamadas</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#007aff]"></span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Rotas</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Site</span>
             </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDirections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007aff" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#007aff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }}
                minTickGap={30}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
                }}
              />
              <YAxis 
                hide 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="calls" 
                stroke="#00ff9d" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCalls)" 
                animationDuration={2000}
              />
              <Area 
                type="monotone" 
                dataKey="directions" 
                stroke="#007aff" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorDirections)" 
                animationDuration={2500}
              />
              <Area 
                type="monotone" 
                dataKey="websiteClicks" 
                stroke="#a855f7" 
                strokeWidth={3}
                fillOpacity={0} 
                animationDuration={3000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-8 shadow-sm border-[#00ff9d]/10 hover:border-[#00ff9d]/30 transition-all group" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📞</div>
          <h3 className="text-5xl font-black tracking-tighter mb-2 text-[#00ff9d] drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{gbpData?.metrics?.calls ?? 0}</h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Chamadas Recebidas</p>
        </div>
        <div className="glass-card rounded-2xl p-8 shadow-sm border-[#007aff]/10 hover:border-[#007aff]/30 transition-all group" style={{ boxShadow: '0 0 30px rgba(0, 122, 255, 0.05)' }}>
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🗺️</div>
          <h3 className="text-5xl font-black tracking-tighter mb-2 text-[#007aff] drop-shadow-[0_0_15px_rgba(0,122,255,0.3)]">{gbpData?.metrics?.directions ?? 0}</h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Rotas Solicitadas</p>
        </div>
        <div className="glass-card rounded-2xl p-8 shadow-sm border-[#a855f7]/10 hover:border-[#a855f7]/30 transition-all group" style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.05)' }}>
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🖱️</div>
          <h3 className="text-5xl font-black tracking-tighter mb-2 text-[#a855f7] drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">{gbpData?.metrics?.websiteClicks ?? 0}</h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Visitas ao Site</p>
        </div>
      </div>
    </div>
  );
}
