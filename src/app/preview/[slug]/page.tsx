'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Mapa de substituição de ícones do Lucide para SVGs nativos super limpos
const iconSvgMap: { [key: string]: string } = {
  Phone: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  MapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  Clock: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  ArrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  Shield: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1Z"/></svg>`,
  Check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`,
  Menu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
  X: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
};

export default function PreviewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [layoutHtml, setLayoutHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const { data: opps, error: fetchError } = await supabase
          .from('oportunidades_seo')
          .select('*');

        if (fetchError) throw fetchError;

        const matchedOpp = opps?.find(o => {
          const s = o.keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return s === slug;
        });

        if (!matchedOpp || !matchedOpp.layout_draft) {
          setError('Nenhum rascunho de layout encontrado para este preview.');
          return;
        }

        let rawCode = matchedOpp.layout_draft;

        // 1. Extrair cirurgicamente apenas o bloco de conteúdo interno do return principal
        const returnMatch = rawCode.match(/return \(([\s\S]*)\);/);
        let cleanHtml = returnMatch ? returnMatch[1] : rawCode;

        // Se por acaso o match falhar por não ter parênteses no return, tenta extrair pelo return {}
        if (!returnMatch) {
          const curlyMatch = rawCode.match(/return \{([\s\S]*)\};/);
          if (curlyMatch) cleanHtml = curlyMatch[1];
        }

        // 2. COMPILADOR INTELIGENTE DE TSX PARA HTML ESTÁTICO:
        
        // A. Remover todos os comentários multilistas e de React {/* ... */}
        cleanHtml = cleanHtml.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
        // Remover comentários JavaScript tradicionais que vazam no HTML
        cleanHtml = cleanHtml.replace(/\/\*[\s\S]*?\*\//g, '');

        // B. Traduzir expressões JavaScript comuns
        cleanHtml = cleanHtml.replace(/\{new Date\(\)\.getFullYear\(\)\}/g, new Date().getFullYear().toString());
        cleanHtml = cleanHtml.replace(/\{new Date\(\)\.getFullYear\(\)\s*-\s*1\}/g, (new Date().getFullYear() - 1).toString());
        
        // C. Traduzir variáveis e chaves dinâmicas do React
        cleanHtml = cleanHtml.replace(/\{selectedClient\?\.name\}/g, matchedOpp.clients?.name || 'Cliente');
        cleanHtml = cleanHtml.replace(/\{opp\?\.keyword\}/g, matchedOpp.keyword || '');
        cleanHtml = cleanHtml.replace(/\{opp\?\.keyword\?\.charAt\(0\)\?\.toUpperCase\(\)\s*\+\s*opp\?\.keyword\?\.slice\(1\)\}/g, matchedOpp.keyword ? matchedOpp.keyword.charAt(0).toUpperCase() + matchedOpp.keyword.slice(1) : '');

        // D. Traduzir classes e atributos do React para HTML
        cleanHtml = cleanHtml.replace(/\bclassName=/g, 'class=');
        cleanHtml = cleanHtml.replace(/\bhtmlFor=/g, 'for=');
        
        // E. Remover manipuladores de eventos do React (onClick, onSubmit, etc.) que quebram o HTML
        cleanHtml = cleanHtml.replace(/\bonClick=\{[\s\S]*?\}/g, '');
        cleanHtml = cleanHtml.replace(/\bonSubmit=\{[\s\S]*?\}/g, '');

        // F. Compilador de Ícones: Traduzir tags Lucide auto-fechadas (como <Phone className="..." />) para SVGs
        Object.keys(iconSvgMap).forEach(iconName => {
          const svgString = iconSvgMap[iconName];
          // Procura tags auto-fechadas: <IconName className="..." />
          const regexStr = `<${iconName}\\s+className="([^"]*)"\\s*\\/>`;
          const regex = new RegExp(regexStr, 'gi');
          
          cleanHtml = cleanHtml.replace(regex, (match, classes) => {
            // Injeta o SVG substituindo o class padrão pelo class contido no componente
            return svgString.replace('class="lucide', `class="${classes} lucide`);
          });
        });

        // Caso haja chaves de estilo inline {style={{...}}}
        cleanHtml = cleanHtml.replace(/style=\{\{\s*([\s\S]*?)\s*\}\}/g, (match, styleBody) => {
          // Converte estilo camelCase para Kebab-case
          const styleCss = styleBody
            .replace(/([A-Z])/g, '-$1').toLowerCase()
            .replace(/["']/g, '')
            .replace(/,/g, ';');
          return `style="${styleCss}"`;
        });

        setLayoutHtml(cleanHtml);
      } catch (err: any) {
        console.error(err);
        setError('Erro ao compilar o preview do Stitch: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchPreview();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center gap-4 font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00ff9d]"></div>
        <p className="text-gray-400 text-sm">Gerando visualização em alta fidelidade do Stitch...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center gap-2 font-sans px-4 text-center">
        <span className="text-4xl">⚠️</span>
        <h1 className="text-lg font-bold text-red-500 mt-2">Falha no Preview</h1>
        <p className="text-gray-400 text-sm max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <script src="https://cdn.tailwindcss.com" async></script>
      <div 
        className="min-h-screen w-full bg-black text-white font-sans antialiased"
        dangerouslySetInnerHTML={{ __html: layoutHtml || '' }} 
      />
    </>
  );
}
