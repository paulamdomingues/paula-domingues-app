import { useNavigate } from 'react-router-dom';
import { HeartIcon, HeartFillIcon } from './icons';
import ImagePlaceholder from './ImagePlaceholder';
import type { Store } from '../types';

interface StoreCardProps {
  store: Store;
  onToggleFavorite?: (store: Store) => void;
}

export default function StoreCard({ store, onToggleFavorite }: StoreCardProps) {
  const navigate = useNavigate();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/loja/${store.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/loja/${store.id}`);
      }}
      className="flex w-[clamp(140px,38vw,163px)] cursor-pointer flex-col items-center gap-1 py-2"
    >
      <div className="relative aspect-[163/180] w-full overflow-hidden rounded-lg">
        <ImagePlaceholder src={store.imageUrl} alt={store.name} className="size-full" />

        <button
          type="button"
          aria-label={
            store.isFavorite ? `Remover ${store.name} dos favoritos` : `Favoritar ${store.name}`
          }
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(store);
          }}
          className="absolute left-[8px] top-[8px] flex size-8 items-center justify-center rounded-full bg-base-white/80"
        >
          {store.isFavorite ? (
            <HeartFillIcon className="size-5 text-main-red-600" />
          ) : (
            <HeartIcon className="size-5 text-main-red-900" />
          )}
        </button>

        <div className="absolute bottom-0 right-0 flex h-6 w-[68px] items-center justify-end rounded-tl-2xl rounded-br-lg bg-accent-yellow p-1">
          <span className="font-body text-[12px] leading-[1.35] tracking-[0.36px] text-base-black">
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
