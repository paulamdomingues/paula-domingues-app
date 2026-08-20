import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminMobileNav from './AdminMobileNav';

/**
 * Shell do painel admin: sidebar fixa (desktop) ou menu inferior fixo
 * (mobile, abaixo de `lg`) + área de conteúdo rolável. Cada tela
 * (`AdminDashboard`, `AdminLojas`, ...) entra via `<Outlet />`, registrada
 * como rota filha de `/admin` em `App.tsx`.
 *
 * 21/08/2026: virou responsivo (Figma mobile do admin, canvas "App V1 -
 * Dash") — `AdminSidebar` (260px) só aparece a partir de `lg`, e
 * `AdminMobileNav` (5 ícones, sem Categorias/Relatórios — ver comentário
 * lá) cobre o mobile. `pb-24` no `<main>` abaixo de `lg` só existe pra
 * conteúdo não ficar escondido atrás do menu fixo, mesmo padrão do
 * `BottomNav` do app cliente.
 *
 * De propósito, este componente não importa NADA do app cliente (sem
 * `Header`/`TopBar`/`BottomNav`) — o painel admin é uma área visualmente
 * separada, só compartilhando o `AuthContext` (mesma sessão do Supabase) e
 * a paleta de cores do `tailwind.config.js`.
 */
export default function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full bg-screen-bg">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      <main className="flex-1 overflow-y-auto px-6 py-8 pb-24 lg:px-10 lg:pb-8">
        <Outlet />
      </main>
      <AdminMobileNav />
    </div>
  );
}
