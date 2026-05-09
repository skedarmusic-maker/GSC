-- 1. Tabela de Clientes (Carteira Focus Arts)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, -- Ex: "Serralheria Alvorada"
  gsc_url text, -- Ex: "sc-domain:serralheriaalvorada.com.br"
  gbp_account_id text, -- ID da Conta Google Meu Negócio
  gbp_location_id text, -- ID da Localização no Google Maps
  website_url text, -- URL pública para referência
  cms_type text DEFAULT 'nextjs', -- stack tecnológica do site para facilitar no deploy do n8n
  business_context text, -- Resumo da identidade, tom de voz e diferenciais (o "suco" do NotebookLM)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Oportunidades SEO (Motor Analítico)
CREATE TABLE IF NOT EXISTS public.oportunidades_seo (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  keyword text NOT NULL, -- A palavra-chave identificada com Baixo CTR
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  ctr numeric(5,2) DEFAULT 0,
  position numeric(5,2) DEFAULT 0,
  status text DEFAULT 'pendente', -- Opções: pendente, aprovada, rejeitada, processando, publicada
  content_draft text, -- Rascunho da página/artigo gerado pela IA (Gemini)
  published_url text, -- O link da página depois que o n8n fizer o deploy
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Postagens Agendadas (GBP)
-- Obs: Adicionando 'client_id' para linkar com a nova tabela base, mantendo compatibilidade com a versão anterior.
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id text NOT NULL, 
  content text NOT NULL, 
  image_url text, -- Link de imagem hospedada no Supabase Storage (se houver)
  call_to_action_type text DEFAULT 'LEARN_MORE', -- NONE, BOOK, ORDER, SHOP, LEARN_MORE, CALL
  call_to_action_url text,
  status text DEFAULT 'pending', -- pending, published, failed
  scheduled_for timestamp with time zone NOT NULL, -- Quando o n8n/sistema deve postar
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de Segurança (Row Level Security)
-- Permitimos acesso total (CRUD) para que o Dashboard e o n8n consigam operar via API anon key + RLS public policy (MVP).
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidades_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable full access to clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Enable full access to oportunidades" ON public.oportunidades_seo FOR ALL USING (true);
CREATE POLICY "Enable full access to scheduled_posts" ON public.scheduled_posts FOR ALL USING (true);

-- 4. Tabela de Base de Conhecimento (Fontes de verdade para a IA)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL, -- Ex: "Manual de Instalação de Portões"
  content text NOT NULL, -- O texto bruto para servir de fonte
  source_type text DEFAULT 'text', -- text, pdf_parsed, website_crawl
  category text DEFAULT 'general', -- technical, sales, faq, values
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access to knowledge_base" ON public.knowledge_base FOR ALL USING (true);
