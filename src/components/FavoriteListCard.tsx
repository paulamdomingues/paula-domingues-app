import { useNavigate } from 'react-router-dom';
import { CaretRightIcon, HeartFillIcon } from './icons';
import ImagePlaceholder from './ImagePlaceholder';
import type { Store } from '../types';

interface FavoriteListCardProps {
  store: Store;
  onToggleFavorite?: (store: Store) => void;
}

/**
 * Card horizontal usado só na tela de Favoritos (layout diferente do
 * StoreCard em grade): foto pequena à esquerda, nome/categoria no meio,
 * coração preenchido + seta indicando que o card inteiro abre a loja.
 */
export default function FavoriteListCard({ store, onToggleFavorite }: FavoriteListCardProps) {
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
      <ImagePlaceholder
        src={store.imageUrl}
        alt={store.name}
        className="aspect-[80/88] h-full shrink-0"
        rounded="rounded-l-lg"
      />

      <div className="flex flex-1 items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 flex-col items-start justify-center">
          <p className="w-full truncate font-display font-bold text-[22px] leading-[1.2] tracking-[0.66px] text-main-red-800">
            {store.name}
          </p>
          <p className="w-full truncate font-body text-[14px] leading-[1.35] tracking-[0.7px] text-gray-200">
            {store.categoryLabel}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Remover ${store.name} dos favoritos`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(store);
            }}
            className="flex size-9 items-center justify-center rounded-full"
          >
            <HeartFillIcon className="size-5 text-main-red-600" />
          </button>
          <CaretRightIcon className="size-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
