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
      className="flex w-[clamp(72px,22vw,95px)] shrink-0 flex-col items-center gap-2 lg:h-[193px] lg:w-[147px]"
    >
      <span className="flex aspect-square w-full items-center justify-center rounded-full border-[1.15px] border-main-red-900 bg-main-red-50 p-2">
        <ImagePlaceholder
          src={category.imageUrl}
          alt={category.label}
          rounded="rounded-full"
          className="size-full"
        />
      </span>
      <span className="w-full break-words text-center font-display font-semibold text-[18px] leading-[1.2] tracking-[0.9px] text-main-red-900">
        {category.label}
      </span>
    </button>
  );
}
