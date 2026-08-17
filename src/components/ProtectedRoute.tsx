import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protege as rotas internas do app (Início, Busca, Lojas, Favoritos, Perfil):
 * se não houver sessão do Supabase, redireciona para a tela de Pre-Login.
 */
export default function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-screen-bg">
        <p className="font-body text-gray-800">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/entrar" replace />;
  }

  return <Outlet />;
}
