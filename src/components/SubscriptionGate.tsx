'use client';

import { supabase } from '@/lib/supabase';

interface SubscriptionGateProps {
  userEmail: string;
  subscriptionStatus?: string;
}

export default function SubscriptionGate({ userEmail, subscriptionStatus }: SubscriptionGateProps) {
  const PIX_KEY = '42067991809';
  const WHATSAPP_NUMBER = '5511965843545';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isPending = subscriptionStatus === 'pending';
  const isExpired = subscriptionStatus === 'expired';

  const whatsappMsg = encodeURIComponent(
    isPending
      ? `Olá! Gostaria de solicitar a liberação do meu teste grátis no FocusLocal. Meu e-mail de cadastro é: ${userEmail}`
      : isExpired
      ? `Olá! Meu período de acesso ao FocusLocal expirou e gostaria de solicitar a renovação. Meu e-mail de cadastro é: ${userEmail}`
      : `Olá! Acabei de realizar o pagamento via PIX para assinar o FocusLocal. Meu e-mail de cadastro é: ${userEmail}`
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Elementos visuais de fundo - Sem roxo, apenas degradê verde/azul */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#00ff9d]/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[560px] z-10 space-y-6">

        {/* Logo e Cabeçalho */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161b22] border border-[#00ff9d]/20 text-xs font-bold text-[#00ff9d] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse inline-block" />
            FocusLocal — {isPending ? 'Solicitação de Teste' : isExpired ? 'Assinatura Expirada' : 'Acesso Profissional'}
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            {isPending ? (
              <>Aguardando <span className="text-[#00ff9d]">Liberação do Teste</span></>
            ) : isExpired ? (
              <>Sua assinatura <span className="text-rose-500">expirou!</span></>
            ) : (
              <>Quase lá, <span className="text-[#00ff9d]">falta um passo!</span></>
            )}
          </h1>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            {isPending ? (
              <>
                Para evitar fraudes e abusos de custos de API, o teste gratuito é liberado<br />
                manualmente. Solicite seu acesso no botão do WhatsApp abaixo.
              </>
            ) : isExpired ? (
              <>
                Seu período de acesso ao FocusLocal terminou. Para continuar utilizando<br />
                todas as ferramentas e dashboards, realize a renovação do seu plano.
              </>
            ) : (
              <>
                Sua conta foi criada com sucesso. Para ter acesso completo à plataforma,<br />
                realize o pagamento da assinatura via PIX.
              </>
            )}
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-[#161b22]/80 backdrop-blur-md border border-[#00ff9d]/20 rounded-2xl p-6 shadow-2xl space-y-5">
          
          {isPending ? (
            /* Layout para PENDING (WhatsApp em Destaque) */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500/10 rounded-xl text-2xl">💬</div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Aprovação Manual</p>
                  <p className="text-lg font-black text-white">Solicitar liberação do teste grátis</p>
                </div>
              </div>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-green-950/20 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chamar Suporte no WhatsApp
              </a>

              <div className="border-t border-gray-800/80 pt-4 space-y-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">⚡ Ou Ativação Premium Imediata (Sem Espera)</p>
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Chave PIX (CPF)</p>
                      <p className="text-sm font-bold text-white font-mono">{PIX_KEY}</p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(PIX_KEY)}
                      className="px-3 py-2 bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20 border border-[#00ff9d]/20 hover:border-[#00ff9d]/40 text-[#00ff9d] rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
                    >
                      📋 Copiar Chave
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] text-gray-400 bg-[#161b22] p-2 rounded-lg border border-gray-800">
                    <p>🏦 Banco: <strong>Santander</strong> — R$ 89/mês</p>
                    <p>👤 Nome: <strong>Gabriel de Amorim Lima</strong></p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Layout para CANCELLED (PIX em Destaque) */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#00ff9d]/10 rounded-xl text-2xl">💰</div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Valor da Assinatura</p>
                  <p className="text-3xl font-black text-white">R$ 89<span className="text-base font-semibold text-gray-400">/mês</span></p>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pague via PIX</p>
                
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Chave PIX (CPF)</p>
                      <p className="text-sm font-bold text-white font-mono">{PIX_KEY}</p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(PIX_KEY)}
                      className="px-3 py-2 bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20 border border-[#00ff9d]/20 hover:border-[#00ff9d]/40 text-[#00ff9d] rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] text-gray-400 bg-[#161b22] p-2 rounded-lg border border-gray-800">
                    <p>🏦 Banco: <strong>Santander</strong></p>
                    <p>👤 Nome: <strong>Gabriel de Amorim Lima</strong></p>
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 text-[11px] text-amber-400/90 flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <span>Após o pagamento, envie o comprovante via WhatsApp com seu e-mail de cadastro. Seu acesso será liberado em até <strong>15 minutos</strong> em horário comercial.</span>
                </div>
              </div>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-green-950/20 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar Comprovante via WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* Benefícios */}
        <div className="bg-[#161b22]/50 border border-gray-800/60 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider">O que você terá acesso:</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { icon: '📊', label: 'Dashboard GSC completo com análise de performance' },
              { icon: '📍', label: 'Gestão da Ficha no Google Maps' },
              { icon: '🏆', label: 'Rank Tracker por palavra-chave com mapa de calor' },
              { icon: '⭐', label: 'Gerenciamento e resposta de avaliações com IA' },
              { icon: '📣', label: 'Agendamento de postagens no Maps' },
              { icon: '🔍', label: 'Prospecção de clientes via Google Maps' },
              { icon: '🔵', label: 'Integração com Hostinger' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-xs text-gray-300 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-600">Logado como <span className="text-gray-400 font-semibold">{userEmail}</span></p>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-600 hover:text-rose-400 transition-colors font-bold underline underline-offset-2"
          >
            Sair e usar outro e-mail
          </button>
        </div>

      </div>
    </div>
  );
}
