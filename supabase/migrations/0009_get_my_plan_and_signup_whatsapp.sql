-- ============================================================================
-- Migração: função `get_my_plan()` (Meu Plano no Perfil) + upsert de
-- WhatsApp no cadastro (`record_signup_whatsapp`)
-- ============================================================================
-- 1) `get_my_plan()`: mesmo padrão de `has_active_access()` (SECURITY
--    DEFINER, casa por email em minúsculo) — deixa a cliente logada ler o
--    PRÓPRIO plano (`allowed_users.plan`) sem abrir a tabela inteira via
--    RLS (que hoje só libera leitura pra `team_members`). Usado em
--    `Perfil.tsx` pra expor "Meu Plano - Trimestral/Anual" de verdade em
--    vez do texto fixo que existia antes (22/08/2026).
--
-- 2) `record_signup_whatsapp(...)`: quem cria conta agora informa um
--    WhatsApp na tela de cadastro (`SignUp.tsx`, 22/08/2026, pedido da
--    Amanda). Esse dado precisa ir pro MESMO lugar que a Hubla usaria
--    (`allowed_users.whatsapp`, ancorado por email) — mas o insert/update
--    direto nessa tabela é restrito a `team_members` (migração 0005/0008),
--    e no momento do cadastro a pessoa AINDA NÃO tem sessão (Supabase exige
--    confirmar o email antes de logar), então nem daria pra usar
--    `auth.email()`/RLS normal aqui. Por isso essa função recebe o email
--    como parâmetro (não usa `auth.email()`) e roda sem exigir sessão — é
--    chamada por uma Edge Function pública logo depois do cadastro.
--    `coalesce` garante que isso nunca sobrescreve um WhatsApp que a Hubla
--    já tenha gravado antes (Amanda: "o da Hubla pode substituir se for o
--    caso" — ou seja, a Hubla sempre tem prioridade, não o cadastro).
-- ============================================================================

create or replace function public.get_my_plan()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select plan from public.allowed_users
  where lower(email) = lower(auth.email())
  limit 1;
$$;

create or replace function public.record_signup_whatsapp(p_email text, p_whatsapp text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.allowed_users (email, whatsapp)
  values (lower(p_email), p_whatsapp)
  on conflict (email) do update
    set whatsapp = coalesce(public.allowed_users.whatsapp, excluded.whatsapp);
$$;
