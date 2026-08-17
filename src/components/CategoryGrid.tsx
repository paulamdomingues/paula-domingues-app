import { useRef } from 'react';
import { PiArrowFatLineLeft, PiArrowFatLineRight } from 'react-icons/pi';
import type { Category } from '../types';
import CategoryBubble from './CategoryBubble';

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory?: (category: Category) => void;
}

export default function CategoryGrid({ categories, onSelectCategory }: CategoryGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="flex w-full items-center gap-4">
      {/* No desktop, as setas substituem a rolagem por toque do mobile. */}
      <button
        type="button"
        aria-label="Categorias anteriores"
        onClick={() => scrollByAmount(-320)}
        className="hidden shrink-0 text-main-red-800 lg:block"
      >
        <PiArrowFatLineLeft className="size-9" />
      </button>

      <div ref={scrollRef} className="flex w-full gap-4 overflow-x-auto pb-1 scroll-smooth">
        {/* Agrupa em blocos de 6 (grade 3x2), reproduzindo o layout original do Figma */}
        {Array.from({ length: Math.ceil(categories.length / 6) }, (_, blockIndex) => (
          <div key={blockIndex} className="grid shrink-0 grid-cols-3 grid-rows-2 gap-x-4 gap-y-4">
            {categories.slice(blockIndex * 6, blockIndex * 6 + 6).map((category) => (
              <CategoryBubble key={category.id} category={category} onSelect={onSelectCategory} />
            ))}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Próximas categorias"
        onClick={() => scrollByAmount(320)}
        className="hidden shrink-0 text-main-red-800 lg:block"
      >
        <PiArrowFatLineRight className="size-9" />
      </button>
    </div>
  );
}
