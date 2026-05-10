'use client';

interface Props {
  auditData: any;
  loadingAudit: boolean;
}

export default function TabGBPAudit({ auditData, loadingAudit }: Props) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">🛡️ Auditoria de Saúde do Perfil</h2>
      {loadingAudit ? (
        <div className="p-32 text-center glass-card border-[#00ff9d]/10 rounded-2xl shadow-[0_0_30px_rgba(0,255,157,0.05)]">
          <div className="w-10 h-10 border-4 border-[#00ff9d] border-t-transparent rounded-full animate-spin mb-4 mx-auto drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]"></div>
          <div className="text-[#00ff9d] text-lg font-bold drop-shadow-[0_0_10px_rgba(0,255,157,0.3)]">Processando checklist de 20 pontos de ranking...</div>
        </div>
      ) : auditData && !auditData.error && (
        <div className="border-l-[6px] rounded-2xl p-10 glass-card shadow-[0_0_30px_rgba(0,255,157,0.05)] flex flex-col md:flex-row gap-16" style={{ borderLeftColor: auditData.color }}>
          <div className="flex flex-col items-center justify-center text-center min-w-[200px]">
            <p className="text-xs uppercase font-bold tracking-widest text-gray-500 mb-4">Health Score</p>
            <div className="text-[100px] font-black leading-none mb-4 tracking-tighter drop-shadow-[0_0_20px_rgba(0,255,157,0.2)]" style={{ color: auditData.color }}>{auditData.score}</div>
            <div className="text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-black/50" style={{ color: auditData.color, border: `1px solid ${auditData.color}40` }}>{auditData.grade}</div>
          </div>
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
            {auditData.checklist.map((item: any, i: number) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1.5 text-xl">{item.passed ? '✅' : '❌'}</div>
                <div>
                  <p className="font-bold text-white text-[15px] mb-1.5">{item.name}</p>
                  <p className={`text-[13px] ${item.passed ? 'text-gray-500' : 'text-red-400 font-medium'}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
