-- ============================================================================
-- Migração: tabela team_members + RLS (Row Level Security)
-- ============================================================================
-- Reflete as decisões confirmadas em conversa:
--   1) O Make (Integromat) escreve em `allowed_users` / cria usuários no Auth
--      usando a service_role key (chave secreta) — essa chave IGNORA o RLS
--      por padrão no Supabase. Então `allowed_users` não precisa (e não deve)
--      liberar nenhum acesso para os papéis `anon`/`authenticated`.
--   2) Quem é admin é definido pela nova tabela `team_members`, com níveis:
--      'master_admin', 'suporte', 'editor_conteudo', 'convidado'.
--
-- ⚠️ AINDA NÃO APLICADA no projeto real. Revisar e confirmar antes de rodar.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Tabela team_members (equipe interna / usuários do painel admin)
-- ----------------------------------------------------------------------------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  access_level text not null check (
    access_level in ('master_admin', 'suporte', 'editor_conteudo', 'convidado')
  ),
  created_at timestamptz not null default now()
);

create unique index if not exists team_members_user_id_key
  on public.team_members (user_id);


-- ----------------------------------------------------------------------------
-- 2. Funções auxiliares (security definer, pra evitar recursão nas policies
--    de team_members e permitir checar o papel do usuário logado em outras
--    tabelas sem expor a tabela inteira)
--
-- Papéis confirmados (ver conversa):
--   master_admin    → controle total e irrestrito: configurações globais,
--                      permissões de outros usuários, tudo do painel.
--   suporte         → atendimento/chamados/suporte operacional. NÃO tem as
--                      "chaves mestre" de configuração — ou seja, não edita
--                      catálogo (lojas/categorias) nem gerencia a equipe.
--   editor_conteudo → cadastro/edição de lojas, categorias, fotos
--                      (fachada/galeria). Pode "congelar" (é edição), mas
--                      excluir de vez é ação de master_admin.
--   convidado       → acesso bem restrito; a única função dele no painel é
--                      subir vídeos na área de Stories (tabela ainda não
--                      existe — ver nota na seção 5).
-- ----------------------------------------------------------------------------
create or replace function public.is_team_member(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members tm where tm.user_id = uid
  );
$$;

create or replace function public.is_master_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.user_id = uid and tm.access_level = 'master_admin'
  );
$$;

-- Quem pode cadastrar/editar lojas e categorias (inclui "congelar", que é
-- só um update no campo is_active): master_admin e editor_conteudo.
-- Suporte e Convidado ficam de fora — Suporte não mexe em catálogo, e
-- Convidado só tem a permissão de vídeos/stories (fora do escopo desta
-- tabela).
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
      and tm.access_level in ('master_admin', 'editor_conteudo')
  );
$$;

-- Excluir de vez (delete, diferente de congelar) é ação irreversível —
-- reservada só pro master_admin, que tem "controle total e irrestrito".
create or replace function public.can_delete_catalog(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_master_admin(uid);
$$;


-- ----------------------------------------------------------------------------
-- 3. RLS: team_members
-- ----------------------------------------------------------------------------
alter table public.team_members enable row level security;

-- qualquer membro da equipe pode ver a lista da equipe (tela "Configurações")
create policy "team_members_select_team"
  on public.team_members for select
  to authenticated
  using (public.is_team_member(auth.uid()));

-- só master_admin pode adicionar/editar/remover membros da equipe
create policy "team_members_insert_master_admin"
  on public.team_members for insert
  to authenticated
  with check (public.is_master_admin(auth.uid()));

create policy "team_members_update_master_admin"
  on public.team_members for update
  to authenticated
  using (public.is_master_admin(auth.uid()))
  with check (public.is_master_admin(auth.uid()));

create policy "team_members_delete_master_admin"
  on public.team_members for delete
  to authenticated
  using (public.is_master_admin(auth.uid()));


-- ----------------------------------------------------------------------------
-- 4. RLS: categories
-- ----------------------------------------------------------------------------
alter table public.categories enable row level security;

-- leitura liberada pra qualquer usuário logado (o app cliente já é
-- protegido por login; quem cria a conta só existe via Hubla → Make)
create policy "categories_select_authenticated"
  on public.categories for select
  to authenticated
  using (true);

create policy "categories_write_team"
  on public.categories for insert
  to authenticated
  with check (public.can_manage_catalog(auth.uid()));

create policy "categories_update_team"
  on public.categories for update
  to authenticated
  using (public.can_manage_catalog(auth.uid()))
  with check (public.can_manage_catalog(auth.uid()));

-- excluir de vez é diferente de congelar (is_active = false) — só master_admin
create policy "categories_delete_master_admin"
  on public.categories for delete
  to authenticated
  using (public.can_delete_catalog(auth.uid()));


-- ----------------------------------------------------------------------------
-- 5. RLS: stores
-- ----------------------------------------------------------------------------
-- Coluna nova pra suportar "congelar" loja sem apagar (soft toggle, diferente
-- de excluir de vez — confirmado). Assumindo o toggle "Status ativo/inativo"
-- já visto no design do admin. Se preferir outro nome/coluna já existente,
-- é só avisar.
alter table public.stores
  add column if not exists is_active boolean not null default true;

alter table public.stores enable row level security;

create policy "stores_select_authenticated"
  on public.stores for select
  to authenticated
  using (true);

create policy "stores_write_team"
  on public.stores for insert
  to authenticated
  with check (public.can_manage_catalog(auth.uid()));

-- "congelar" é só isso: um update no is_active. Cabe no mesmo can_manage_catalog.
create policy "stores_update_team"
  on public.stores for update
  to authenticated
  using (public.can_manage_catalog(auth.uid()))
  with check (public.can_manage_catalog(auth.uid()));

-- excluir de vez é diferente de congelar — só master_admin
create policy "stores_delete_master_admin"
  on public.stores for delete
  to authenticated
  using (public.can_delete_catalog(auth.uid()));

-- Nota sobre o Convidado: a única função dele no painel é subir vídeos na
-- área de Stories. Não existe tabela de vídeos/stories no Supabase ainda
-- (não faz parte do schema atual) — quando essa área for construída, dá pra
-- adicionar uma policy de insert liberada só pra convidado (e pros outros
-- níveis) nessa tabela nova, sem tocar nas policies de stores/categories
-- acima (que continuam fechadas pra ele).


-- ----------------------------------------------------------------------------
-- 6. RLS: favorites (cada usuário só vê/mexe nos próprios favoritos)
-- ----------------------------------------------------------------------------
alter table public.favorites enable row level security;

create policy "favorites_select_own"
  on public.favorites for select
  to authenticated
  using (user_id = auth.uid());

create policy "favorites_insert_own"
  on public.favorites for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "favorites_delete_own"
  on public.favorites for delete
  to authenticated
  using (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 7. RLS: allowed_users — bloqueado por completo para anon/authenticated.
--    Só a service_role (usada pelo Make) enxerga essa tabela; o RLS nem
--    entra na jogada pra service_role, então NENHUMA policy é necessária
--    aqui — só habilitar o RLS já fecha o acesso via chave pública.
-- ----------------------------------------------------------------------------
alter table public.allowed_users enable row level security;
-- (propositalmente sem nenhuma policy de select/insert/update/delete)
