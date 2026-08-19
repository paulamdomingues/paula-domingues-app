import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

/**
 * Shell do painel admin: sidebar fixa + área de conteúdo rolável. Cada tela
 * (`AdminDashboard`, `AdminLojas`, ...) entra via `<Outlet />`, registrada
 * como rota filha de `/admin` em `App.tsx`.
 *
 * De propósito, este componente não importa NADA do app cliente (sem
 * `Header`/`TopBar`/`BottomNav`) — o painel admin é uma área visualmente
 * separada, só compartilhando o `AuthContext` (mesma sessão do Supabase) e
 * a paleta de cores do `tailwind.config.js`.
 */
export default function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full bg-screen-bg">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}
