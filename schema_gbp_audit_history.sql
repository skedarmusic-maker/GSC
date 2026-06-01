-- Tabela para armazenar histórico de auditorias de saúde do Google Business Profile
CREATE TABLE IF NOT EXISTS public.gbp_audit_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id text NOT NULL,
  date date NOT NULL, -- Data da auditoria (YYYY-MM-DD)
  score integer NOT NULL,
  grade text NOT NULL,
  color text NOT NULL,
  checklist jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(location_id, date) -- Impede duplicidade de auditoria na mesma data para o mesmo local
);

ALTER TABLE public.gbp_audit_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access to gbp_audit_history" ON public.gbp_audit_history FOR ALL USING (true);
