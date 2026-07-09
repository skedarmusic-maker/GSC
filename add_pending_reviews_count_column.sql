-- Adiciona a coluna pending_reviews_count para cachear a contagem de avaliações sem resposta
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pending_reviews_count INTEGER DEFAULT 0;
