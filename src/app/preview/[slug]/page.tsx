'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PreviewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [layoutHtml, setLayoutHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        // Busca a oportunidade com base na palavra-chave que gere o mesmo slug
        const { data: opps, error: fetchError } = await supabase
          .from('oportunidades_seo')
          .select('*');

        if (fetchError) throw fetchError;

        // Encontra a oportunidade cujo slug combine
        const matchedOpp = opps?.find(o => {
          const s = o.keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return s === slug;
        });

        if (!matchedOpp || !matchedOpp.layout_draft) {
          setError('Nenhum rascunho de layout encontrado para este preview.');
          return;
        }

        // Limpa o miolo do return se for código TSX/Next.js
        const bodyContent = matchedOpp.layout_draft.match(/return \(([\s\S]*)\);/)?.[1] || matchedOpp.layout_draft;
        setLayoutHtml(bodyContent);
      } catch (err: any) {
        console.error(err);
        setError('Erro ao carregar o preview: ' + err.message);
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
        <p className="text-gray-400 text-sm">Carregando visualização do layout do Stitch...</p>
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
