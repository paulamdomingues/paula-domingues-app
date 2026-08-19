import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protege as rotas `/admin/*`: exige sessão do Supabase E um registro em
 * `team_members` (qualquer um dos 4 níveis de acesso). Diferente do
 * `ProtectedRoute` do app cliente — lá basta ter sessão; aqui a sessão
 * sozinha não é suficiente, porque é o MESMO sistema de login (Supabase
 * Auth) usado pelos clientes finais. Uma cliente comum logada não tem linha
 * em `team_members`, então `accessLevel` fica `null` e ela é mandada de
 * volta pro login do admin, sem nunca ver nenhuma tela interna.
 */
export default function ProtectedAdminRoute() {
  const { session, loading, accessLevel, accessLevelLoading } = useAuth();
  const location = useLocation();

  if (loading || (session && accessLevelLoading)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-main-dark-50">
        <p className="font-body text-gray-800">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!accessLevel) {
    return <Navigate to="/admin/login" replace state={{ unauthorized: true }} />;
  }

  return <Outlet />;
}
