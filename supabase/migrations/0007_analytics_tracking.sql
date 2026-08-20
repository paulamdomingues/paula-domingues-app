-- ============================================================================
-- Migração: rastreamento de cliques em contato + buscas (base pra Relatórios)
-- ============================================================================
-- Confirmado com a Amanda (21/08/2026): 4 cards do Figma de Relatórios
-- ("Cliques em Contatos", "Top 5 Lojas", "Categorias mais buscadas",
-- "Termos de Busca mais pesquisados") dependem de um histórico de eventos
-- que não existe — ela pediu pra deixar a estrutura pronta "pra ir se
-- alimentando após o lançamento", em vez de inventar números agora.
--
-- Duas tabelas de log, propositalmente simples (append-only, sem update):
--   `store_contact_clicks` — 1 linha por clique em WhatsApp/Instagram de
--     uma loja (`StoreDetail`). Alimenta "Cliques em Contatos" e "Top 5
--     Lojas".
--   `search_queries` — 1 linha por busca feita em `Busca`. `category_id`
--     fica null quando o termo não bate com nenhuma categoria cadastrada —
--     nesse caso a linha ainda entra em "Termos de Busca mais
--     pesquisados", só não em "Categorias mais buscadas".
--
-- IMPORTANTE (não é responsabilidade desta migração, é só a base): as
-- páginas `StoreDetail` e `Busca` do app cliente ainda rodam em cima de
-- `mockData.ts` (não migraram pra Supabase ainda — tarefa separada, já
-- conhecida). Essas tabelas não vão receber nenhuma linha de verdade até
-- essas duas páginas passarem a usar `stores`/`categories` reais — o
-- `store_id` aqui é uma FK de verdade pra `stores.id`, não dá pra logar
-- cliques usando os ids fake do mock sem quebrar a integridade dos dados.
-- Os cards de Relatórios que dependem disso vão mostrar "sem dados ainda"
-- até lá, honestamente, em vez de número inventado.
-- ============================================================================

create table if not exists public.store_contact_clicks (
  id bigint generated always as identity primary key,
  store_id bigint not null references public.stores(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'instagram')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists store_contact_clicks_store_id_idx on public.store_contact_clicks (store_id);
create index if not exists store_contact_clicks_created_at_idx on public.store_contact_clicks (created_at);

alter table public.store_contact_clicks enable row level security;

-- Qualquer usuário logado do app cliente pode registrar o próprio clique
-- (não precisa ser membro de equipe) — mas só a própria linha (user_id
-- precisa bater com quem está autenticado).
create policy "store_contact_clicks_insert_own"
  on public.store_contact_clicks for insert
  to authenticated
  with check (user_id = auth.uid());

-- Só a equipe (painel admin) lê os cliques agregados — cliente comum não
-- enxerga estatística de ninguém.
create policy "store_contact_clicks_select_team"
  on public.store_contact_clicks for select
  to authenticated
  using (public.is_team_member(auth.uid()));


create table if not exists public.search_queries (
  id bigint generated always as identity primary key,
  term text not null,
  category_id bigint references public.categories(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists search_queries_category_id_idx on public.search_queries (category_id);
create index if not exists search_queries_created_at_idx on public.search_queries (created_at);

alter table public.search_queries enable row level security;

create policy "search_queries_insert_own"
  on public.search_queries for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "search_queries_select_team"
  on public.search_queries for select
  to authenticated
  using (public.is_team_member(auth.uid()));
