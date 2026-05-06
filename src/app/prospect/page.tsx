'use client';

import { useState } from 'react';

export default function ProspectDashboard() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!query) return;
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const res = await fetch('/api/prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    if (status === 'Bom') return '#00C851';
    if (status === 'Razoável') return '#ffbb33';
    return '#ff4444';
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* HEADER DE BUSCA (Escondido na Impressão) */}
      <div className="no-print" style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>Gerador de Laudo de Vendas 📄</h1>
        <p style={{ color: '#888', marginBottom: '30px' }}>Digite o nome exato da empresa e a cidade para gerar um PDF de prospecção.</p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Ex: Serralheria Alvorada em Divinópolis"
            style={{ flex: 1, padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '1rem' }}
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !query}
            style={{ padding: '15px 30px', borderRadius: '8px', border: 'none', background: '#0070f3', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Buscando...' : 'Gerar Relatório'}
          </button>
        </div>
        {error && <p style={{ color: '#ff4444', marginTop: '20px' }}>{error}</p>}
      </div>

      {/* RELATÓRIO DE SAÚDE (Estilo GBP Check) */}
      {report && (
        <div className="report-container" style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          
          <div className="no-print" style={{ textAlign: 'right', marginBottom: '20px' }}>
            <button onClick={printReport} style={{ background: '#000', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              🖨️ Imprimir / Salvar PDF
            </button>
          </div>

          <header style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2rem', margin: 0, color: '#222' }}>Análise de Saúde: {report.target.name}</h1>
            <p style={{ color: '#666', marginTop: '5px' }}>{report.target.address}</p>
            <p style={{ color: '#0070f3', fontWeight: 'bold', marginTop: '5px' }}>Categoria: {report.target.category}</p>
          </header>

          {/* VELOCÍMETRO DE SCORE */}
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px', textTransform: 'uppercase' }}>Health Score Global</h2>
            <div style={{ position: 'relative', width: '200px', height: '100px', margin: '0 auto', overflow: 'hidden' }}>
              {/* Arco do fundo */}
              <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', border: '20px solid #eee', borderBottomColor: 'transparent', borderLeftColor: 'transparent', transform: 'rotate(-45deg)' }}></div>
              {/* Arco da nota */}
              <div style={{ 
                position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', 
                border: `20px solid ${report.score >= 80 ? '#00C851' : report.score >= 50 ? '#ffbb33' : '#ff4444'}`, 
                borderBottomColor: 'transparent', borderLeftColor: 'transparent', 
                transform: `rotate(${-45 + (report.score * 1.8)}deg)`, // 0 a 100 mapeado para 0 a 180 graus
                transition: 'transform 1s ease-out'
              }}></div>
            </div>
            <div style={{ fontSize: '3.5rem', fontWeight: 'bold', marginTop: '-20px', color: '#222' }}>{report.score}</div>
          </div>

          {/* CHECKLIST VISUAL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
            {report.checks.map((check: any, i: number) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '50%', color: '#fff', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                    background: getStatusColor(check.status)
                  }}>
                    {check.passed ? '✓' : '!'}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#333' }}>{check.name}</h3>
                </div>
                <p style={{ color: '#666', fontSize: '0.9rem', marginLeft: '34px', marginBottom: '15px' }}>{check.description}</p>
                
                {/* BARRA DE PROGRESSO COLORIDA */}
                <div style={{ marginLeft: '34px', display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: '#eee' }}>
                   <div style={{ flex: 1, background: check.status === 'Fraco' ? '#ff4444' : '#ddd', opacity: check.status === 'Fraco' ? 1 : 0.5 }}></div>
                   <div style={{ flex: 1, background: check.status === 'Razoável' ? '#ffbb33' : '#ddd', opacity: check.status === 'Razoável' ? 1 : 0.5 }}></div>
                   <div style={{ flex: 1, background: check.status === 'Bom' ? '#00C851' : '#ddd', opacity: check.status === 'Bom' ? 1 : 0.5 }}></div>
                </div>
                <div style={{ marginLeft: '34px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#999', marginTop: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                   <span style={{ width: '33%', textAlign: 'center', color: check.status === 'Fraco' ? '#ff4444' : '#999' }}>Fraco</span>
                   <span style={{ width: '33%', textAlign: 'center', color: check.status === 'Razoável' ? '#ffbb33' : '#999' }}>Razoável</span>
                   <span style={{ width: '33%', textAlign: 'center', color: check.status === 'Bom' ? '#00C851' : '#999' }}>Bom</span>
                </div>
              </div>
            ))}
          </div>

          {/* BENCHMARK DE CONCORRENTES (GRÁFICO DE BARRAS) */}
          {report.benchmark && report.benchmark.top10.length > 0 && (
            <div style={{ marginTop: '60px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                Top 10 Empresas no Segmento ({report.target.category})
              </h2>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '30px' }}>
                Apresenta as 10 empresas com a maior quantidade de avaliações. O seu negócio está na posição {report.benchmark.top10.findIndex((c:any) => c.isTarget) + 1 || '> 10'}.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {report.benchmark.top10.map((comp: any, idx: number) => {
                  // Calcular o tamanho da barra relativo ao maior
                  const maxReviews = Math.max(...report.benchmark.top10.map((c:any) => c.reviews));
                  const widthPercent = (comp.reviews / maxReviews) * 100;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '150px', fontSize: '0.85rem', color: '#555', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {idx + 1}. {comp.isTarget ? <strong>{comp.name}</strong> : comp.name}
                      </div>
                      <div style={{ flex: 1, background: '#f5f5f5', height: '24px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${widthPercent}%`, 
                          background: comp.isTarget ? '#ff4444' : '#4285F4',
                          transition: 'width 1s ease-out'
                        }}></div>
                      </div>
                      <div style={{ width: '30px', fontSize: '0.85rem', fontWeight: 'bold', color: '#333' }}>
                        {comp.reviews}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ESTILOS DE IMPRESSÃO */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          .container { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
          .report-container { box-shadow: none !important; padding: 0 !important; }
          @page { margin: 1cm; }
        }
      `}} />
    </div>
  );
}
