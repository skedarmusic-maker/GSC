-- 1. Tabela de Palavras-Chave Monitoradas
create table if not exists public.tracked_keywords (
  id uuid default gen_random_uuid() primary key,
  location_id text not null, -- ID do local no Google Maps
  business_name text not null, -- Nome do seu negócio para procurarmos na lista
  keyword text not null, -- Ex: "estética automotiva floripa"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Histórico de Posições (Rankings)
create table if not exists public.rank_history (
  id uuid default gen_random_uuid() primary key,
  keyword_id uuid references public.tracked_keywords(id) on delete cascade not null,
  position integer not null, -- 1º, 2º, 3º... (Se não aparecer no top 20, salvamos como 99 ou 0)
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS (Row Level Security) para segurança (Opcional, mas recomendado)
alter table public.tracked_keywords enable row level security;
alter table public.rank_history enable row level security;

-- Criar políticas de acesso público (para facilitar no nosso worker)
create policy "Enable all for all users" on public.tracked_keywords for all using (true);
create policy "Enable all for all users" on public.rank_history for all using (true);
