import { Route, Routes } from 'react-router-dom';
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
      <main className="mx-auto w-full flex-1 pb-4 lg:max-w-[1440px]">
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

        {/* App principal: protegido por sessão do Supabase */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppShell />} />
        </Route>
      </Routes>
    </div>
  );
}
