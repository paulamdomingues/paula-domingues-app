-- 24/08/2026: o trigger `on_auth_user_created_ensure_allowed_users` roda
-- pra QUALQUER inserção em auth.users, sem distinguir "cliente se
-- cadastrando sozinho no app" (o caso que ele foi feito pra cobrir, ver
-- rota /aguardando-liberacao) de "convite de membro de equipe" (Edge
-- Function invite-team-member). Resultado: convidar alguém pro painel
-- admin também criava uma linha fantasma em allowed_users (a Amanda viu
-- isso ao testar — "Fernanda" apareceu em Usuários sem nunca ter comprado
-- nada).
--
-- Fix: a Edge Function agora manda um metadata `source: 'team_invite'`
-- junto do convite; esse trigger passa a pular a criação da linha em
-- allowed_users quando esse marcador estiver presente. Cadastro normal de
-- cliente (SignUp.tsx) não manda esse campo, então continua funcionando
-- como antes.
create or replace function public.handle_new_user_ensure_allowed_users()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  if new.raw_user_meta_data->>'source' = 'team_invite' then
    return new;
  end if;

  insert into public.allowed_users (email, full_name, is_active)
  values (new.email, new.raw_user_meta_data->>'first_name', false)
  on conflict (email) do nothing;
  return new;
end;
$function$;
