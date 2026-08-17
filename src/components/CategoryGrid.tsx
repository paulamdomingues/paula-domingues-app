import type { Category } from '../types';
import CategoryBubble from './CategoryBubble';

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory?: (category: Category) => void;
}

export default function CategoryGrid({ categories, onSelectCategory }: CategoryGridProps) {
  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-1">
      {/* Agrupa em blocos de 6 (grade 3x2), reproduzindo o layout original do Figma */}
      {Array.from({ length: Math.ceil(categories.length / 6) }, (_, blockIndex) => (
        <div
          key={blockIndex}
          className="grid shrink-0 grid-cols-3 grid-rows-2 gap-x-4 gap-y-4"
        >
          {categories.slice(blockIndex * 6, blockIndex * 6 + 6).map((category) => (
            <CategoryBubble key={category.id} category={category} onSelect={onSelectCategory} />
          ))}
        </div>
      ))}
    </div>
  );
}
