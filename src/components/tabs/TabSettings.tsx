'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, UploadCloud, CheckCircle, AlertTriangle, Globe, Phone, MapPin } from 'lucide-react';

const InstagramIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function TabSettings({ session }: { session: any }) {
  const [agencyName, setAgencyName] = useState('');
  const [agencyLogoUrl, setAgencyLogoUrl] = useState('');
  const [agencyInstagram, setAgencyInstagram] = useState('');
  const [agencyWebsite, setAgencyWebsite] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [agencyAddress, setAgencyAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (session?.user?.user_metadata) {
      setAgencyName(session.user.user_metadata.agency_name || '');
      setAgencyLogoUrl(session.user.user_metadata.agency_logo_url || '');
      setAgencyInstagram(session.user.user_metadata.agency_instagram || '');
      setAgencyWebsite(session.user.user_metadata.agency_website || '');
      setAgencyPhone(session.user.user_metadata.agency_phone || '');
      setAgencyAddress(session.user.user_metadata.agency_address || '');
    }
  }, [session]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'A imagem deve ter no máximo 2MB.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Usando o bucket 'post_image' que já existe e é público
      const fileExt = file.name.split('.').pop();
      const fileName = `agency-logo-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('post_image').upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('post_image').getPublicUrl(filePath);
      
      setAgencyLogoUrl(data.publicUrl);
      setMessage({ text: 'Logo enviado com sucesso! Não esqueça de salvar as configurações.', type: 'success' });
    } catch (error: any) {
      console.error('Erro ao fazer upload da logo:', error);
      setMessage({ text: 'Erro ao enviar a imagem. Tente novamente.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          agency_name: agencyName,
          agency_logo_url: agencyLogoUrl,
          agency_instagram: agencyInstagram,
          agency_website: agencyWebsite,
          agency_phone: agencyPhone,
          agency_address: agencyAddress,
        }
      });

      if (error) throw error;

      setMessage({ text: 'Configurações da agência salvas com sucesso! As alterações já estão aplicadas nos relatórios.', type: 'success' });
      
      // Atualiza a sessão local (recarregar a página ou atualizar contexto pode ser necessário se for usado globalmente de forma reativa, mas o getSession já pega o mais recente no load)
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      setMessage({ text: error.message || 'Erro ao salvar configurações.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
            <Building2 className="text-[#00ff9d] w-8 h-8" />
            Configurações <span className="text-[#00ff9d]">da Agência</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1 uppercase tracking-wide">
            Personalize o sistema com a sua marca. (White-label)
          </p>
        </div>
      </div>

      <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff9d]/5 blur-[80px] pointer-events-none" />
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-bold flex items-center gap-3 border ${
            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Nome da Agência / Profissional</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Ex: Focus Arts, João Silva SEO"
                className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00ff9d]/50 focus:ring-1 focus:ring-[#00ff9d]/30 transition-all"
              />
              <p className="text-[10px] text-gray-500 font-semibold">Este nome poderá ser usado em comunicações automatizadas e relatórios.</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Logotipo da sua Agência</label>
              
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl bg-[#0d1117] border-2 border-dashed border-gray-700 flex flex-col items-center justify-center shrink-0 overflow-hidden relative group">
                  {agencyLogoUrl ? (
                    <img src={agencyLogoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="text-gray-600 w-8 h-8" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <UploadCloud className="text-white w-6 h-6" />
                  </div>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleImageUpload}
                    disabled={loading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    title="Alterar Logo"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="url"
                      value={agencyLogoUrl}
                      onChange={(e) => setAgencyLogoUrl(e.target.value)}
                      placeholder="https://sua-logo.com/logo.png"
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00ff9d]/50 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold mt-2">
                    Faça upload clicando no quadro ao lado ou cole a URL direta de uma imagem (.png, .jpg ou .svg). Formato ideal: retangular ou quadrado com fundo transparente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800/80 pt-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Phone className="text-[#00ff9d] w-4 h-4" /> Informações de Contato (Exibidos no PDF do Relatório)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <InstagramIcon size={14} className="text-[#00ff9d]" /> Instagram / Rede Social
                </label>
                <input
                  type="text"
                  value={agencyInstagram}
                  onChange={(e) => setAgencyInstagram(e.target.value)}
                  placeholder="Ex: @focus.earts"
                  className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00ff9d]/50 focus:ring-1 focus:ring-[#00ff9d]/30 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Globe size={14} className="text-[#00ff9d]" /> Website
                </label>
                <input
                  type="text"
                  value={agencyWebsite}
                  onChange={(e) => setAgencyWebsite(e.target.value)}
                  placeholder="Ex: www.focusarts.com.br"
                  className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00ff9d]/50 focus:ring-1 focus:ring-[#00ff9d]/30 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Phone size={14} className="text-[#00ff9d]" /> Telefone
                </label>
                <input
                  type="text"
                  value={agencyPhone}
                  onChange={(e) => setAgencyPhone(e.target.value)}
                  placeholder="Ex: +55 (34) 99762-2017"
                  className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00ff9d]/50 focus:ring-1 focus:ring-[#00ff9d]/30 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#00ff9d]" /> Endereço Comercial
                </label>
                <input
                  type="text"
                  value={agencyAddress}
                  onChange={(e) => setAgencyAddress(e.target.value)}
                  placeholder="Ex: Av. Afonso Pena, 1500 - Belo Horizonte"
                  className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00ff9d]/50 focus:ring-1 focus:ring-[#00ff9d]/30 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#00ff9d] hover:bg-[#00e08b] text-gray-900 font-black uppercase tracking-widest text-xs px-8 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] hover:shadow-[0_0_30px_rgba(0,255,157,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
