-- Tabela para armazenar histórico de métricas do Google Business Profile
CREATE TABLE IF NOT EXISTS public.gbp_metrics_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id text NOT NULL,
  date date NOT NULL, -- A data de referência (ex: primeiro dia do mês para MONTHLY)
  period_type text DEFAULT 'MONTHLY', -- Pode ser MONTHLY ou DAILY
  calls integer DEFAULT 0, -- Chamadas recebidas
  directions integer DEFAULT 0, -- Rotas solicitadas
  website_clicks integer DEFAULT 0, -- Cliques para o site
  views_maps integer DEFAULT 0, -- Visualizações no Maps
  views_search integer DEFAULT 0, -- Visualizações na Pesquisa
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(location_id, date, period_type) -- Impede duplicidade do mesmo mês/dia para a mesma localização
);

ALTER TABLE public.gbp_metrics_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access to gbp_metrics_history" ON public.gbp_metrics_history FOR ALL USING (true);
