-- ============================================================================
-- Migração: renomear os níveis de acesso 'suporte' → 'editor' e
-- 'editor_conteudo' → 'suporte'
-- ============================================================================
-- Até aqui o valor salvo no banco (`suporte`/`editor_conteudo`) não batia
-- com o nome exibido no painel — a Amanda tinha pedido só pra inverter o
-- RÓTULO na tela (ver histórico em `AccessLevel`, `src/context/AuthContext.tsx`),
-- mantendo o valor do banco como estava pra não mexer em RLS. Agora ela
-- pediu pra renomear de verdade, então o valor salvo passa a bater com o
-- que aparece na tela:
--   'suporte'         → 'editor'   (rótulo "Editor de Conteúdo")
--   'editor_conteudo' → 'suporte'  (rótulo "Suporte")
--
-- ⚠️ Essa migração SÓ funciona junto com o deploy do código novo
-- (src/context/AuthContext.tsx e as ~9 telas/mapas que comparam
-- `accessLevel === 'suporte'`/`'editor_conteudo'`) e o redeploy das Edge
-- Functions `invite-team-member` e `bunny-video-upload` — os três lados
-- (banco / front / Edge Functions) têm que mudar juntos, senão as
-- permissões ficam invertidas/quebradas até o resto ser atualizado.
--
-- De brinde, aproveitei pra corrigir 3 descompassos que existiam entre a
-- RLS e o que a tela já liberava (achados ao revisar essa troca):
--   - `can_manage_catalog`: faltava o nível que virou 'editor' — sem isso,
--     o botão de salvar Loja/Categoria aparecia liberado pra ele na tela,
--     mas o banco recusava a gravação.
--   - `can_delete_catalog`: só deixava master_admin excluir Loja/Categoria;
--     'editor' também deveria poder (é o `canDelete` de `AdminLojaForm.tsx`/
--     `AdminCategorias.tsx`).
--   - `stories_insert_team`/`stories_delete_master_admin`: a política
--     ainda liberava o antigo 'editor_conteudo' (agora 'suporte') pra subir
--     vídeo — ele nunca deveria ter essa permissão — e não liberava o
--     Convidado pra excluir vídeo, que a tela já permite.
-- ============================================================================

-- 1) Renomeia o valor salvo nas linhas existentes.
update public.team_members set access_level = 'editor' where access_level = 'suporte';
update public.team_members set access_level = 'suporte' where access_level = 'editor_conteudo';

-- 2) Atualiza a trava (CHECK) da coluna pra aceitar os novos nomes.
alter table public.team_members drop constraint if exists team_members_access_level_check;
alter table public.team_members
  add constraint team_members_access_level_check
  check (access_level in ('master_admin', 'editor', 'suporte', 'convidado'));

-- 3) Quem gerencia (cria/edita) Lojas e Categorias: master_admin + editor +
--    suporte (o 'suporte' novo cria/edita mas não exclui — ver função abaixo).
create or replace function public.can_manage_catalog(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.user_id = uid
      and tm.access_level in ('master_admin', 'editor', 'suporte')
  );
$$;

-- 4) Quem pode excluir de vez (irreversível) Lojas e Categorias:
--    master_admin + editor.
create or replace function public.can_delete_catalog(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.user_id = uid
      and tm.access_level in ('master_admin', 'editor')
  );
$$;

-- 5) Usuários (allowed_users): quem cadastra/edita é master_admin + editor
--    ('suporte' só visualiza, via policy de select que já libera qualquer
--    membro da equipe — não precisa mudar).
drop policy if exists "allowed_users_write_support" on public.allowed_users;
create policy "allowed_users_write_support"
  on public.allowed_users for insert
  to authenticated
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.access_level in ('master_admin', 'editor')
    )
  );

drop policy if exists "allowed_users_update_support" on public.allowed_users;
create policy "allowed_users_update_support"
  on public.allowed_users for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.access_level in ('master_admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.access_level in ('master_admin', 'editor')
    )
  );

-- 6) Stories: só master_admin + convidado sobem e excluem vídeo (o antigo
--    'editor_conteudo'/'suporte' nunca deveria ter tido essa permissão).
drop policy if exists "stories_insert_team" on public.stories;
create policy "stories_insert_team"
  on public.stories for insert
  to authenticated
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.access_level in ('master_admin', 'convidado')
    )
  );

drop policy if exists "stories_delete_master_admin" on public.stories;
create policy "stories_delete_master_admin"
  on public.stories for delete
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.access_level in ('master_admin', 'convidado')
    )
  );
