-- ============================================================================
-- Migração: email/whatsapp em `team_members` + auto-edição do próprio perfil
-- ============================================================================
-- A tela de Configurações (Figma node 627:10103) precisa listar Nome/Email/
-- WhatsApp/Função de cada membro da equipe na tabela "Equipe" — mas
-- `auth.users` não é enxergado pelo client via PostgREST, então (mesma
-- solução já usada em `allowed_users`) guardamos uma cópia de `email` aqui
-- em `team_members`. Populada no convite (ver Edge Function
-- `invite-team-member`) e, pra quem já existia, feita via backfill abaixo
-- puxando de `auth.users` (a migração roda com privilégio suficiente pra ler
-- esse schema).
--
-- `whatsapp` é novo — não existia antes, e o card "Meu Perfil" do Figma
-- pede esse campo pra cada membro.
--
-- RLS: até aqui só master_admin podia dar update em `team_members` — mas o
-- card "Meu Perfil" da própria Configurações precisa deixar QUALQUER membro
-- editar o próprio nome/whatsapp. Adiciono uma policy de auto-edição
-- (`user_id = auth.uid()`) e um trigger que bloqueia, pra quem não é
-- master_admin, mudar o próprio `access_level`/`user_id`/`email` nesse
-- caminho — sem isso, um `convidado` poderia se autopromover a
-- `master_admin` só chamando update na própria linha.
-- ============================================================================

alter table public.team_members
  add column if not exists email text,
  add column if not exists whatsapp text;

update public.team_members tm
set email = u.email
from auth.users u
where u.id = tm.user_id
  and tm.email is null;

alter table public.team_members
  alter column email set not null;

create unique index if not exists team_members_email_key
  on public.team_members (email);

create policy "team_members_update_self"
  on public.team_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.enforce_team_member_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_master_admin(auth.uid()) then
    if new.access_level is distinct from old.access_level
      or new.user_id is distinct from old.user_id
      or new.email is distinct from old.email
    then
      raise exception 'Você só pode editar seu nome e WhatsApp.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists team_members_self_update_guard on public.team_members;
create trigger team_members_self_update_guard
  before update on public.team_members
  for each row
  execute function public.enforce_team_member_self_update();
