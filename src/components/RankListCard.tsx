import { useNavigate } from 'react-router-dom';
import { CaretRightIcon } from './icons';
import ImagePlaceholder from './ImagePlaceholder';
import type { Store } from '../types';

interface RankListCardProps {
  store: Store;
  rank: number;
}

/**
 * 08/10/2026 (Amanda, Figma node 1831:6085 "teste ranking"): card da tela
 * "Mais Procuradas da Semana" (ranking completo) e também reaproveitado na
 * prévia da Home — mesma base visual do `FavoriteListCard` (foto pequena à
 * esquerda, nome/categoria no meio, seta indicando que o card abre a loja),
 * mas sem botão de favoritar: no lugar do coração, um selo com a posição no
 * ranking (1º, 2º...). Por pedido da Amanda, não mostra nenhum número de
 * visualizações — só a posição.
 */
export default function RankListCard({ store, rank }: RankListCardProps) {
  const navigate = useNavigate();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/loja/${store.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/loja/${store.id}`);
      }}
      className="flex h-[90px] w-full cursor-pointer items-stretch overflow-hidden rounded-lg border border-main-dark-200 bg-base-white"
    >
      <div className="relative aspect-[80/88] h-full shrink-0">
        <ImagePlaceholder src={store.imageUrl} alt={store.name} className="size-full" rounded="rounded-l-lg" />
        <div className="absolute right-0 top-1 flex h-6 w-8 items-center justify-center rounded-bl-[4px] rounded-tl-[4px] bg-screen-bg">
          <span className="font-body text-[14px] leading-[1.35] tracking-[0.28px] text-main-red-900">{rank}°</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 flex-col items-start justify-center">
          <p className="w-full truncate font-display font-bold text-[22px] leading-[1.2] tracking-[0.66px] text-main-red-800">
            {store.name}
          </p>
          <p className="w-full truncate font-body text-[14px] leading-[1.35] tracking-[0.7px] text-gray-200">
            {store.categoryLabel}
          </p>
        </div>

        <CaretRightIcon className="size-4 shrink-0 text-gray-400" />
      </div>
    </div>
  );
}
