import ImagePlaceholder from './ImagePlaceholder';
import type { Category } from '../types';

interface CategoryBubbleProps {
  category: Category;
  onSelect?: (category: Category) => void;
}

export default function CategoryBubble({ category, onSelect }: CategoryBubbleProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(category)}
      className="flex w-[78px] shrink-0 flex-col items-center gap-2 lg:h-[193px] lg:w-[147px]"
    >
      {/* 24/08/2026, pedido da Amanda: tirar o "anel" claro que aparecia
          entre a borda vermelha escura e a foto — era o `p-2` deixando a
          cor de fundo (`bg-main-red-50`, rosa claro) visível como uma
          borda interna. Sem o padding a foto vai até a borda escura
          direto; a borda escura (`border-main-red-900`) continua igual.
       *
       * 03/09/2026, pedido da Amanda (Figma node 113:7556 confirma 78px):
       * tamanho fixo em px no mobile (era `aspect-square w-full` sobre um
       * botão de largura `clamp(72px,22vw,95px)` — variava com o viewport e,
       * às vezes, no site publicado, renderizava um círculo não-perfeito;
       * fixo elimina isso de vez). Desktop continua 147px, sem mudança. */}
      <span className="flex size-[78px] shrink-0 items-center justify-center rounded-full border-[1.15px] border-main-red-900 bg-main-red-50 lg:size-[147px]">
        <ImagePlaceholder
          src={category.imageUrl}
          alt={category.label}
          rounded="rounded-full"
          className="size-full object-center"
        />
      </span>
      <span className="w-full break-words text-center font-display font-semibold text-[18px] leading-[1.2] tracking-[0.9px] text-main-red-900">
        {category.label}
      </span>
    </button>
  );
}