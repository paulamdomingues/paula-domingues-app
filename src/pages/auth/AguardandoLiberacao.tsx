import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';

/**
 * Tela de espera (Amanda, 20/08/2026): pra onde `ProtectedRoute` manda
 * quem já tem conta mas ainda não tem acesso liberado (`allowed_users`
 * ausente ou `is_active = false`) — ou porque nunca comprou, ou porque a
 * assinatura foi cancelada/reembolsada depois. Sem link pra loja/checkout
 * por pedido da Amanda (só a mensagem mesmo).
 *
 * "Verificar novamente" reroda a checagem sem precisar deslogar — útil pra
 * quem acabou de confirmar o pagamento na Hubla e quer entrar na hora, sem
 * esperar o próximo login.
 */
export default function AguardandoLiberacao() {
  const { session, loading, hasPurchaseAccess, purchaseAccessLoading, refreshPurchaseAccess, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  if (!loading && !session) {
    // 02/09/2026: a tela de Pre-Login saiu — vai direto pro Login de verdade.
    return <Navigate to="/login" replace />;
  }

  // Se a checagem (rodando de novo ou não) já confirmou acesso, sai daqui —
  // o ProtectedRoute deixa passar assim que essa página renderizar de novo
  // com a rota protegida (aqui só evitamos deixar a pessoa presa na tela
  // de espera depois de já ter sido liberada).
  if (!purchaseAccessLoading && hasPurchaseAccess === true) {
    return <Navigate to="/" replace />;
  }

  const handleCheckAgain = async () => {
    setChecking(true);
    await refreshPurchaseAccess();
    setChecking(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center gap-10 bg-screen-bg px-6 pt-[88px] lg:mx-auto lg:max-w-[548px] lg:pt-[160px]">
      <Logo />

      <div className="flex w-full flex-col items-center gap-8 text-center">
        <div className="flex w-full flex-col gap-2">
          <h1 className="w-full font-display text-[26px] font-bold tracking-[0.78px] text-main-red-600">
            Aguardando liberação
          </h1>
          <p className="w-full font-body text-[15px] tracking-[0.75px] text-grey-800">
            Sua conta ainda não tem acesso liberado. Isso normalmente acontece em até alguns minutos após a
            confirmação do pagamento.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleCheckAgain}
            disabled={checking || purchaseAccessLoading}
            className="flex h-[50px] w-full items-center justify-center rounded-lg bg-main-red-600 font-body text-[15px] font-bold tracking-[0.75px] text-base-white transition-opacity disabled:opacity-60"
          >
            {checking ? 'Verificando...' : 'Verificar novamente'}
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="font-body text-[13px] font-bold tracking-[0.65px] text-gray-600 underline"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}