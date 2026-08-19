-- ============================================================================
-- Migração: colunas que faltavam em `stores` pro formulário de Cadastro/Edição
-- de Loja (painel admin) — Tags (SEO), WhatsApp e Instagram apareciam no
-- Figma mas não existiam na tabela ainda.
--
-- ✅ JÁ APLICADA no projeto real (via mcp__Supabase__apply_migration,
-- 21/08/2026) — este arquivo é só o registro pra versionamento, igual fizemos
-- com 0001.
-- ============================================================================

alter table public.stores
  add column if not exists tags text[] not null default '{}',
  add column if not exists whatsapp text,
  add column if not exists instagram text;
