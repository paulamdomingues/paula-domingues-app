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
      className="flex w-[160px] cursor-pointer flex-col items-center gap-1 py-2"
    >
      {/* 03/09/2026, pedido da Amanda (Figma node 113:7556 confirma
          160x160): imagem virou um quadrado fixo — era `aspect-[163/180]`
          numa largura responsiva `clamp(140px,38vw,163px)`. Vale pra TODOS
          os cards de loja (componente único, usado em Home/CategoryScreen/
          Busca/Lojas/Favoritos), então essa mudança aqui já propaga sozinha.
       *
       * Em telas bem estreitas (<~350px de largura), 2 colunas de 160px +
       * 16px de gap passam a largura do aparelho — pode gerar um scroll
       * horizontal leve nessas grades. Se incomodar na prática, dá pra
       * revisitar (ex: manter fixo só a partir de um breakpoint mínimo). */}
      <div className="relative size-[160px] overflow-hidden rounded-lg">
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

        {/* 03/09/2026, pedido da Amanda: label do código mudou de
            `bg-accent-yellow`/texto preto pra `bg-main-red-800`/texto
            branco, em todos os cards. */}
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