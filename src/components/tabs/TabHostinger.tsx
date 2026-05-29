import React, { useEffect, useState } from 'react';

interface TabHostingerProps {
  sites?: any[];
}

const TabHostinger: React.FC<TabHostingerProps> = ({ sites = [] }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHostingerData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hostinger');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostingerData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-[#00ff9d] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium">Sincronizando com Hostinger...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
        <p className="text-red-400 mb-4">⚠️ {error}</p>
        <button onClick={fetchHostingerData} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Tentar Novamente</button>
      </div>
    );
  }

  // Filtragem: Exibir apenas sites da Hostinger que batem com a URL (GSC) registrada no sistema
  // GSC URLs geralmente são "sc-domain:exemplo.com" ou "https://exemplo.com/"
  const extractDomain = (url: string) => {
    if (!url) return '';
    let clean = url.replace('sc-domain:', '').replace('https://', '').replace('http://', '');
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    if (clean.startsWith('www.')) clean = clean.substring(4);
    return clean.toLowerCase();
  };

  const registeredDomains = sites.map(s => extractDomain(s.gscUrl)).filter(Boolean);

  const filteredWebsites = data?.websites?.filter((site: any) => {
    const siteDomain = extractDomain(site.domain);
    return registeredDomains.includes(siteDomain);
  }) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter">Gestão Hostinger</h2>
          <p className="text-gray-400 text-sm">Controle seus domínios e servidores diretamente no FocusLocal.</p>
        </div>
        <button 
          onClick={fetchHostingerData}
          className="bg-[#161b22] hover:bg-[#1c2128] text-gray-300 px-4 py-2 rounded-lg text-xs font-bold border border-gray-800 transition-all flex items-center gap-2"
        >
          <span>🔄 Atualizar</span>
        </button>
      </div>

      {/* Grid de Servidores */}
      {data?.vps?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.vps.map((server: any) => (
            <div key={server.id} className="bg-[#161b22] border border-gray-800 rounded-xl p-5 hover:border-[#00ff9d]/30 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    🖥️
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{server.name || 'Servidor VPS'}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{server.ip}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${server.status === 'running' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {server.status?.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0d1117] p-2 rounded-lg text-center">
                  <p className="text-[9px] text-gray-500 uppercase">CPU</p>
                  <p className="text-xs text-white font-bold">{server.cpu_usage || '0'}%</p>
                </div>
                <div className="bg-[#0d1117] p-2 rounded-lg text-center">
                  <p className="text-[9px] text-gray-500 uppercase">RAM</p>
                  <p className="text-xs text-white font-bold">{server.ram_usage || '0'}%</p>
                </div>
                <div className="bg-[#0d1117] p-2 rounded-lg text-center">
                  <p className="text-[9px] text-gray-500 uppercase">Disk</p>
                  <p className="text-xs text-white font-bold">{server.disk_usage || '0'}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de Websites (Hospedagem) - Filtrada */}
      <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-[#1c2128]/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            🚀 Meus Sites (Ativos no GSC) <span className="bg-[#00ff9d] text-gray-900 px-2 py-0.5 rounded-full text-[10px] font-bold">{filteredWebsites.length}</span>
          </h3>
        </div>
        <div className="divide-y divide-gray-800">
          {filteredWebsites.length > 0 ? filteredWebsites.map((site: any) => (
            <div key={site.id} className="p-4 hover:bg-[#1c2128] transition-all flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 text-xs">
                  🌐
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-200 group-hover:text-[#00ff9d] transition-colors">{site.domain}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded uppercase tracking-wider">{site.type}</span>
                    {site.is_enabled ? (
                      <span className="text-[9px] text-green-500 flex items-center gap-1">● Ativo</span>
                    ) : (
                      <span className="text-[9px] text-red-500 flex items-center gap-1">● Suspenso</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a href={`https://${site.domain}`} target="_blank" className="bg-[#0d1117] hover:bg-[#00ff9d] hover:text-black p-2 rounded-lg transition-all">
                  ↗️
                </a>
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-gray-500 text-sm italic">
              Nenhum site da Hostinger corresponde aos clientes selecionados no GSC.
            </div>
          )}
        </div>
      </div>

      {/* Lista de Domínios (DNS) */}
      <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden opacity-50 hover:opacity-100 transition-opacity">
        <div className="p-4 border-b border-gray-800 bg-[#1c2128]/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            🔗 Zonas de DNS Ocultas <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full text-[10px]">{data?.domains?.length || 0}</span>
          </h3>
        </div>
        {data?.domains?.length > 0 && (
          <div className="p-4 text-xs text-gray-500 border-b border-gray-800">
            Você tem {data.domains.length} zonas de DNS manuais configuradas.
          </div>
        )}
      </div>
    </div>
  );
};

export default TabHostinger;
