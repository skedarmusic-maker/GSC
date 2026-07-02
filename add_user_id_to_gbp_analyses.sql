-- Script para rodar no painel SQL do Supabase (SQL Editor)
-- Adiciona a coluna user_id na tabela gbp_analyses para separar as análises salvas por usuário (Multi-tenancy).

-- 1. Adicionar coluna user_id com chave estrangeira apontando para auth.users
ALTER TABLE public.gbp_analyses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. (Opcional) Associar todos os registros de análises existentes ao seu usuário administrador principal, para que não sumam da sua conta:
-- IMPORTANTE: Substitua 'COLE_AQUI_O_UUID_DO_SEU_USUARIO' pelo seu ID de usuário do Supabase (encontrado em Authentication -> Users)
-- UPDATE public.gbp_analyses SET user_id = 'COLE_AQUI_O_UUID_DO_SEU_USUARIO' WHERE user_id IS NULL;
