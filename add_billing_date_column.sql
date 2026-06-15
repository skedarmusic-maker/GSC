-- Script para rodar no painel SQL do Supabase (SQL Editor)
-- Adiciona a coluna next_billing_date na tabela user_credits para controle de vencimento das assinaturas.

ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS next_billing_date timestamp with time zone;
