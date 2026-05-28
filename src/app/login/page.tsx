'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, ArrowRight, UserPlus, LogIn, ChevronRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        // Fluxo de Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage({ text: 'Login efetuado com sucesso! Redirecionando...', type: 'success' });
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } else {
        // Fluxo de Cadastro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) throw error;

        // Se o usuário foi cadastrado, inicializamos os créditos grátis dele na tabela user_credits
        if (data.user) {
          // Criar registro de cota gratuita no user_credits
          await supabase.from('user_credits').insert([
            {
              user_id: data.user.id,
              monthly_allowance: 150,
              purchased_credits: 0,
            }
          ]).select();
        }

        setMessage({ 
          text: 'Cadastro efetuado! Verifique seu e-mail para confirmação (ou faça login diretamente).', 
          type: 'success' 
        });
        
        // Alternar para tela de login após cadastro
        setTimeout(() => {
          setIsLogin(true);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      setMessage({ 
        text: error.message || 'Ocorreu um erro ao processar a autenticação.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro no login do Google:', error);
      setMessage({ text: error.message || 'Falha ao conectar via Google.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Elementos visuais de fundo em degradê */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#00ff9d]/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[480px] z-10">
        
        {/* Logo superior */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161b22] border border-gray-800 text-xs font-bold text-gray-400 mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-[#00ff9d]" />
            <span>GSC Strategy Engine v2.0 SaaS</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            GSC<span className="text-[#00ff9d]">Strategy</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {isLogin 
              ? 'Simplificando SEO e posicionamento local para o seu negócio.' 
              : 'Junte-se a centenas de agências e profissionais de SEO.'}
          </p>
        </div>

        {/* Card do formulário com efeito Glassmorphism */}
        <div className="bg-[#161b22]/70 backdrop-blur-md rounded-2xl border border-gray-800/80 p-8 shadow-2xl transition-all duration-300">
          
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 border ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${message.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block tracking-wide uppercase">Nome Completo</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome ou agência"
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-[#00ff9d]/50 focus:ring-1 focus:ring-[#00ff9d]/30 text-sm text-white placeholder-gray-600 rounded-xl px-4 py-3.5 transition-all duration-200 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 block tracking-wide uppercase">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-[#0d1117] border border-gray-800 focus:border-[#00ff9d]/50 focus:ring-1 focus:ring-[#00ff9d]/30 text-sm text-white placeholder-gray-600 rounded-xl pl-12 pr-4 py-3.5 transition-all duration-200 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 tracking-wide uppercase">Senha</label>
                {isLogin && (
                  <a href="#" className="text-[11px] font-bold text-[#00ff9d] hover:underline">Esqueceu a senha?</a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0d1117] border border-gray-800 focus:border-[#00ff9d]/50 focus:ring-1 focus:ring-[#00ff9d]/30 text-sm text-white placeholder-gray-600 rounded-xl pl-12 pr-4 py-3.5 transition-all duration-200 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#00ff9d] hover:bg-[#00e08b] disabled:opacity-50 text-gray-900 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-[#00ff9d]/10 mt-6 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Entrar no GSC' : 'Cadastrar Minha Conta'}</span>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>

          {/* Divisor Visual */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800/80"></div>
            </div>
            <span className="relative px-3 bg-[#161b22] text-[10px] font-bold text-gray-500 tracking-wider uppercase">ou continuar com</span>
          </div>

          {/* Botão de Autenticação Social Google */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full py-3.5 bg-[#0d1117] hover:bg-[#0d1117]/80 border border-gray-800 hover:border-gray-700 text-gray-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google Account</span>
          </button>
        </div>

        {/* Rodapé Alternador de Modos */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1 mx-auto group"
          >
            <span>{isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}</span>
            <span className="text-[#00ff9d] group-hover:underline flex items-center">
              {isLogin ? 'Cadastre-se' : 'Faça login'}
              <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
