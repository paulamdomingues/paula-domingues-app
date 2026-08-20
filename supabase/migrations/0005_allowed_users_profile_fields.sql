-- ============================================================================
-- Migração: campos de perfil/Hubla em `allowed_users` + RLS pro painel admin
-- ============================================================================
-- Confirmado com a Amanda (21/08/2026): o Make vai manipular o payload do
-- webhook da Hubla e gravar aqui (nome, whatsapp, plano, dados da transação)
-- — ainda não está configurado do lado do Make, mas o contrato de campos já
-- fica pronto pra receber. Estendi `allowed_users` (em vez de criar uma
-- tabela `profiles` nova) porque é a tabela que já é escrita pelo Make NO
-- MOMENTO DA COMPRA — antes de a pessoa necessariamente ter criado a conta
-- de login (`auth.users`) no app. Uma tabela `profiles` amarrada por
-- `user_id` não daria pra popular nesse momento; `allowed_users` já é
-- ancorada por email, que é o único dado garantido na hora do webhook.
--
-- `allowed_users` era só enxergada pela service_role (RLS sem nenhuma
-- policy) — agora a tela de Usuários do painel precisa ler/editar isso, daí
-- as duas policies novas pra `team_members`. Segui a descrição de papéis já
-- documentada na migration 0001: Suporte é "atendimento/chamados/suporte
-- operacional" — a área de Usuários é exatamente isso, então ele entra
-- junto com o master_admin no insert/update. Editor de Conteúdo fica de
-- fora (o escopo dele é catálogo: lojas/categorias/fotos), e não incluí
-- delete porque o Figma não desenhou nenhuma exclusão de usuário.
-- ============================================================================

alter table public.allowed_users
  add column if not exists full_name text,
  add column if not exists whatsapp text,
  add column if not exists plan text check (plan is null or plan in ('trimestral', 'anual')),
  add column if not exists hubla_transaction_id text,
  add column if not exists hubla_payment_method text,
  add column if not exists hubla_amount_cents integer;

create policy "allowed_users_select_team"
  on public.allowed_users for select
  to authenticated
  using (public.is_team_member(auth.uid()));

create policy "allowed_users_write_support"
  on public.allowed_users for insert
  to authenticated
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.access_level in ('master_admin', 'suporte')
    )
  );

create policy "allowed_users_update_support"
  on public.allowed_users for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.access_level in ('master_admin', 'suporte')
    )
  )
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.access_level in ('master_admin', 'suporte')
    )
  );
