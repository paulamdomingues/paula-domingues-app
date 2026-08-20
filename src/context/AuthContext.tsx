import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

/**
 * Os 4 níveis de acesso do painel admin (tabela `team_members`, migração
 * `0001_team_members_and_rls.sql`). Quem não está nessa tabela (todo cliente
 * final) tem `accessLevel === null` — é a mesma sessão do Supabase Auth,
 * só que sem nenhum papel de equipe.
 *
 * 21/08/2026: os valores do banco foram RENOMEADOS de verdade (antes o
 * código tinha um "truque" de rótulo invertido — `suporte` no banco
 * aparecendo como "Editor" na tela, e vice-versa — pra evitar mexer em
 * schema/RLS; a Amanda pediu pra trocar isso pelo nome de verdade).
 * Agora o valor salvo bate com o que aparece na tela:
 * - `master_admin` → Master Admin. Acesso total.
 * - `editor` → aparece como **"Editor de Conteúdo"** no painel → CRUD
 *   completo em Lojas, Categorias e Usuários; vê Resumo e Relatórios.
 * - `suporte` → aparece como **"Suporte"** no painel → cria/edita Lojas e
 *   Categorias (sem excluir) + só visualiza Usuários (sem editar); não vê
 *   Resumo/Relatórios/Stories.
 * - `convidado` → só Stories (sobe e exclui vídeo).
 * Os rótulos ficam em `ACCESS_LEVEL_LABELS`, repetido em três telas
 * (`AdminSidebar.tsx`, `AdminConfiguracoes.tsx`, `NovoMembroModal.tsx`) —
 * hoje é só uma questão de formatação (ex: "Editor de Conteúdo" em vez de
 * "editor"), não uma inversão de significado como antes.
 */
export type AccessLevel = 'master_admin' | 'editor' | 'suporte' | 'convidado';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  /**
   * Primeiro nome de quem está logado (vem de `user_metadata.first_name`,
   * preenchido no cadastro — ver `signUp` abaixo). Centralizado aqui pra
   * `Header`/`TopBar` mostrarem sempre o nome real em toda tela — antes só
   * a página Perfil calculava isso, o resto mostrava "Amanda" fixo no
   * código, mesmo logada com outra conta (Amanda, 20/08/2026).
   */
  firstName: string;
  /**
   * Papel da pessoa logada dentro da equipe do painel admin (`null` se a
   * sessão atual não pertence a nenhum membro de equipe — ex: cliente final
   * do app). Ver `ProtectedAdminRoute` (21/08/2026) para o gate que usa isso.
   */
  accessLevel: AccessLevel | null;
  /** `true` enquanto a checagem de `team_members` ainda não terminou. */
  accessLevelLoading: boolean;
  /**
   * `true` = a pessoa logada está em `allowed_users` com `is_active = true`
   * (comprou via Hubla e a assinatura está ativa, ou foi liberada
   * manualmente pelo admin). `false` = criou conta mas ainda não tem acesso
   * liberado (nunca pagou, ou teve a assinatura cancelada/reembolsada).
   * `null` enquanto a checagem ainda não rodou. Ver `ProtectedRoute`
   * (20/08/2026) — quem é da equipe (`accessLevel !== null`) sempre tem
   * acesso ao app cliente também, mesmo sem estar em `allowed_users`.
   */
  hasPurchaseAccess: boolean | null;
  /** `true` enquanto a checagem de `has_active_access()` ainda não terminou. */
  purchaseAccessLoading: boolean;
  /** Roda a checagem de novo sob demanda (usado pelo botão "Verificar
   * novamente" da tela de espera, sem precisar recarregar a página). */
  refreshPurchaseAccess: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    firstName: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);
  const [accessLevelLoading, setAccessLevelLoading] = useState(true);
  const firstName = (session?.user.user_metadata?.first_name as string | undefined) ?? 'Amanda';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Checa se a pessoa logada é membro de equipe (painel admin) toda vez que
  // a sessão muda. Roda pra QUALQUER sessão (cliente final incluído) — pra
  // um cliente comum, a query simplesmente não acha linha nenhuma em
  // `team_members` (RLS permite cada membro ver só a própria equipe, mas a
  // busca "sou eu mesmo" sempre é permitida) e `accessLevel` fica `null`,
  // que é o estado esperado.
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setAccessLevel(null);
      setAccessLevelLoading(false);
      return;
    }

    let cancelled = false;
    setAccessLevelLoading(true);
    supabase
      .from('team_members')
      .select('access_level')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setAccessLevel((data?.access_level as AccessLevel | undefined) ?? null);
        setAccessLevelLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  // Checa se a pessoa logada tem acesso pago ativo (`allowed_users.is_active`
  // via a função `has_active_access()`, que roda como SECURITY DEFINER pra
  // driblar o RLS que hoje só libera `team_members` pra ler essa tabela).
  // Roda pra QUALQUER sessão, igual o effect de `accessLevel` acima.
  const [hasPurchaseAccess, setHasPurchaseAccess] = useState<boolean | null>(null);
  const [purchaseAccessLoading, setPurchaseAccessLoading] = useState(true);

  const checkPurchaseAccess = async (userId: string | undefined) => {
    if (!userId) {
      setHasPurchaseAccess(null);
      setPurchaseAccessLoading(false);
      return;
    }
    setPurchaseAccessLoading(true);
    const { data, error } = await supabase.rpc('has_active_access');
    setHasPurchaseAccess(error ? false : Boolean(data));
    setPurchaseAccessLoading(false);
  };

  useEffect(() => {
    checkPurchaseAccess(session?.user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  const refreshPurchaseAccess = async () => {
    await checkPurchaseAccess(session?.user.id);
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, firstName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName } },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const requestPasswordReset: AuthContextValue['requestPasswordReset'] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    return { error: error?.message ?? null };
  };

  // Confere a senha atual reautenticando com email+senha antes de trocar —
  // o updateUser do Supabase por si só não valida a senha atual.
  const updatePassword: AuthContextValue['updatePassword'] = async (currentPassword, newPassword) => {
    const email = session?.user.email;
    if (!email) return { error: 'Sessão inválida. Faça login novamente.' };

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthError) return { error: 'Senha atual incorreta.' };

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        firstName,
        accessLevel,
        accessLevelLoading,
        hasPurchaseAccess,
        purchaseAccessLoading,
        refreshPurchaseAccess,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  return ctx;
}
