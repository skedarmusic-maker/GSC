'use client';

import { useState } from 'react';

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
  handleDeleteKeyword: (id: string) => void;
  handleUpdateKeywordRank: (keywordId: string, keyword: string) => void;
}

export default function TabGBPRank({
  trackedKeywords, newKeyword, loadingRank, rankRadius,
  competitorData, loadingComp, gbpData, selectedGbp,
  setNewKeyword, setRankRadius, handleAddKeyword, fetchCompetitors,
  handleDeleteKeyword, handleUpdateKeywordRank
}: Props) {

  const [selectedForPdf, setSelectedForPdf] = useState<string[]>([]);

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const C = {
      bg:      [10, 12, 18] as [number,number,number],
      card:    [18, 24, 36] as [number,number,number],
      cardAlt: [22, 28, 42] as [number,number,number],
      accent:  [0, 220, 130] as [number,number,number],
      blue:    [66, 133, 244] as [number,number,number],
      white:   [255, 255, 255] as [number,number,number],
      gray:    [140, 150, 165] as [number,number,number],
      grayDk:  [60, 70, 85] as [number,number,number],
      gold:    [255, 200, 60] as [number,number,number],
      red:     [255, 80, 80] as [number,number,number],
      green:   [0, 210, 100] as [number,number,number],
      amber:   [255, 170, 40] as [number,number,number],
    };

    const businessName = gbpData?.title || selectedGbp?.name || 'N/A';
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const keywordsToExport = selectedForPdf.length > 0
      ? trackedKeywords.filter(kw => selectedForPdf.includes(kw.id))
      : trackedKeywords;

    // ── CAPA ──────────────────────────────────────────────────────────────────
    doc.setFillColor(...C.bg);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setFillColor(0, 180, 110);
    doc.rect(0, 0, 210, 70, 'F');
    doc.setFillColor(...C.accent);
    doc.rect(0, 0, 8, 70, 'F');

    doc.setTextColor(...C.bg);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('FOCUSLOCAL', 15, 12);
    doc.setFontSize(22);
    doc.text('RANK TRACKER', 15, 32);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Posicionamento Local no Google Maps', 15, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Perfil: ${businessName}`, 15, 56);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Gerado em: ${today}`, 15, 64);

    // Badge com total de palavras
    doc.setFillColor(...C.card);
    doc.roundedRect(140, 10, 60, 50, 4, 4, 'F');
    doc.setTextColor(...C.accent);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text(String(keywordsToExport.length), 170, 38, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.gray);
    doc.text('palavras-chave', 170, 47, { align: 'center' });
    doc.text('monitoradas', 170, 53, { align: 'center' });

    // ── RESUMO EXECUTIVO ─────────────────────────────────────────────────────
    let y = 85;
    doc.setTextColor(...C.accent);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO', 15, y);
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.4);
    doc.line(15, y + 2, 195, y + 2);
    y += 9;

    const top3Count = keywordsToExport.filter(kw => (kw.rank_history?.[0]?.position || 99) <= 3).length;
    const top10Count = keywordsToExport.filter(kw => { const p = kw.rank_history?.[0]?.position || 99; return p > 3 && p <= 10; }).length;
    const out20Count = keywordsToExport.filter(kw => (kw.rank_history?.[0]?.position || 99) >= 99).length;
    const totalUpdates = keywordsToExport.reduce((acc: number, kw: any) => acc + (kw.rank_history?.length || 0), 0);

    const statCards = [
      { label: 'Top 3', value: String(top3Count), color: C.green },
      { label: 'Top 10', value: String(top10Count), color: C.amber },
      { label: 'Fora Top 20', value: String(out20Count), color: C.red },
      { label: 'Atualizacoes', value: String(totalUpdates), color: C.blue },
    ];
    statCards.forEach((s, i) => {
      const sx = 15 + i * 47;
      doc.setFillColor(...C.card);
      doc.roundedRect(sx, y, 43, 24, 3, 3, 'F');
      doc.setFillColor(...s.color);
      doc.roundedRect(sx, y, 43, 4, 1, 1, 'F');
      doc.setTextColor(...s.color);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(s.value, sx + 21.5, y + 16, { align: 'center' });
      doc.setTextColor(...C.gray);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(s.label, sx + 21.5, y + 22, { align: 'center' });
    });
    y += 31;

    // Legenda
    doc.setFillColor(...C.card);
    doc.roundedRect(15, y, 180, 13, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text('Legenda:', 20, y + 8);
    doc.setFillColor(...C.green); doc.circle(52, y + 6, 1.5, 'F');
    doc.setTextColor(...C.white); doc.text('Top 3 (otimo)', 56, y + 8);
    doc.setFillColor(...C.amber); doc.circle(93, y + 6, 1.5, 'F');
    doc.text('Top 10 (bom)', 97, y + 8);
    doc.setFillColor(...C.red); doc.circle(134, y + 6, 1.5, 'F');
    doc.text('Top 11+ (melhorar)', 138, y + 8);
    y += 19;

    // Disclaimer
    doc.setFillColor(...C.cardAlt);
    doc.roundedRect(15, y, 180, 18, 2, 2, 'F');
    doc.setTextColor(...C.blue);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('METODOLOGIA', 20, y + 6);
    doc.setTextColor(...C.gray);
    doc.setFont('helvetica', 'normal');
    const discl = 'Posicoes obtidas via SerpApi simulando busca no Google Maps a partir das coordenadas exatas do perfil. O ranking pode variar por localizacao do usuario, horario e personalizacao do Google.';
    doc.text(doc.splitTextToSize(discl, 170), 20, y + 12);
    y += 25;

    // ── DETALHES ─────────────────────────────────────────────────────────────
    doc.setTextColor(...C.accent);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHES POR PALAVRA-CHAVE', 15, y);
    doc.setDrawColor(...C.accent);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    keywordsToExport.forEach((kw: any) => {
      const pos = kw.rank_history?.[0]?.position || 99;
      const posLabel = pos === 99 ? '20+' : `#${pos}`;
      const posColor: [number,number,number] = pos <= 3 ? C.green : pos <= 10 ? C.amber : C.red;
      const bgPos: [number,number,number] = pos <= 3 ? [0,50,25] : pos <= 10 ? [50,38,0] : [50,10,10];

      const compEntry = competitorData[kw.keyword];
      const competitors: any[] = Array.isArray(compEntry) ? compEntry : (compEntry?.list || []);
      const ourPosition: number | null = compEntry?.ourPosition ?? null;

      const cardH = 32 + (competitors.length > 0 ? 10 + competitors.length * 10 + 12 : 0);

      if (y + cardH > 275) {
        doc.addPage();
        doc.setFillColor(...C.bg);
        doc.rect(0, 0, 210, 297, 'F');
        y = 15;
      }

      // Card
      doc.setFillColor(...C.card);
      doc.roundedRect(15, y, 180, cardH, 3, 3, 'F');
      doc.setFillColor(...posColor);
      doc.roundedRect(15, y, 4, cardH, 2, 2, 'F');

      // Badge posição
      doc.setFillColor(...bgPos);
      doc.roundedRect(162, y + 6, 29, 20, 3, 3, 'F');
      doc.setTextColor(...posColor);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(posLabel, 176.5, y + 18, { align: 'center' });
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.gray);
      doc.text('posicao Google', 176.5, y + 24, { align: 'center' });

      // Keyword
      doc.setTextColor(...C.white);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(kw.keyword, 22, y + 13);

      // Subinfo
      const histLen = kw.rank_history?.length || 0;
      const firstDate = kw.created_at ? new Date(kw.created_at).toLocaleDateString('pt-BR') : 'N/A';
      doc.setTextColor(...C.gray);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`${histLen} atualizacao(oes) registrada(s)  •  monitorado desde ${firstDate}`, 22, y + 22);

      // Histórico visual (últimas 5 posições)
      const history = (kw.rank_history || []).slice(0, 5).reverse();
      if (history.length >= 1) {
        doc.setTextColor(...C.grayDk);
        doc.setFontSize(6);
        doc.text('Historico:', 22, y + 30);
        history.forEach((h: any, i: number) => {
          const hp = h.position === 99 ? '20+' : `#${h.position}`;
          const hc: [number,number,number] = h.position <= 3 ? C.green : h.position <= 10 ? C.amber : C.red;
          doc.setFillColor(...hc);
          doc.circle(55 + i * 18, y + 29, 4, 'F');
          doc.setTextColor(...C.bg);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6);
          doc.text(hp, 55 + i * 18, y + 30.5, { align: 'center' });
          doc.setFont('helvetica', 'normal');
        });
      }

      // Concorrentes
      if (competitors.length > 0) {
        const csy = y + 36;
        doc.setDrawColor(...C.grayDk);
        doc.setLineWidth(0.2);
        doc.line(22, csy - 2, 193, csy - 2);
        doc.setTextColor(...C.blue);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('TOP 3 CONCORRENTES (busca centrada no seu perfil)', 22, csy + 5);

        competitors.forEach((c: any, idx: number) => {
          const cy = csy + 12 + idx * 10;
          doc.setFillColor(...C.cardAlt);
          doc.roundedRect(22, cy - 4, 171, 9, 1, 1, 'F');
          doc.setTextColor(...C.white);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.text(`${idx + 1}.`, 26, cy + 2);
          doc.setFont('helvetica', 'normal');
          doc.text((c.title || '').substring(0, 50), 32, cy + 2);
          doc.setTextColor(...C.gold);
          doc.setFont('helvetica', 'bold');
          doc.text(`${c.rating}*`, 152, cy + 2);
          doc.setTextColor(...C.gray);
          doc.setFont('helvetica', 'normal');
          doc.text(`(${c.reviews})`, 163, cy + 2);
          if (c.distanceKm && c.distanceKm !== 'N/A') {
            doc.setTextColor(...C.grayDk);
            doc.setFontSize(6);
            doc.text(`${c.distanceKm}`, 193, cy + 2, { align: 'right' });
          }
        });

        // Linha posição real do cliente
        const myPosY = csy + 12 + competitors.length * 10 + 2;
        doc.setFillColor(0, 70, 35);
        doc.roundedRect(22, myPosY, 171, 8, 1, 1, 'F');
        doc.setFontSize(7);
        if (ourPosition == null) {
          doc.setTextColor(...C.gray);
          doc.setFont('helvetica', 'normal');
          doc.text('Seu perfil nao apareceu no top 20 para esta busca', 107.5, myPosY + 5, { align: 'center' });
        } else if (ourPosition <= 3) {
          doc.setTextColor(...C.accent);
          doc.setFont('helvetica', 'bold');
          doc.text(`Voce esta em #${ourPosition} — Parabens! Esta no Top 3!`, 107.5, myPosY + 5, { align: 'center' });
        } else {
          doc.setTextColor(...C.amber);
          doc.setFont('helvetica', 'bold');
          doc.text(`Sua posicao real no Google: #${ourPosition}`, 107.5, myPosY + 5, { align: 'center' });
        }
      }

      y += cardH + 7;
    });

    // ── RODAPÉ em todas as páginas ────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let pg = 1; pg <= totalPages; pg++) {
      doc.setPage(pg);
      doc.setFillColor(...C.card);
      doc.rect(0, 289, 210, 8, 'F');
      doc.setTextColor(...C.gray);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text('FocusLocal • Dados sao snapshot no momento da consulta', 105, 294, { align: 'center' });
      doc.text(`Pag. ${pg} / ${totalPages}`, 195, 294, { align: 'right' });
    }

    doc.save(`Rank_Tracker_${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold">📈 Rank Tracker (Local Pack)</h2>
          <p className="text-gray-400 mt-1">Descubra em qual posição você aparece quando o cliente pesquisa pela palavra-chave na sua cidade.</p>
        </div>
        {trackedKeywords.length > 0 && (
          <div className="flex items-center gap-3">
            {selectedForPdf.length > 0 && (
              <span className="text-xs text-[#00ff9d] font-bold">
                {selectedForPdf.length} selecionada(s)
              </span>
            )}
            <button onClick={handleExportPDF}
              className="flex items-center gap-2 bg-[#00ff9d] text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] hover:shadow-[0_0_25px_rgba(0,255,157,0.5)] whitespace-nowrap flex-shrink-0">
              ⬇️ Baixar PDF {selectedForPdf.length > 0 ? 'Selecionadas' : 'Todas'}
            </button>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-8 border-[#00ff9d]/10" style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Ex: motor de arranque (não precisa colocar a cidade)"
              className="w-full bg-[#161b22] border border-gray-800 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] text-sm font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()} />
          </div>
          <div className="flex items-center gap-2 bg-[#161b22] border border-gray-800 px-3 py-2 rounded-xl" title="O centro da busca usa a coordenada GPS exata do perfil">
            <div className="flex flex-col justify-center">
              <span className="text-[8px] font-bold text-gray-500 uppercase px-1">Base da Busca</span>
              <span className="text-[10px] font-bold text-[#00ff9d] uppercase px-1 max-w-[150px] truncate">📍 {gbpData?.address?.split(',')[0] || gbpData?.title || 'Seu Perfil'}</span>
            </div>
            <div className="w-px h-6 bg-gray-800 mx-1"></div>
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
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer bg-[#161b22] px-3 py-1 rounded-full border border-gray-800 text-[10px] text-gray-400 font-bold uppercase hover:border-[#00ff9d]/30 transition-colors">
                        <input type="checkbox"
                          checked={selectedForPdf.includes(kw.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedForPdf(prev => [...prev, kw.id]);
                            } else {
                              setSelectedForPdf(prev => prev.filter(id => id !== kw.id));
                            }
                          }}
                          className="rounded border-gray-800 text-[#00ff9d] focus:ring-[#00ff9d] bg-transparent" />
                        <span>Selecionar para PDF</span>
                      </label>
                      <button onClick={() => handleUpdateKeywordRank(kw.id, kw.keyword)}
                        disabled={loadingRank}
                        title="Atualiza a posição agora (cache de 24h — não consome cota se já foi buscado hoje)"
                        className="text-gray-500 hover:text-[#00ff9d] transition-colors p-1.5 hover:bg-white/5 rounded-lg text-xs disabled:opacity-40">
                        🔄 Atualizar
                      </button>
                      <button onClick={() => handleDeleteKeyword(kw.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1.5 hover:bg-white/5 rounded-lg text-xs" title="Excluir Palavra-chave">
                        🗑️ Excluir
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Termo</p>
                    <h4 className="text-xl font-black text-white tracking-tight">{kw.keyword}</h4>
                    <p className="text-[10px] text-gray-500 mt-2">{histLen} atualização{histLen !== 1 ? 'ões' : ''} registrada{histLen !== 1 ? 's' : ''}</p>
                  </div>
                  <div className={`text-5xl font-black tracking-tighter ${lastPos === null ? 'text-gray-700' : colorClass}`}>
                    {lastPos === null ? '–' : lastPos === 99 ? '20+' : `#${lastPos}`}
                  </div>
                </div>

                {!competitorData[kw.keyword] ? (
                  <button onClick={() => fetchCompetitors(kw.keyword)} disabled={loadingComp[kw.keyword]}
                    className="mt-auto w-full bg-[#161b22] hover:bg-[#161b22]/80 border border-gray-800 text-[#00ff9d] font-bold py-3.5 rounded-xl text-sm transition-colors">
                    {loadingComp[kw.keyword] ? '⏳ Mapeando...' : '🔍 Benchmark com Top 3'}
                  </button>
                ) : (
                  <div className="mt-auto bg-[#0d1117]/50 rounded-xl p-5 border border-[#00ff9d]/20">
                    <p className="text-[10px] text-[#00ff9d] uppercase font-bold tracking-widest mb-4">Top 3 Concorrentes</p>
                    <div className="space-y-4">
                      {(competitorData[kw.keyword]?.list ?? competitorData[kw.keyword] ?? []).map((c: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm text-gray-300">
                          <a href={c.place_id ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.title)}&query_place_id=${c.place_id}` : `https://www.google.com/search?q=${encodeURIComponent(c.title)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="truncate w-48 xl:w-64 hover:text-[#00ff9d] transition-colors flex items-center gap-2 group">
                            <span>{idx + 1}. {c.title}</span>
                            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↗️</span>
                          </a>
                          <div className="flex gap-3 text-xs bg-[#161b22] px-3 py-1.5 rounded-full border border-gray-800">
                            {c.distanceKm && c.distanceKm !== 'N/A' && (
                              <span className="text-gray-400 font-semibold" title="Distância até o seu perfil">📍 {c.distanceKm}</span>
                            )}
                            <span className="font-bold text-[#00ff9d]">{c.rating}⭐</span>
                            <span className="text-gray-500">({c.reviews})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Posição real do cliente - separado dos Top 3 */}
                    {(() => {
                      const ourPos = competitorData[kw.keyword]?.ourPosition;
                      if (ourPos == null) return (
                        <p className="mt-4 pt-3 border-t border-gray-800 text-xs text-gray-500">📌 Seu perfil não apareceu no top 20 resultados para essa palavra-chave nesse raio.</p>
                      );
                      if (ourPos <= 3) return (
                        <p className="mt-4 pt-3 border-t border-gray-800 text-xs text-[#00ff9d] font-bold">🏆 Você está em #{ourPos} no Google para esta busca!</p>
                      );
                      return (
                        <p className="mt-4 pt-3 border-t border-gray-800 text-xs text-yellow-400">📊 Sua posição real no Google: <strong>#{ourPos}</strong></p>
                      );
                    })()}
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
