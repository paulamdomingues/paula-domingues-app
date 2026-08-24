import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Busca from './pages/Busca';
import CategoryScreen from './pages/CategoryScreen';
import Lojas from './pages/Lojas';
import Favoritos from './pages/Favoritos';
import StoreDetail from './pages/StoreDetail';
import Perfil from './pages/Perfil';
import PerfilDuvidas from './pages/PerfilDuvidas';
import PerfilTrocarSenha from './pages/PerfilTrocarSenha';
import Notificacoes from './pages/Notificacoes';
import ComingSoon from './pages/ComingSoon';
import PreLogin from './pages/auth/PreLogin';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import EmailSent from './pages/auth/EmailSent';
import RedefinirSenha from './pages/auth/RedefinirSenha';
import AguardandoLiberacao from './pages/auth/AguardandoLiberacao';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminForgotPassword from './pages/admin/AdminForgotPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLojas from './pages/admin/AdminLojas';
import AdminLojaForm from './pages/admin/AdminLojaForm';
import AdminStories from './pages/admin/AdminStories';
import AdminCategorias from './pages/admin/AdminCategorias';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminConfiguracoes from './pages/admin/AdminConfiguracoes';
import AdminRelatorios from './pages/admin/AdminRelatorios';
import { isAdminHost } from './lib/constants';

/**
 * 24/08/2026, BUG apontado pela Amanda (Instruções Mudanças App V5.md,
 * itens 5 e 6 — "Versão Administrativo Desktop"): o painel admin inteiro
 * (sidebar + conteúdo) estava dentro da mesma `<div className="app-shell">`
 * do app cliente — aquele "mockup de celular" que trava a largura em 430px
 * (mobile) / 1440px (desktop) e centraliza no meio da tela (`#root` em
 * `index.css`). Resultado: (a) o painel admin ficava "sobrando" espaço nas
 * laterais em telas largas — nunca usava a tela toda, só até 1440px; e (b)
 * `overflow-x: hidden` do `.app-shell` vira, sem querer, o "ancestral com
 * mecanismo de scroll" que o `position: sticky` da `AdminSidebar` usa como
 * referência — em vez de grudar no viewport normalmente, ela grudava
 * relativo a essa caixa, o que quebrava visualmente quando o conteúdo da
 * página era mais alto que a tela (exatamente o que a Amanda marcou de
 * azul no print).
 *
 * `AdminLayout`/`AdminSidebar` já são pensados pra ocupar a tela inteira
 * sozinhos (não usam nada do app cliente, ver comentário em
 * `AdminLayout.tsx`) — então a correção é essa: só o app CLIENTE (as rotas
 * abaixo, dentro de `<ClientFrame>`) fica dentro do `.app-shell`; `/admin/*`
 * passa a ser irmã dele na árvore de rotas, fora dessa caixa.
 */
function ClientFrame() {
  return (
    <div className="app-shell">
      <Outlet />
    </div>
  );
}

function AppShell() {
  return (
    <div className="flex min-h-screen flex-col">
      {/*
        Em telas largas, o conteúdo fica centralizado numa "tela" de até
        1440px (a mesma largura de canvas do design desktop no Figma), com
        o fundo (screen-bg) preenchendo o resto — assim o cabeçalho e o
        conteúdo de cada página ficam alinhados um com o outro sem precisar
        de nenhum componente "full-bleed" separado.
      */}
      {/*
        BottomNav agora é `fixed` (fica grudado no viewport o tempo todo,
        independente do scroll — antes era `sticky` e só "aparecia" ao
        chegar no fim da página, ver conversa 18/08/2026). Como um elemento
        fixed sai do fluxo normal, o conteúdo do <main> precisa desse
        padding extra embaixo (só no mobile, onde a nav aparece — no
        desktop `lg:` ela é `lg:hidden`) pra nada ficar escondido atrás
        dela.
      */}
      <main className="mx-auto w-full flex-1 pb-28 lg:max-w-[1440px] lg:pb-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/busca" element={<Busca />} />
          <Route path="/categoria/:categoryId" element={<CategoryScreen />} />
          <Route path="/lojas" element={<Lojas />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/loja/:storeId" element={<StoreDetail />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/duvidas" element={<PerfilDuvidas />} />
          <Route path="/perfil/trocar-senha" element={<PerfilTrocarSenha />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="*" element={<ComingSoon title="Página não encontrada" />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  // Em `admin.pauladomingues.com`, a raiz "/" deve cair direto no painel
  // admin em vez da home do app cliente. Feito como um retorno antecipado
  // (em vez de uma <Route path="/" .../> concorrente lá embaixo) de
  // propósito: uma rota "/" explícita no nível de cima sempre venceria o
  // "/*" do app cliente no ranking do React Router, quebrando a home em
  // `app.pauladomingues.com` — aqui o desvio só acontece nesse domínio
  // específico, sem tocar em nada da árvore de rotas do cliente.
  if (isAdminHost() && window.location.pathname === '/') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Routes>
      {/* App cliente: mockup de celular/frame de até 1440px (`.app-shell`,
          ver `ClientFrame` acima) — fluxo de autenticação + app principal. */}
      <Route element={<ClientFrame />}>
        <Route path="/entrar" element={<PreLogin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/criar-conta" element={<SignUp />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/email-enviado" element={<EmailSent />} />
        {/* 21/08/2026: essa rota já era usada como `redirectTo` do email de
            recuperação (`requestPasswordReset`, `AuthContext.tsx`), mas não
            tinha NENHUMA página registrada aqui — o link do email levava a
            lugar nenhum. Serve tanto o fluxo cliente quanto o admin (ver
            `RedefinirSenha.tsx`) — fica aqui dentro do `.app-shell` porque a
            tela já se centraliza sozinha (mesmo padrão do `AdminLogin`),
            então não tem o problema dos itens 5/6. */}
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/aguardando-liberacao" element={<AguardandoLiberacao />} />

        {/* App principal: protegido por sessão do Supabase */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppShell />} />
        </Route>
      </Route>

      {/*
        Painel admin: área separada do app cliente (sem BottomNav, sem
        nenhum componente client, e de propósito FORA do `.app-shell` — ver
        comentário em `ClientFrame` acima), mas usando a MESMA sessão do
        Supabase Auth — ver `ProtectedAdminRoute`.
      */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/esqueci-senha" element={<AdminForgotPassword />} />
      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="lojas" element={<AdminLojas />} />
          <Route path="lojas/nova" element={<AdminLojaForm />} />
          <Route path="lojas/:storeId" element={<AdminLojaForm />} />
          <Route path="stories" element={<AdminStories />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="categorias" element={<AdminCategorias />} />
          <Route path="relatorios" element={<AdminRelatorios />} />
          <Route path="configuracoes" element={<AdminConfiguracoes />} />
        </Route>
      </Route>
    </Routes>
  );
}
