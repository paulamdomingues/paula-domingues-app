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
 *   completo em Lojas, Categorias e Usuários; vê Resumo e Relatórios; e
 *   (24/08/2026) também sobe/exclui Stories.
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
  /**
   * `fromAdmin`: quando o pedido vem da tela de login do painel admin
   * (`AdminForgotPassword.tsx`), marca o link do email com `?admin=1` — é
   * assim que `RedefinirSenha.tsx` sabe mandar a pessoa de volta pro
   * `/admin/login` (em vez do `/login` do app cliente) depois de trocar a
   * senha. 21/08/2026: existia só a versão cliente até aqui — o painel
   * admin usava a MESMA função de auth, mas a tela "Esqueci minha senha"
   * dele ainda era um placeholder "Em breve".
   */
  requestPasswordReset: (email: string, fromAdmin?: boolean) => Promise<{ error: string | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>;
  /**
   * Usado só pela tela `RedefinirSenha.tsx` (o link que chega por email) —
   * diferente de `updatePassword`, não pede a senha atual porque quem
   * clicou no link já tem uma sessão de recuperação temporária que o
   * Supabase cria sozinho ao abrir esse link (não é a mesma coisa que
   * "estar logado" no app).
   */
  completePasswordReset: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // `accessLevelData` guarda pra QUAL `userId` aquele resultado é válido —
  // ver o comentário grande logo abaixo (25/08/2026) sobre por que isso
  // substituiu dois `useState` soltos (`accessLevel`/`accessLevelLoading`).
  const [accessLevelData, setAccessLevelData] = useState<{
    userId: string | null;
    level: AccessLevel | null;
    loading: boolean;
  }>({ userId: null, level: null, loading: true });
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
  //
  // BUG corrigido em 22/08/2026 ("login não tá segurando" no admin / "vê a
  // tela de aguardando pagamento por 1-2s" no cliente): esse efeito reagia
  // à sessão ANTES do efeito de cima (`getSession()`) terminar de resolver.
  // Como o mount inicial tem `session = null`, esse efeito rodava de
  // imediato e já deixava `accessLevelLoading = false` (correto pra quem
  // realmente não tem sessão) — só que, no instante seguinte, quando a
  // sessão de verdade chegava, havia UM frame de render em que `session`
  // já existia mas `accessLevelLoading`/`accessLevel` ainda estavam com
  // esse valor "antigo" (false/null) — tempo suficiente pra `ProtectedRoute`/
  // `ProtectedAdminRoute` concluírem, por engano, que a pessoa não tinha
  // acesso e redirecionar pra fora. Agora esse efeito espera `loading`
  // (o efeito de cima) terminar antes de decidir qualquer coisa — assim
  // `accessLevelLoading` só existe nos dois estados válidos: "ainda não
  // sei" (true, enquanto `loading` também é true) ou "já sei" (com o valor
  // real da sessão já resolvida).
  useEffect(() => {
    if (loading) return;

    const userId = session?.user.id ?? null;
    if (!userId) {
      setAccessLevelData({ userId: null, level: null, loading: false });
      return;
    }

    let cancelled = false;
    setAccessLevelData((prev) => ({ ...prev, loading: true }));
    supabase
      .from('team_members')
      .select('access_level')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setAccessLevelData({ userId, level: (data?.access_level as AccessLevel | undefined) ?? null, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, loading]);

  // BUG corrigido em 25/08/2026 ("entrar no admin às vezes cai direto em
  // 'conta sem acesso', só entra de verdade na segunda tentativa de
  // login"): mesma FAMÍLIA do bug de 22/08 acima, só que disparando no
  // momento do LOGIN em vez do carregamento inicial da página. Sequência:
  // 1) `signIn()` autentica com sucesso e o listener `onAuthStateChange`
  //    atualiza `session` pro usuário recém-logado;
  // 2) `AdminLogin.tsx` navega pra `/admin` logo em seguida;
  // 3) `ProtectedAdminRoute` renderiza usando o `accessLevelLoading` que
  //    ainda estava `false` (sobra do estado "deslogado" de antes) — o
  //    efeito acima AINDA NÃO rodou de novo pra esse novo `userId` (efeitos
  //    só rodam depois do render commitar). Pra esse render, o contexto
  //    parecia dizer "já sei o accessLevel, e é null" — `ProtectedAdminRoute`
  //    concluía (errado) "conta sem acesso" e mandava de volta pro login.
  // Corrigido comparando o `userId` salvo em `accessLevelData` contra o
  // `session.user.id` ATUAL em todo render (não só depois do efeito rodar):
  // se não bate, ainda não temos resposta pra ESSA sessão — força
  // `accessLevelLoading = true` e `accessLevel = null` até o efeito
  // terminar de buscar o valor certo, fechando a janela de tempo em que um
  // valor "herdado" de outra sessão (ou de nenhuma sessão) podia vazar.
  const currentUserId = session?.user.id ?? null;
  const accessLevelStale = accessLevelData.userId !== currentUserId;
  const accessLevel = accessLevelStale ? null : accessLevelData.level;
  const accessLevelLoading = accessLevelStale ? true : accessLevelData.loading;

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

  // Mesma correção de corrida do efeito de `accessLevel` acima — espera
  // `loading` terminar antes de resolver `purchaseAccessLoading`, senão
  // sobra um frame com `session` já definida mas `hasPurchaseAccess` ainda
  // no valor "antigo" (22/08/2026).
  useEffect(() => {
    if (loading) return;
    checkPurchaseAccess(session?.user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, loading]);

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

  const requestPasswordReset: AuthContextValue['requestPasswordReset'] = async (email, fromAdmin) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha${fromAdmin ? '?admin=1' : ''}`,
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

  // Sem reautenticação de propósito: a sessão de recuperação que o Supabase
  // cria ao abrir o link do email já é prova suficiente de que é a pessoa
  // dona do email (é exatamente o que esse link representa).
  const completePasswordReset: AuthContextValue['completePasswordReset'] = async (newPassword) => {
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
        completePasswordReset,
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
