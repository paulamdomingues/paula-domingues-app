-- ============================================================================
-- Migração: `stores.category_id` passa a ON DELETE SET NULL
-- ============================================================================
-- A tela de Categorias (painel admin) permite excluir uma categoria de vez.
-- A constraint original não tinha regra de delete (NO ACTION) — ou seja,
-- excluir uma categoria com lojas vinculadas ia falhar com erro de FK.
-- Como `stores.category_id` já é nullable, faz sentido a loja simplesmente
-- ficar "sem categoria" (visível de novo pro admin reatribuir) em vez de
-- travar a exclusão ou apagar a loja junto (isso sim seria destrutivo
-- demais pra uma ação em cascata implícita).
-- ============================================================================

alter table public.stores
  drop constraint stores_category_id_fkey,
  add constraint stores_category_id_fkey
    foreign key (category_id) references public.categories(id) on delete set null;
