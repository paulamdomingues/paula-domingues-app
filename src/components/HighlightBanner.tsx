import { PiPlayFill } from 'react-icons/pi';
import ImagePlaceholder from './ImagePlaceholder';
import Logo from './Logo';

export default function HighlightBanner() {
  return (
    <div className="flex w-full items-center gap-6">
      <a
        href="#"
        className="relative flex h-[178px] w-[100px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg p-0.5 shadow-[3px_4px_7.8px_2px_rgba(69,16,18,0.28)]"
        aria-label="Ver stories de destaques"
      >
        <ImagePlaceholder src={null} alt="Prévia de stories" className="absolute inset-0 size-full" />
        <PiPlayFill className="relative size-10 text-main-red-400" />
      </a>

      <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-6">
        <Logo />
        <div className="flex w-full flex-col items-start gap-1">
          <p className="w-full font-display font-bold text-[26px] leading-[1.15] tracking-[0.78px] text-base-black">
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
