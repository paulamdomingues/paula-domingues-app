import { useNavigate } from 'react-router-dom';
import ImagePlaceholder from './ImagePlaceholder';
import type { Store } from '../types';

interface RankedStoreCardProps {
  store: Store;
  rank: number;
}

/**
 * 08/10/2026 (Amanda, Figma node 1815:5840 "Mais Procuradas da Semana"):
 * variante do StoreCard usada só na prévia da Home do ranking semanal —
 * mesma base (foto 160x160 + código no canto + nome/categoria embaixo), mas
 * com um selo circular numerado (1º, 2º...) no canto superior esquerdo da
 * foto, no lugar do coração de favoritar. Sem toggle de favorito de
 * propósito, igual ao Figma (aqui é só ranking, não favoritos).
 */
export default function RankedStoreCard({ store, rank }: RankedStoreCardProps) {
  const navigate = useNavigate();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/loja/${store.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/loja/${store.id}`);
      }}
      // 13/10/2026 (Amanda): tirado o `pt-2` (só ficou `pb-2`) — esse
      // respiro no topo do card somava com o `gap-4` da seção na Home
      // (ver Home.tsx) e deixava o espaço entre o título "Mais Procuradas
      // da Semana !" e os cards maior do que devia.
      className="flex w-[160px] shrink-0 cursor-pointer flex-col items-center gap-1 pb-2"
    >
      <div className="relative size-[160px] overflow-hidden rounded-lg">
        <ImagePlaceholder src={store.imageUrl} alt={store.name} className="size-full" />

        <div className="absolute left-2 top-2 flex size-9 items-center justify-center rounded-full bg-main-red-800">
          <span className="font-body text-[14px] tracking-[0.28px] text-base-white">{rank}°</span>
        </div>

        <div className="absolute bottom-0 right-0 flex h-6 w-[68px] items-center justify-end rounded-tl-2xl rounded-br-lg bg-main-red-800 p-1">
          <span className="font-body text-[12px] leading-[1.35] tracking-[0.36px] text-base-white">
            {store.code}
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col items-start">
        <p className="w-full font-display font-bold text-[22px] leading-[1.2] tracking-[0.66px] text-black">
          {store.name}
        </p>
        <p className="w-full font-body text-[14px] leading-[1.35] tracking-[0.7px] text-[#706f6f]">
          {store.categoryLabel}
        </p>
      </div>
    </div>
  );
}
