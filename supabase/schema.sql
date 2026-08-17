-- Schema inicial para o app Paula Domingues
-- Rode este arquivo no SQL editor do seu projeto Supabase (https://app.supabase.com)

-- 1. Perfis de usuário (estende a tabela auth.users do Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuários podem ver o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Cria automaticamente uma linha em profiles quando um novo usuário se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'first_name', ''), new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Categorias
create table if not exists public.categories (
  id text primary key,
  label text not null,
  image_url text,
  sort_order int not null default 0
);

alter table public.categories enable row level security;

create policy "Categorias são públicas para leitura"
  on public.categories for select
  using (true);

-- 3. Lojas parceiras
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category_id text references public.categories (id),
  cover_image_url text,
  description text,
  whatsapp_url text,
  created_at timestamptz not null default now()
);

alter table public.stores enable row level security;

create policy "Lojas são públicas para leitura"
  on public.stores for select
  using (true);

-- 4. Produtos (opcional, para a tela de detalhe do produto)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores (id) on delete cascade,
  name text not null,
  price numeric(10, 2),
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Produtos são públicos para leitura"
  on public.products for select
  using (true);

-- 5. Favoritos do usuário
create table if not exists public.favorites (
  user_id uuid references auth.users (id) on delete cascade,
  store_id uuid references public.stores (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

alter table public.favorites enable row level security;

create policy "Usuários gerenciam apenas os próprios favoritos"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
