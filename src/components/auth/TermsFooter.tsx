import { EXTERNAL_PRIVACY_URL, EXTERNAL_TERMS_URL } from '../../lib/constants';

interface TermsFooterProps {
  prefix: string;
}

/**
 * Rodapé de "concordo com os Termos..." usado em Login/Criar Conta. Aponta
 * pra um site EXTERNO (fora do app) — confirmado com a Amanda (22/08/2026).
 * A tela `/termos` interna foi removida — o Perfil, já logado, usa os
 * MESMOS links externos (ver `Perfil.tsx`).
 */
export default function TermsFooter({ prefix }: TermsFooterProps) {
  return (
    <p className="w-full text-center font-body text-[12px] leading-[1.35] tracking-[0.36px] text-gray-900">
      {prefix}
      <br />
      <a href={EXTERNAL_TERMS_URL} target="_blank" rel="noreferrer" className="text-main-red-700">
        Termos de uso
      </a>{' '}
      e{' '}
      <a href={EXTERNAL_PRIVACY_URL} target="_blank" rel="noreferrer" className="text-main-red-700">
        Política de privacidade
      </a>
    </p>
  );
}
