import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protege as rotas internas do app (Início, Busca, Lojas, Favoritos, Perfil):
 * se não houver sessão do Supabase, redireciona para a tela de Pre-Login.
 *
 * 20/08/2026: além da sessão, agora também exige acesso pago ativo
 * (`hasPurchaseAccess`, ver AuthContext) — quem criou conta mas nunca
 * comprou (ou teve a assinatura cancelada/reembolsada) cai em
 * `/aguardando-liberacao` em vez do app. Equipe do painel admin
 * (`accessLevel !== null`) sempre passa, mesmo sem estar em
 * `allowed_users` — não faz sentido travar quem já tem acesso via
 * `team_members`.
 */
export default function ProtectedRoute() {
  const { session, loading, accessLevel, accessLevelLoading, hasPurchaseAccess, purchaseAccessLoading } = useAuth();

  if (loading || (session && (accessLevelLoading || purchaseAccessLoading))) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-screen-bg">
        <p className="font-body text-gray-800">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/entrar" replace />;
  }

  const hasClientAccess = accessLevel !== null || hasPurchaseAccess === true;
  if (!hasClientAccess) {
    return <Navigate to="/aguardando-liberacao" replace />;
  }

  return <Outlet />;
}
