'use client';

import { useRef, useState, useEffect } from 'react';

interface Props {
  gbpData: any;
  days: number;
  clientId?: string;
}

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

export default function TabGBPReport({ gbpData, days, clientId }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clientLogo, setClientLogo] = useState<string | null>(null);
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState('#cc0000');
  const [reportTitle, setReportTitle] = useState('DESEMPENHO');

  // Load logos from localStorage on mount
  useEffect(() => {
    if (clientId) {
      const saved = localStorage.getItem(`fl_client_logo_${clientId}`);
      if (saved) setClientLogo(saved);
    }
    const savedAgency = localStorage.getItem('fl_agency_logo');
    if (savedAgency) setAgencyLogo(savedAgency);
  }, [clientId]);

  const handleLogoUpload = (type: 'client' | 'agency', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      if (type === 'client') {
        setClientLogo(b64);
        if (clientId) localStorage.setItem(`fl_client_logo_${clientId}`, b64);
      } else {
        setAgencyLogo(b64);
        localStorage.setItem('fl_agency_logo', b64);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = (type: 'client' | 'agency') => {
    if (type === 'client') {
      setClientLogo(null);
      if (clientId) localStorage.removeItem(`fl_client_logo_${clientId}`);
    } else {
      setAgencyLogo(null);
      localStorage.removeItem('fl_agency_logo');
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    try {
      const { toPng } = await import('html-to-image');
      const { default: jsPDF } = await import('jspdf');

      const dataUrl = await toPng(reportRef.current, {
        quality: 1,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        skipFonts: false,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH);

      const businessName = (gbpData?.title || 'Perfil').replace(/\s+/g, '_');
      const now = new Date();
      const monthYear = `${MONTHS_PT[now.getMonth()]}_${now.getFullYear()}`;
      pdf.save(`Relatorio_${businessName}_${monthYear}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Metrics
  const calls         = gbpData?.metrics?.calls         ?? 0;
  const directions    = gbpData?.metrics?.directions    ?? 0;
  const websiteClicks = gbpData?.metrics?.websiteClicks ?? 0;
  const messages      = gbpData?.metrics?.messages      ?? 0;
  const bookings      = gbpData?.metrics?.bookings      ?? 0;
  const views         = gbpData?.metrics?.views         ?? 0;
  const totalInt      = calls + directions + websiteClicks + messages + bookings;
  const topKw         = gbpData?.keywords?.[0];
  const allKws        = gbpData?.keywords ?? [];

  // Period label
  const now   = new Date();
  const start = new Date(); start.setDate(now.getDate() - days);
  const periodLabel = `${MONTHS_PT[start.getMonth()].toUpperCase()} ${start.getFullYear()}`;

  // Scale preview to fit screen nicely
  const REPORT_W = 794;
  const REPORT_H = 1123;

  const tableRows = [
    { label: 'Interações',                   value: totalInt,      highlight: true },
    { label: 'Chamadas',                      value: calls,         highlight: false },
    { label: 'Rotas feitas',                  value: directions,    highlight: false },
    { label: 'Cliques no Website',            value: websiteClicks, highlight: false },
    { label: 'Cliques no Chat (Mensagens)',   value: messages,      highlight: false },
    { label: 'Agendamentos',                  value: bookings,      highlight: false },
    { label: 'Pessoas que acharam o perfil',  value: views,         highlight: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* ── CONTROLES ── */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Relatório de Desempenho</h2>
          <p className="text-sm text-gray-400">PDF profissional pronto para apresentar ao cliente</p>
        </div>
        <button
          id="btn-download-pdf"
          onClick={generatePDF}
          disabled={isGenerating || !gbpData}
          className="bg-[#00ff9d] text-gray-900 font-black py-3 px-8 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] flex items-center gap-2 text-sm"
        >
          {isGenerating ? (
            <><span className="animate-spin inline-block">⏳</span> Gerando PDF…</>
          ) : (
            <><span>⬇️</span> Baixar PDF</>
          )}
        </button>
      </div>

      {/* ── PERSONALIZAÇÃO ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Logo do Cliente */}
        <div className="glass-card rounded-2xl p-5 border border-white/5">
          <p className="text-[10px] text-[#00ff9d] font-bold uppercase tracking-widest mb-3">Logo do Cliente</p>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden bg-white/5 flex-shrink-0">
              {clientLogo
                ? <img src={clientLogo} alt="Logo cliente" className="w-full h-full object-contain" />
                : <span className="text-2xl">🏢</span>}
            </div>
            <div className="space-y-1.5">
              <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-all block text-center">
                {clientLogo ? 'Trocar logo' : 'Upload logo'}
                <input id="upload-client-logo" type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleLogoUpload('client', e.target.files[0])} />
              </label>
              {clientLogo && (
                <button onClick={() => removeLogo('client')} className="text-[10px] text-red-400 hover:text-red-300 block text-center w-full">
                  Remover
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-2">Aparece no topo · salvo por cliente</p>
        </div>

        {/* Logo da Agência */}
        <div className="glass-card rounded-2xl p-5 border border-white/5">
          <p className="text-[10px] text-[#007aff] font-bold uppercase tracking-widest mb-3">Logo da Agência</p>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden bg-white/5 flex-shrink-0">
              {agencyLogo
                ? <img src={agencyLogo} alt="Logo agência" className="w-full h-full object-contain" />
                : <span className="text-2xl">🎯</span>}
            </div>
            <div className="space-y-1.5">
              <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-all block text-center">
                {agencyLogo ? 'Trocar logo' : 'Upload logo'}
                <input id="upload-agency-logo" type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleLogoUpload('agency', e.target.files[0])} />
              </label>
              {agencyLogo && (
                <button onClick={() => removeLogo('agency')} className="text-[10px] text-red-400 hover:text-red-300 block text-center w-full">
                  Remover
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-2">Rodapé do PDF · salvo globalmente</p>
        </div>

        {/* Personalização de cor */}
        <div className="glass-card rounded-2xl p-5 border border-white/5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Cor de Destaque</p>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="color"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
            />
            <div className="flex gap-2 flex-wrap">
              {['#cc0000','#1a56db','#059669','#7c3aed','#d97706','#0ea5e9'].map(c => (
                <button key={c} onClick={() => setAccentColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: c === accentColor ? 'white' : 'transparent' }} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Título do relatório</p>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 text-white text-sm font-bold px-3 py-1.5 rounded-lg"
              maxLength={20}
            />
          </div>
        </div>
      </div>

      {/* ── PRÉ-VISUALIZAÇÃO DO PDF ── */}
      <div className="glass-card rounded-2xl p-6 border border-white/5">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-5">📄 Pré-visualização · A4</p>

        <div className="overflow-x-auto flex justify-center">
          {/* Wrapper para scale no desktop */}
          <div style={{ transform: 'scale(0.65)', transformOrigin: 'top center', width: `${REPORT_W}px`, height: `${REPORT_H}px`, flexShrink: 0 }}>

            {/* ═══ PDF TEMPLATE ═══ */}
            <div
              ref={reportRef}
              style={{
                width: `${REPORT_W}px`,
                height: `${REPORT_H}px`,
                backgroundColor: '#ffffff',
                fontFamily: '"Arial", "Helvetica", sans-serif',
                color: '#111111',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Barra topo colorida */}
              <div style={{ backgroundColor: accentColor, height: '18px', width: '100%', flexShrink: 0 }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '36px 52px 28px', flexShrink: 0 }}>
                {/* Esquerda: nome + período */}
                <div style={{ flex: 1, paddingRight: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: accentColor, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Google Meu Negócio
                  </div>
                  <h1 style={{ fontSize: '44px', fontWeight: '900', color: '#111', lineHeight: 1.05, margin: 0, textTransform: 'uppercase', letterSpacing: '-1px' }}>
                    {gbpData?.title || 'Nome da Empresa'}
                  </h1>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: '#444', marginTop: '10px', letterSpacing: '1px' }}>
                    {periodLabel}
                  </p>
                </div>

                {/* Direita: logo Google + logo cliente */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                  {/* Google Meu Negócio badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8f9fa', padding: '8px 14px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex' }}>
                      {'Google'.split('').map((ch, i) => (
                        <span key={i} style={{
                          fontSize: '20px', fontWeight: '800', fontFamily: 'Arial',
                          color: ['#4285f4','#ea4335','#fbbc04','#4285f4','#34a853','#ea4335'][i]
                        }}>{ch}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: '13px', color: '#555', fontWeight: '600' }}>Meu Negócio</span>
                  </div>

                  {/* Client logo ou placeholder */}
                  <div style={{ width: '200px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {clientLogo ? (
                      <img src={clientLogo} alt="Logo cliente" style={{ maxWidth: '200px', maxHeight: '110px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '200px', height: '110px', border: `2px dashed ${accentColor}55`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '28px' }}>🏢</span>
                        <span style={{ fontSize: '11px', color: '#aaa' }}>Logo do cliente</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Divisor */}
              <div style={{ height: '3px', backgroundColor: accentColor, margin: '0 52px', flexShrink: 0 }} />

              {/* Título DESEMPENHO */}
              <div style={{ textAlign: 'center', padding: '28px 52px 20px', flexShrink: 0 }}>
                <h2 style={{ fontSize: '52px', fontWeight: '900', color: '#111', margin: 0, letterSpacing: '-2px' }}>
                  {reportTitle}
                </h2>
              </div>

              {/* Corpo principal */}
              <div style={{ display: 'flex', padding: '0 52px', gap: '28px', flex: 1, alignItems: 'flex-start' }}>

                {/* Tabela de métricas */}
                <div style={{ flex: 1 }}>
                  {/* Cabeçalho da tabela */}
                  <div style={{ display: 'flex', borderRadius: '10px 10px 0 0', overflow: 'hidden' }}>
                    <div style={{ flex: 2, padding: '14px 22px', backgroundColor: accentColor, color: 'white', fontWeight: '800', fontSize: '18px', letterSpacing: '2px' }}>
                      AÇÕES
                    </div>
                    <div style={{ flex: 1, padding: '14px 22px', backgroundColor: '#1a1a1a', color: '#f5d000', fontWeight: '800', fontSize: '18px', textAlign: 'right', letterSpacing: '2px' }}>
                      QUANT.
                    </div>
                  </div>

                  {/* Linhas */}
                  {tableRows.map((row, i) => (
                    <div key={row.label} style={{
                      display: 'flex',
                      backgroundColor: i % 2 === 0 ? '#f5f5f5' : '#ffffff',
                      borderLeft: '1px solid #e0e0e0',
                      borderRight: '1px solid #e0e0e0',
                      borderBottom: '1px solid #e0e0e0',
                    }}>
                      <div style={{ flex: 2, padding: '18px 22px', fontSize: row.highlight ? '22px' : '20px', fontWeight: row.highlight ? '700' : '400', color: '#222' }}>
                        {row.label}
                      </div>
                      <div style={{ flex: 1, padding: '18px 22px', fontSize: row.highlight ? '24px' : '22px', fontWeight: '800', color: row.highlight ? accentColor : '#111', textAlign: 'right' }}>
                        {row.value.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}

                  {/* Seção de keyword */}
                  {topKw && (
                    <div style={{ marginTop: '28px', textAlign: 'center', padding: '0 4px' }}>
                      <p style={{ fontSize: '15px', fontWeight: '700', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.5 }}>
                        PALAVRA CHAVE MAIS DIGITADA NAS PESQUISAS DOS USUÁRIOS, FOI{' '}
                        <span style={{ color: accentColor }}>{topKw.keyword?.toUpperCase()}</span>
                      </p>
                      <p style={{ fontSize: '68px', fontWeight: '900', color: '#111', margin: '12px 0 0', lineHeight: 1 }}>
                        {topKw.value != null && topKw.value > 0
                          ? topKw.value.toLocaleString('pt-BR')
                          : `< ${topKw.threshold ?? 15}`} VEZES
                      </p>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px' }}>
                        ESSA FOI A QUANTIDADE DE PESSOAS QUE ENCONTRARAM O PERFIL DA EMPRESA COM ESSA PALAVRA CHAVE
                      </p>
                    </div>
                  )}
                </div>

                {/* Coluna direita: top keywords + logo da agência */}
                <div style={{ width: '210px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>

                  {/* Top Keywords */}
                  {allKws.length > 1 && (
                    <div style={{ width: '100%', backgroundColor: '#f0f5ff', borderRadius: '14px', padding: '18px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '800', color: accentColor, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
                        Top Pesquisas
                      </p>
                      {allKws.slice(0, 6).map((k: any, i: number) => (
                        <div key={k.keyword} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '7px 0',
                          borderBottom: i < Math.min(allKws.length, 6) - 1 ? '1px solid #dce6ff' : 'none'
                        }}>
                          <span style={{ fontSize: '13px', color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {i + 1}. {k.keyword}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: accentColor, marginLeft: '8px', flexShrink: 0 }}>
                            {k.value != null ? k.value.toLocaleString('pt-BR') : `<${k.threshold ?? 15}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Logo da Agência */}
                  <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: '30px' }}>
                    {agencyLogo ? (
                      <img src={agencyLogo} alt="Agência" style={{ maxWidth: '170px', maxHeight: '130px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '170px', height: '90px', border: '2px dashed #ddd', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '22px' }}>🎯</span>
                        <span style={{ fontSize: '11px', color: '#bbb' }}>Logo da Agência</span>
                      </div>
                    )}
                    <p style={{ fontSize: '10px', color: '#aaa', marginTop: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Marketing Digital
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra inferior colorida */}
              <div style={{ backgroundColor: accentColor, height: '18px', width: '100%', marginTop: 'auto', flexShrink: 0 }} />
            </div>
            {/* ═══ FIM PDF TEMPLATE ═══ */}

          </div>
        </div>
      </div>

      {/* Dica */}
      <div className="text-center">
        <p className="text-xs text-gray-600">
          💡 O PDF é gerado em alta resolução (2.5×) · Formatos aceitos para logo: PNG, JPG, SVG, WEBP
        </p>
      </div>

    </div>
  );
}
