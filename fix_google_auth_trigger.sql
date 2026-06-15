-- Script para rodar no painel SQL do Supabase (SQL Editor)
-- Atualiza a função trigger de novos usuários (geralmente disparada após inserção em auth.users)
-- para definir os novos cadastros como pendentes e com 0 créditos na tabela user_credits.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, monthly_allowance, purchased_credits, subscription_status, seo_allowed)
  VALUES (new.id, 0, 0, 'pending', false)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-garante que o trigger está atrelado corretamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
