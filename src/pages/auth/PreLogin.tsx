import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';
import { BUNNY_PRELOGIN_BG_DESKTOP_URL, BUNNY_PRELOGIN_BG_MOBILE_URL } from '../../lib/bunnyStorage';

/**
 * 25/08/2026 (Figma, node "telas pra atualizar e imagens"): entrou a foto
 * institucional de verdade no lugar do gradiente placeholder — mobile e
 * desktop usam fotos DIFERENTES (recortes próprios pra cada formato, ver
 * `bunnyStorage.ts`), por isso são dois <img> (um escondido em cada
 * breakpoint) em vez de um só com `object-position` genérico. As duas já
 * saem do Figma escurecidas/tratadas — não precisa de nenhum overlay extra
 * aqui por cima.
 *
 * O cartão com a frase "O catálogo de moda..." que existia antes por cima
 * do logo saiu do design novo — agora é só o logo puro sobre a foto.
 */
export default function PreLogin() {
  return (
    <div className="relative isolate flex min-h-screen w-full flex-col items-center justify-between overflow-hidden px-6 pt-[40px] pb-[184px] lg:px-[256px] lg:py-[80px]">
      <img
        src={BUNNY_PRELOGIN_BG_MOBILE_URL}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full object-cover lg:hidden"
      />
      <img
        src={BUNNY_PRELOGIN_BG_DESKTOP_URL}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden size-full object-cover lg:block"
      />

      <Logo className="h-auto w-[clamp(180px,45vw,280px)]" />

      <div className="flex w-full flex-col items-center gap-4">
        <Link
          to="/login"
          className="flex h-[50px] w-full items-center justify-center rounded-lg bg-main-red-600 p-2 font-display font-bold text-[26px] tracking-[0.78px] text-base-white lg:h-[60px] lg:text-[32px] lg:tracking-[1.6px]"
        >
          Acessar Conta
        </Link>
        <p className="text-center font-body text-[12px] tracking-[0.36px] text-main-dark-50 lg:text-[24px] lg:tracking-[0.24px]">
          Primeira vez aqui?{' '}
          <Link to="/criar-conta" className="text-main-red-50 underline lg:text-main-dark-50">
            Criar Conta
          </Link>
        </p>
      </div>
    </div>
  );
}
