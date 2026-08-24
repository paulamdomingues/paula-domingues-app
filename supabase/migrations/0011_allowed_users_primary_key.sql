-- 24/08/2026: `allowed_users` foi criada sem PRIMARY KEY (só tinha UNIQUE em
-- email/short_id). A coluna `id` já é identity column (auto-incrementa
-- sozinha), só faltava a PRIMARY KEY em cima dela. Sem PK, o Table Editor
-- do Supabase Studio não consegue identificar uma linha de forma única pra
-- fazer UPDATE/DELETE, daí o erro "Unable to update row as table has no
-- primary keys". Não altera nenhum dado existente.
alter table public.allowed_users
  add primary key (id);
