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
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Props {
  gbpData: any;
  days: number;
}

const PLATFORM_COLORS: { [key: string]: string } = {
  'Pesquisa Google – Mobile':  '#007aff',
  'Pesquisa Google – Desktop': '#00c4ff',
  'Google Maps – Mobile':      '#00ff9d',
  'Google Maps – Desktop':     '#00c97a',
};

const FALLBACK_COLORS = ['#007aff', '#00c4ff', '#00ff9d', '#00c97a', '#a855f7', '#f59e0b'];

export default function TabGBPDashboard({ gbpData, days }: Props) {
  const chartData        = gbpData?.chartData || [];
  const platformBreakdown: any[] = gbpData?.platformBreakdown || [];
  const keywords: any[]  = gbpData?.keywords || [];

  const totalInteractions =
    (gbpData?.metrics?.calls         || 0) +
    (gbpData?.metrics?.directions    || 0) +
    (gbpData?.metrics?.websiteClicks || 0) +
    (gbpData?.metrics?.messages      || 0) +
    (gbpData?.metrics?.bookings      || 0);

  const totalViews        = gbpData?.metrics?.views || 0;

  // Soma platform para percentual
  const platformTotal = platformBreakdown.reduce((s: number, p: any) => s + p.value, 0);

  // Tooltip do gráfico de interações
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d1117] border border-white/10 p-3 rounded-lg shadow-2xl">
          <p className="text-[10px] text-gray-400 font-bold mb-2">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2 text-xs font-bold py-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-white capitalize">
                {p.name === 'calls' ? 'Chamadas' : p.name === 'directions' ? 'Rotas' : p.name === 'websiteClicks' ? 'Site' : p.name === 'messages' ? 'Mensagens' : p.name === 'bookings' ? 'Reservas' : 'Visualizações'}:
              </span>
              <span style={{ color: p.color }}>{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Label custom do donut
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* ── HEADER ── */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-[#00ff9d]/10 to-transparent border border-[#00ff9d]/30 rounded-2xl p-8"
        style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}
      >
        <div>
          <p className="text-xs text-[#00ff9d] font-bold uppercase tracking-wider mb-2">Visão Geral do Perfil</p>
          <h2 className="text-3xl font-black text-white tracking-tight">{gbpData?.title}</h2>
        </div>
        <a
          href={gbpData?.mapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gbpData?.title)}`}
          target="_blank"
          className="bg-[#00ff9d] text-gray-900 font-bold py-3 px-6 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)]"
        >
          Visualizar no Maps ↗
        </a>
      </div>

      {/* ── CARDS TOPO: VISUALIZAÇÕES + INTERAÇÕES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visualizações do Perfil */}
        <div
          className="glass-card rounded-2xl p-8 border border-[#007aff]/20 relative overflow-hidden"
          style={{ boxShadow: '0 0 30px rgba(0, 122, 255, 0.08)' }}
        >
          <div className="absolute top-4 right-4 text-2xl opacity-20">👁️</div>
          <p className="text-xs text-[#007aff] font-bold uppercase tracking-widest mb-1">Visualizações do Perfil</p>
          <h3 className="text-5xl font-black text-white tracking-tighter mb-1">{totalViews.toLocaleString('pt-BR')}</h3>
          <p className="text-xs text-gray-500">Pessoas que viram seu perfil no período</p>
        </div>

        {/* Interações Totais */}
        <div
          className="glass-card rounded-2xl p-8 border border-[#00ff9d]/20 relative overflow-hidden"
          style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.08)' }}
        >
          <div className="absolute top-4 right-4 text-2xl opacity-20">⚡</div>
          <p className="text-xs text-[#00ff9d] font-bold uppercase tracking-widest mb-1">Interações no Perfil</p>
          <h3 className="text-5xl font-black text-white tracking-tighter mb-1">{totalInteractions.toLocaleString('pt-BR')}</h3>
          <p className="text-xs text-gray-500">Chamadas + Rotas + Cliques no Site + Mensagens + Reservas</p>
        </div>
      </div>

      {/* ── GRÁFICO DE INTERAÇÕES ── */}
      <div className="glass-card rounded-2xl border-white/5 p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-white mb-1">Evolução de Interações</h3>
            <p className="text-xs text-gray-500">Últimos {days} dias</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { key: 'calls',        label: 'Chamadas',        color: '#00ff9d' },
              { key: 'directions',   label: 'Rotas',           color: '#007aff' },
              { key: 'websiteClicks',label: 'Site',            color: '#06b6d4' },
              { key: 'messages',     label: 'Mensagens',       color: '#f97316' },
              { key: 'bookings',     label: 'Reservas',        color: '#eab308' },
              { key: 'views',        label: 'Visualizações',   color: '#f59e0b' },
            ].map(m => (
              <div key={m.key} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gCalls"   x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00ff9d" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gDirs"    x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#007aff" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#007aff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gViews"   x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gMsgs"    x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gBooks"   x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#eab308" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false} tickLine={false}
                tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }}
                minTickGap={30}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
                }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="views"        stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#gViews)"   animationDuration={1500} />
              <Area type="monotone" dataKey="calls"        stroke="#00ff9d" strokeWidth={2} fillOpacity={1} fill="url(#gCalls)"   animationDuration={2000} />
              <Area type="monotone" dataKey="directions"   stroke="#007aff" strokeWidth={2} fillOpacity={1} fill="url(#gDirs)"    animationDuration={2500} />
              <Area type="monotone" dataKey="websiteClicks" stroke="#06b6d4" strokeWidth={2} fillOpacity={0}                       animationDuration={3000} />
              <Area type="monotone" dataKey="messages"     stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#gMsgs)"    animationDuration={3200} />
              <Area type="monotone" dataKey="bookings"     stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#gBooks)"   animationDuration={3400} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── CARDS MÉTRICAS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { emoji: '📞', label: 'Chamadas',      value: gbpData?.metrics?.calls         ?? 0, color: '#00ff9d' },
          { emoji: '🗺️', label: 'Rotas',         value: gbpData?.metrics?.directions    ?? 0, color: '#007aff' },
          { emoji: '🖱️', label: 'Visitas ao Site',value: gbpData?.metrics?.websiteClicks ?? 0, color: '#06b6d4' },
          { emoji: '💬', label: 'Mensagens',     value: gbpData?.metrics?.messages      ?? 0, color: '#f97316' },
          { emoji: '📅', label: 'Reservas',      value: gbpData?.metrics?.bookings      ?? 0, color: '#eab308' },
          { emoji: '👁️', label: 'Visualizações', value: gbpData?.metrics?.views         ?? 0, color: '#f59e0b' },
        ].map(m => (
          <div
            key={m.label}
            className="glass-card rounded-2xl p-6 border transition-all hover:scale-[1.02] group"
            style={{ borderColor: `${m.color}20`, boxShadow: `0 0 20px ${m.color}08` }}
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{m.emoji}</div>
            <h3 className="text-4xl font-black tracking-tighter mb-1 drop-shadow-lg" style={{ color: m.color }}>
              {m.value.toLocaleString('pt-BR')}
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{m.label}</p>
          </div>
        ))}
      </div>

      {/* ── BREAKDOWN PLATAFORMA + KEYWORDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Donut de Plataforma */}
        <div className="glass-card rounded-2xl p-8 border border-white/5" style={{ boxShadow: '0 0 30px rgba(0,122,255,0.05)' }}>
          <h3 className="text-lg font-black text-white mb-1">Como descobriram seu perfil</h3>
          <p className="text-xs text-gray-500 mb-6">Plataforma e dispositivo</p>

          {platformBreakdown.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Donut */}
              <div className="w-[160px] h-[160px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={75}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {platformBreakdown.map((entry: any, index: number) => (
                        <Cell
                          key={entry.label}
                          fill={PLATFORM_COLORS[entry.label] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda */}
              <div className="flex flex-col gap-3 flex-1">
                {platformBreakdown.map((p: any, i: number) => {
                  const color = PLATFORM_COLORS[p.label] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                  const pct = platformTotal > 0 ? ((p.value / platformTotal) * 100).toFixed(0) : '0';
                  return (
                    <div key={p.label} className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 font-semibold truncate">{p.label}</p>
                        <p className="text-[10px] text-gray-500">{p.value.toLocaleString('pt-BR')} · {pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[160px] text-center">
              <div className="text-3xl mb-3 opacity-30">📊</div>
              <p className="text-sm text-gray-500">Dados de plataforma não disponíveis</p>
              <p className="text-xs text-gray-600 mt-1">Pode demorar até 5 dias para aparecer</p>
            </div>
          )}
        </div>

        {/* Tabela de Keywords */}
        <div className="glass-card rounded-2xl p-8 border border-white/5" style={{ boxShadow: '0 0 30px rgba(0,255,157,0.05)' }}>
          <h3 className="text-lg font-black text-white mb-1">Termos de Pesquisa</h3>
          <p className="text-xs text-gray-500 mb-6">Palavras-chave que trouxeram impressões</p>

          {keywords.length > 0 ? (
            <div className="space-y-3">
              {keywords.map((k: any, i: number) => {
                const displayValue = k.value !== null ? k.value.toLocaleString('pt-BR') : `< ${k.threshold ?? 15}`;
                const maxVal = keywords[0]?.value || 1;
                const barPct = k.value !== null ? Math.max(4, (k.value / maxVal) * 100) : 4;
                return (
                  <div key={k.keyword} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 font-bold w-4">{i + 1}</span>
                        <span className="text-sm text-gray-200 font-semibold lowercase">{k.keyword}</span>
                      </div>
                      <span className="text-sm font-black text-[#00ff9d]">{displayValue}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00ff9d] to-[#007aff] rounded-full transition-all duration-700"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[160px] text-center">
              <div className="text-3xl mb-3 opacity-30">🔍</div>
              <p className="text-sm text-gray-500">Termos de pesquisa não disponíveis</p>
              <p className="text-xs text-gray-600 mt-1">Dados mensais disponíveis após 30 dias</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
