'use client';

interface Props {
  gbpData: any;
  days: number;
}

export default function TabGBPDashboard({ gbpData, days }: Props) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-[#00ff9d]/10 to-transparent border border-[#00ff9d]/30 rounded-2xl p-8" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
        <div>
          <p className="text-xs text-[#00ff9d] font-bold uppercase tracking-wider mb-2">Visão Geral do Perfil</p>
          <h2 className="text-3xl font-black text-white tracking-tight">{gbpData?.title}</h2>
        </div>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gbpData?.title)}`} target="_blank"
          className="bg-[#00ff9d] text-gray-900 font-bold py-3 px-6 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)]">
          Visualizar no Maps ↗
        </a>
      </div>

      <div className="flex items-center gap-2 mb-2 text-gray-400 text-[10px] bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/10 uppercase font-bold tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse shadow-[0_0_8px_#00ff9d]"></span>
        Métricas dos últimos <span className="text-white ml-1">{days} dias</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-8 shadow-sm border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
          <div className="text-4xl mb-4">📞</div>
          <h3 className="text-5xl font-black tracking-tighter mb-2 text-[#00ff9d] drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{gbpData?.metrics?.calls ?? 0}</h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Chamadas Recebidas</p>
        </div>
        <div className="glass-card rounded-2xl p-8 shadow-sm border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-5xl font-black tracking-tighter mb-2 text-[#00ff9d] drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{gbpData?.metrics?.directions ?? 0}</h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Rotas Solicitadas</p>
        </div>
        <div className="glass-card rounded-2xl p-8 shadow-sm border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
          <div className="text-4xl mb-4">🖱️</div>
          <h3 className="text-5xl font-black tracking-tighter mb-2 text-[#00ff9d] drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{gbpData?.metrics?.websiteClicks ?? 0}</h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Visitas ao Site</p>
        </div>
      </div>
    </div>
  );
}
