import { Navigate, Route, Routes } from 'react-router-dom';
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
import Termos from './pages/Termos';
import ComingSoon from './pages/ComingSoon';
import PreLogin from './pages/auth/PreLogin';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import EmailSent from './pages/auth/EmailSent';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLojas from './pages/admin/AdminLojas';
import AdminLojaForm from './pages/admin/AdminLojaForm';
import AdminStories from './pages/admin/AdminStories';
import AdminCategorias from './pages/admin/AdminCategorias';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import { isAdminHost } from './lib/constants';

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
    <div className="app-shell">
      <Routes>
        {/* Fluxo de autenticação: sem menu inferior */}
        <Route path="/entrar" element={<PreLogin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/criar-conta" element={<SignUp />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/email-enviado" element={<EmailSent />} />
        {/* Termos e Privacidade são públicos: dá pra ler antes de criar conta */}
        <Route path="/termos" element={<Termos />} />
        <Route path="/privacidade" element={<Termos />} />

        {/*
          Painel admin: área separada do app cliente (sem BottomNav, sem
          nenhum componente client), mas usando a MESMA sessão do Supabase
          Auth — ver `ProtectedAdminRoute`. Registrado antes do catch-all
          "/*" do app cliente; no React Router v6 isso não é estritamente
          necessário (caminhos explícitos como "/admin/lojas" sempre vencem
          um splat "/*" na hora de rankear a rota, não importa a ordem),
          mas deixa a intenção clara na leitura do arquivo.
        */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/esqueci-senha" element={<ComingSoon title="Esqueci minha senha (Admin)" />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="lojas" element={<AdminLojas />} />
            <Route path="lojas/nova" element={<AdminLojaForm />} />
            <Route path="lojas/:storeId" element={<AdminLojaForm />} />
            <Route path="stories" element={<AdminStories />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="categorias" element={<AdminCategorias />} />
            <Route path="relatorios" element={<ComingSoon title="Relatórios" />} />
            <Route path="configuracoes" element={<ComingSoon title="Configurações" />} />
          </Route>
        </Route>

        {/* App principal: protegido por sessão do Supabase */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppShell />} />
        </Route>
      </Routes>
    </div>
  );
}
