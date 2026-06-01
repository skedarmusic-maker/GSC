'use client';

import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { QrCode, Download, Image as ImageIcon, Sparkles, RefreshCw, Palette } from 'lucide-react';

interface Props {
  gbpData: any;
}

export default function TabGBPCards({ gbpData }: Props) {
  // Configurações do Card
  const [businessName, setBusinessName] = useState(gbpData?.title || 'Seu Negócio');
  const [reviewUrl, setReviewUrl] = useState(
    gbpData?.locationId 
      ? `https://search.google.com/local/writereview?placeid=${gbpData.locationId}`
      : 'https://search.google.com/local/writereview'
  );
  const [ctaText, setCtaText] = useState('Escaneie o QR Code para nos avaliar no Google!');
  const [accentColor, setAccentColor] = useState('#00ff9d');
  const [bgColor, setBgColor] = useState('#0f172a'); // Slate 900
  const [textColor, setTextColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'mobile' | 'print'>('mobile');
  const [generating, setGenerating] = useState(false);

  // Refs para capturar a imagem
  const mobileCardRef = useRef<HTMLDivElement>(null);
  const printCardRef = useRef<HTMLDivElement>(null);

  // Presets de Cores Premium (FocusLocal Aesthetics)
  const colorPresets = [
    { name: 'Emerald Cyber', bg: '#090d16', text: '#ffffff', accent: '#00ff9d' },
    { name: 'Dark Carbon', bg: '#121214', text: '#f3f4f6', accent: '#ffffff' },
    { name: 'Ocean Tech', bg: '#030712', text: '#ffffff', accent: '#3b82f6' },
    { name: 'Sunset Bronze', bg: '#18120c', text: '#fbf7f5', accent: '#f97316' },
    { name: 'Premium Gold', bg: '#0b0f19', text: '#ffffff', accent: '#eab308' },
  ];

  // Handler para Upload de Logo Local (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // URL para a imagem do QR Code (Gerada pela API qrserver.com estável)
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reviewUrl)}&color=${accentColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&margin=10`;

  // Download do Cartão Digital (PNG)
  const downloadMobileCard = async () => {
    if (!mobileCardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(mobileCardRef.current, {
        quality: 0.95,
        pixelRatio: 2, // Melhorar resolução da imagem exportada
      });
      const link = document.createElement('a');
      link.download = `cartao-avaliacao-${businessName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar PNG do cartão:', err);
      alert('Erro ao gerar imagem. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  // Download do PDF A4 para Impressão
  const downloadPrintCard = async () => {
    if (!printCardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(printCardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 Width em mm
      const imgHeight = 297; // A4 Height em mm

      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`folha-impressao-${businessName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF de impressão:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setBgColor(preset.bg);
    setTextColor(preset.text);
    setAccentColor(preset.accent);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in pb-10">
      
      {/* PAINEL DE CONTROLE (ESQUERDA) */}
      <div className="xl:col-span-5 space-y-6">
        <div className="bg-[#090d16] border border-white/5 rounded-2xl p-6 space-y-6">
          
          <div>
            <span className="text-[10px] text-[#00ff9d] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Palette className="w-3.5 h-3.5" /> Estilo e Identidade
            </span>
            <h3 className="text-xl font-black text-white">Customizar Card</h3>
            <p className="text-xs text-gray-500 mt-1">Configure o design do seu cartão de avaliações física e digital.</p>
          </div>

          <hr className="border-white/5" />

          {/* Nome da Empresa */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome da Empresa</label>
            <input 
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-[#121824] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff9d]"
              placeholder="Ex: Minha Marmoraria"
            />
          </div>

          {/* Link de Avaliação */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Link do Google Reviews</label>
            <input 
              type="text"
              value={reviewUrl}
              onChange={(e) => setReviewUrl(e.target.value)}
              className="w-full bg-[#121824] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff9d]"
              placeholder="https://search.google.com/local/writereview?..."
            />
            <p className="text-[10px] text-gray-500">Este link é codificado dentro do QR Code para direcionar o cliente.</p>
          </div>

          {/* Chamada para Ação */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chamada para Ação (CTA)</label>
            <textarea 
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="w-full bg-[#121824] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff9d] h-20 resize-none"
              maxLength={100}
              placeholder="Escaneie o QR Code e avalie o nosso atendimento!"
            />
          </div>

          {/* Upload de Logo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Logo da Empresa (Opcional)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 bg-[#121824] hover:bg-[#1a2334] border border-white/10 rounded-lg px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-all">
                <ImageIcon className="w-4 h-4 text-gray-400" />
                <span>Escolher Imagem</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden" 
                />
              </label>
              {logoUrl && (
                <button 
                  onClick={() => setLogoUrl(null)}
                  className="text-xs text-red-400 hover:text-red-300 font-bold"
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Seleção de Paleta / Cores */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Presets de Cores</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="flex items-center gap-1.5 bg-[#121824] hover:bg-[#1a2334] border border-white/5 rounded-lg p-2 transition-all text-[11px] text-gray-300 font-bold"
                >
                  <span className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: preset.accent }}></span>
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Fundo</label>
                <input 
                  type="color" 
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full h-8 bg-transparent border-0 cursor-pointer rounded-lg overflow-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Texto</label>
                <input 
                  type="color" 
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full h-8 bg-transparent border-0 cursor-pointer rounded-lg overflow-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Destaque</label>
                <input 
                  type="color" 
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full h-8 bg-transparent border-0 cursor-pointer rounded-lg overflow-hidden"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PREVIEW E AÇÕES (DIREITA) */}
      <div className="xl:col-span-7 flex flex-col items-center space-y-6">
        
        {/* Seletores de Visualização */}
        <div className="flex bg-[#090d16] border border-white/5 rounded-lg p-1 w-full max-w-[400px]">
          <button
            onClick={() => setActivePreviewTab('mobile')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-md transition-all ${
              activePreviewTab === 'mobile' ? 'bg-[#00ff9d] text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            📱 Cartão Digital
          </button>
          <button
            onClick={() => setActivePreviewTab('print')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-md transition-all ${
              activePreviewTab === 'print' ? 'bg-[#00ff9d] text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            🖨️ Placa de Balcão (A4)
          </button>
        </div>

        {/* MOCKUP CONTAINER */}
        <div className="flex justify-center items-center w-full bg-[#05070c] border border-white/5 rounded-3xl p-8 relative overflow-hidden" style={{ minHeight: '600px' }}>
          
          {/* Fundo decorativo Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

          {/* VISUALIZAÇÃO: CARTÃO DIGITAL */}
          {activePreviewTab === 'mobile' && (
            <div className="relative mx-auto w-[320px] h-[550px] bg-black rounded-[40px] p-3 shadow-2xl border-4 border-gray-800" style={{ boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9)' }}>
              {/* Speaker e Câmera Mockup */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-gray-800 rounded-full z-20 flex justify-center items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                <div className="w-8 h-1 bg-gray-900 rounded-full"></div>
              </div>
              
              {/* Tela do Celular / Elemento Exportável */}
              <div 
                ref={mobileCardRef}
                className="w-full h-full rounded-[32px] overflow-hidden flex flex-col justify-between p-6 relative font-sans transition-all"
                style={{ backgroundColor: bgColor }}
              >
                {/* Logo e Nome */}
                <div className="flex flex-col items-center text-center mt-12 space-y-3">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
                    </div>
                  )}
                  <h4 className="text-lg font-black tracking-tight" style={{ color: textColor }}>{businessName}</h4>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center my-6 space-y-4">
                  <div className="bg-white p-3 rounded-2xl shadow-xl border border-white/10 transition-all duration-300">
                    <img 
                      src={qrCodeImageUrl} 
                      alt="QR Code de Avaliações"
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                    <QrCode className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Leitor QR Code</span>
                  </div>
                </div>

                {/* CTA / Rodapé */}
                <div className="text-center pb-4 space-y-3">
                  <p className="text-xs font-semibold px-4" style={{ color: textColor, opacity: 0.9 }}>
                    {ctaText}
                  </p>
                  <p className="text-[8px] uppercase tracking-widest text-gray-500 font-black">
                    Powered by FocusLocal
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VISUALIZAÇÃO: PLACA DE IMPRESSÃO (A4) */}
          {activePreviewTab === 'print' && (
            <div className="border border-white/10 shadow-2xl overflow-auto max-h-[580px] p-2 bg-gray-900 rounded-lg">
              {/* Elemento Exportável A4 (Proporção exata de 210mm x 297mm - 595px x 842px) */}
              <div 
                ref={printCardRef}
                className="w-[595px] h-[842px] relative flex flex-col justify-between p-12 bg-white text-gray-900 select-none"
                style={{ backgroundColor: '#ffffff' }}
              >
                {/* Linhas guia para dobra/corte na impressão */}
                <div className="absolute top-0 inset-x-0 h-4 border-b border-dashed border-gray-300 flex justify-between px-2 text-[8px] text-gray-400">
                  <span>Dobrar aqui</span>
                  <span>Dobrar aqui</span>
                </div>

                {/* Topo do Folder A4 */}
                <div className="flex flex-col items-center text-center space-y-4 pt-10">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="w-24 h-24 rounded-2xl object-cover border border-gray-200" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <Sparkles className="w-8 h-8" style={{ color: bgColor }} />
                    </div>
                  )}
                  <h2 className="text-3xl font-black tracking-tight" style={{ color: bgColor }}>{businessName}</h2>
                  <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></div>
                </div>

                {/* Centro do Folder (QR Code Gigante) */}
                <div className="flex flex-col items-center justify-center my-6 space-y-6">
                  <div className="bg-white p-5 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.1)] border-2" style={{ borderColor: accentColor }}>
                    <img 
                      src={qrCodeImageUrl} 
                      alt="QR Code de Avaliações"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  <div className="text-center max-w-[400px] space-y-2">
                    <p className="text-lg font-black tracking-tight text-gray-800">
                      {ctaText}
                    </p>
                    <p className="text-xs text-gray-400">
                      Abra a câmera do seu celular para escanear e deixe sua avaliação em menos de 1 minuto!
                    </p>
                  </div>
                </div>

                {/* Rodapé A4 */}
                <div className="border-t border-gray-100 pt-6 flex justify-between items-center text-gray-400 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></div>
                    <span className="font-bold tracking-tight">Avalie-nos no Google</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-black text-gray-300">FocusLocal Print System</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BOTÕES DE DOWNLOAD */}
        <div className="flex gap-4 w-full max-w-[400px]">
          {activePreviewTab === 'mobile' ? (
            <button
              onClick={downloadMobileCard}
              disabled={generating}
              className="flex-1 bg-[#00ff9d] hover:bg-[#00e18a] disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold py-3 px-6 rounded-lg text-xs transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando Imagem...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar Cartão Digital</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={downloadPrintCard}
              disabled={generating}
              className="flex-1 bg-[#00ff9d] hover:bg-[#00e18a] disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold py-3 px-6 rounded-lg text-xs transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF A4</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
