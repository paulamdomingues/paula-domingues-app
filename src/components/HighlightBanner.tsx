import { PlayIcon } from './icons';
import ImagePlaceholder from './ImagePlaceholder';
import Logo from './Logo';

interface HighlightBannerProps {
  /** Abre o player de stories (overlay em tela cheia, ver `StoryPlayerOverlay` em `Home.tsx`). */
  onClick?: () => void;
}

export default function HighlightBanner({ onClick }: HighlightBannerProps) {
  return (
    <div className="flex w-full items-center gap-6 lg:gap-9">
      <button
        type="button"
        onClick={onClick}
        className="relative flex h-[178px] w-[100px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg p-0.5 shadow-[3px_4px_7.8px_2px_rgba(69,16,18,0.28)] lg:h-[320px] lg:w-[262px]"
        aria-label="Ver stories de destaques"
      >
        <ImagePlaceholder src={null} alt="Prévia de stories" className="absolute inset-0 size-full" />
        {/* Máscara na cor main-red-500 a 60% de opacidade sobre a thumbnail */}
        <span className="absolute inset-0 rounded-lg bg-main-red-500/60" aria-hidden="true" />
        {/* Fundo circular atrás do play, pedido pela Amanda (20/08/2026) —
            antes era só o ícone branco flutuando direto sobre a imagem. */}
        <span className="relative flex size-10 items-center justify-center rounded-full bg-rose-100 shadow-[0px_4px_4px_0px_rgba(255,255,255,0.25)] lg:size-14">
          <PlayIcon className="size-5 text-rose-950 lg:size-7" />
        </span>
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-6">
        {/* No desktop a logo já aparece na TopBar acima — não repete aqui. */}
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex w-full flex-col items-start gap-1">
          <p className="w-full font-display font-bold text-[26px] leading-[1.15] tracking-[0.78px] text-base-black lg:text-[32px]">
            Destaques e Novidades
          </p>
          <p className="w-full font-body text-[14px] leading-[1.35] tracking-[0.7px] text-gray-800">
            Conteúdos exclusivos para o seu negócio vender mais.
          </p>
        </div>
      </div>
    </div>
  );
}
