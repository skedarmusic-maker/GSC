'use client';

interface Props {
  trackedKeywords: any[];
  newKeyword: string;
  loadingRank: boolean;
  rankRadius: string;
  competitorData: { [key: string]: any };
  loadingComp: { [key: string]: boolean };
  gbpData: any;
  selectedGbp: any;
  setNewKeyword: (v: string) => void;
  setRankRadius: (v: string) => void;
  handleAddKeyword: () => void;
  fetchCompetitors: (keyword: string) => void;
}

export default function TabGBPRank({
  trackedKeywords, newKeyword, loadingRank, rankRadius,
  competitorData, loadingComp, gbpData, selectedGbp,
  setNewKeyword, setRankRadius, handleAddKeyword, fetchCompetitors
}: Props) {

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const blue = [66, 133, 244] as [number, number, number];
    const dark = [10, 10, 10] as [number, number, number];
    const white = [255, 255, 255] as [number, number, number];
    const gray = [120, 120, 120] as [number, number, number];

    doc.setFillColor(...dark);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setFillColor(...blue);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Rank Tracker', 14, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${gbpData?.title || selectedGbp?.name || 'N/A'}`, 14, 26);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 32);

    doc.setFillColor(20, 20, 30);
    doc.roundedRect(10, 42, 190, 38, 3, 3, 'F');
    doc.setTextColor(...blue);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SOBRE OS DADOS', 16, 50);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const disclaimer = 'As posições são obtidas via SerpApi simulando uma busca no Google Maps a partir das coordenadas do perfil do cliente. O ranking pode variar por localização do usuário, horário e personalização do Google.';
    const lines = doc.splitTextToSize(disclaimer, 178);
    doc.text(lines, 16, 57);

    let y = 90;
    doc.setTextColor(...white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PALAVRAS-CHAVE MONITORADAS', 14, y - 4);

    trackedKeywords.forEach((kw: any) => {
      if (y > 260) { doc.addPage(); doc.setFillColor(...dark); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
      const pos = kw.rank_history?.[0]?.position || 99;
      const posLabel = pos === 99 ? '20+' : `#${pos}`;
      const bgColor: [number, number, number] = pos <= 3 ? [0, 80, 0] : pos <= 10 ? [80, 60, 0] : [80, 0, 0];
      const posColor: [number, number, number] = pos <= 3 ? [0, 200, 81] : pos <= 10 ? [255, 187, 51] : [255, 68, 68];
      const competitors = competitorData[kw.keyword] || [];

      doc.setFillColor(18, 18, 28);
      doc.roundedRect(10, y, 190, competitors.length > 0 ? 46 + (competitors.length * 10) : 28, 3, 3, 'F');
      doc.setFillColor(...bgColor);
      doc.roundedRect(170, y + 4, 24, 14, 2, 2, 'F');
      doc.setTextColor(...posColor);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(posLabel, 182, y + 13, { align: 'center' });

      doc.setTextColor(...white);
      doc.setFontSize(10);
      doc.text(kw.keyword, 16, y + 12);
      doc.setTextColor(...gray);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`${kw.rank_history?.length || 1} registro(s) • posição: ${posLabel}`, 16, y + 20);

      if (competitors.length > 0) {
        doc.setTextColor(...blue);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('TOP 3 CONCORRENTES', 16, y + 30);
        competitors.forEach((c: any, idx: number) => {
          doc.setTextColor(...(c.isUs ? blue : white));
          doc.setFont('helvetica', c.isUs ? 'bold' : 'normal');
          doc.setFontSize(8);
          doc.text(`${idx + 1}. ${c.isUs ? '★ Você' : c.title}`.substring(0, 45), 16, y + 38 + (idx * 9));
          doc.setTextColor(...gray);
          doc.text(`${c.rating}★ (${c.reviews})`, 155, y + 38 + (idx * 9), { align: 'right' });
        });
        y += 46 + (competitors.length * 9) + 6;
      } else {
        y += 34;
      }
    });

    doc.setTextColor(...gray);
    doc.setFontSize(7);
    doc.text('Gerado por FocusLocal • Os dados são snapshot no momento da consulta.', 105, 292, { align: 'center' });
    doc.save(`Rank_Tracker_${(gbpData?.title || 'relatorio').replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold">📈 Rank Tracker (Local Pack)</h2>
          <p className="text-gray-400 mt-1">Descubra em qual posição você aparece quando o cliente pesquisa pela palavra-chave na sua cidade.</p>
        </div>
        {trackedKeywords.length > 0 && (
          <button onClick={handleExportPDF}
            className="flex items-center gap-2 bg-[#00ff9d] text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] hover:shadow-[0_0_25px_rgba(0,255,157,0.5)] whitespace-nowrap flex-shrink-0">
            ⬇️ Baixar Relatório PDF
          </button>
        )}
      </div>

      <div className="glass-card rounded-2xl p-8 border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Ex: advogado trabalhista em são paulo"
            className="flex-1 bg-[#161b22] border border-gray-800 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] text-sm font-medium"
            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()} />
          <div className="flex items-center gap-2 bg-[#161b22] border border-gray-800 px-3 py-2 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase px-1">Raio</span>
            <select value={rankRadius} onChange={(e) => setRankRadius(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer">
              <option value="16z">3 km</option>
              <option value="15z">5 km</option>
              <option value="14z">10 km</option>
            </select>
          </div>
          <button onClick={handleAddKeyword} disabled={loadingRank || !newKeyword}
            className="bg-[#00ff9d] text-gray-900 disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none font-bold px-8 py-3.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(0,255,157,0.3)] hover:shadow-[0_0_25px_rgba(0,255,157,0.5)]">
            {loadingRank ? '⏳ Analisando...' : 'Monitorar Palavra-chave'}
          </button>
        </div>
      </div>

      {trackedKeywords.length === 0 ? (
        <div className="text-center p-16 border border-dashed border-gray-800 rounded-2xl text-gray-500 bg-[#161b22]/30 mt-8">Nenhuma palavra-chave monitorada.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          {trackedKeywords.map((kw: any, i: number) => {
            const lastPos = kw.rank_history?.[0]?.position || 99;
            const colorClass = lastPos <= 3 ? 'text-[#00ff9d] drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]' : lastPos <= 10 ? 'text-yellow-400' : 'text-red-400';
            const histLen = kw.rank_history?.length || 0;
            return (
              <div key={i} className="glass-card rounded-2xl p-8 flex flex-col border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
                <div className="flex justify-between items-start mb-2 border-b border-gray-800 pb-6">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Termo</p>
                    <h4 className="text-xl font-black text-white tracking-tight">{kw.keyword}</h4>
                    <p className="text-[10px] text-gray-500 mt-2">{histLen} atualização{histLen !== 1 ? 'ões' : ''} registrada{histLen !== 1 ? 's' : ''}</p>
                  </div>
                  <div className={`text-5xl font-black tracking-tighter ${colorClass}`}>{lastPos === 99 ? '20+' : `#${lastPos}`}</div>
                </div>
                {!competitorData[kw.keyword] ? (
                  <button onClick={() => fetchCompetitors(kw.keyword)} disabled={loadingComp[kw.keyword]}
                    className="mt-auto w-full bg-[#161b22] hover:bg-[#161b22]/80 border border-gray-800 text-[#00ff9d] font-bold py-3.5 rounded-xl text-sm transition-colors">
                    {loadingComp[kw.keyword] ? '🔍 Mapeando...' : '🔍 Benchmark com Top 3'}
                  </button>
                ) : (
                  <div className="mt-auto bg-[#0d1117]/50 rounded-xl p-5 border border-[#00ff9d]/20">
                    <p className="text-[10px] text-[#00ff9d] uppercase font-bold tracking-widest mb-4">Top 3 Concorrentes</p>
                    <div className="space-y-4">
                      {competitorData[kw.keyword].map((c: any, idx: number) => (
                        <div key={idx} className={`flex justify-between items-center text-sm ${c.isUs ? 'text-[#00ff9d] font-bold' : 'text-gray-300'}`}>
                          <a href={c.place_id ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.title)}&query_place_id=${c.place_id}` : `https://www.google.com/search?q=${encodeURIComponent(c.title)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="truncate w-48 xl:w-64 hover:text-[#00ff9d] transition-colors flex items-center gap-2 group">
                            <span>{idx + 1}. {c.isUs ? '⭐ Você' : c.title}</span>
                            {!c.isUs && <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↗️</span>}
                          </a>
                          <div className="flex gap-4 text-xs bg-[#161b22] px-3 py-1.5 rounded-full border border-gray-800">
                            <span className="font-bold text-[#00ff9d]">{c.rating}⭐</span>
                            <span className="text-gray-500">({c.reviews})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
