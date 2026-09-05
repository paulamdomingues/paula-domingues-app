import { useRef } from 'react';
import { ArrowFatLineLeftIcon, ArrowFatLineRightIcon } from './icons';
import type { Category } from '../types';
import CategoryBubble from './CategoryBubble';

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory?: (category: Category) => void;
}

// Largura da "trilha" visível no desktop (Figma: 939px, mostra 5 itens
// completos + fração do 6º pra sugerir continuidade). As setas deslocam o
// scroll exatamente por essa largura a cada clique.
const DESKTOP_TRACK_WIDTH = 939;

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
        onClick={() => scrollByAmount(-DESKTOP_TRACK_WIDTH)}
        className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-main-red-200 text-main-red-800 lg:flex"
      >
        <ArrowFatLineLeftIcon className="size-5" />
      </button>

      {/*
        Mobile: agrupa em blocos de 6 (grade 3x2), reproduzindo o layout mobile do Figma.
        Desktop: uma única linha (carrossel horizontal) dentro de uma trilha de 939px,
        com scroll (`overflow-x-auto`) e 24px de gap entre os itens.
        `no-scrollbar`: some com a barrinha de rolagem nativa nos dois breakpoints
        (mobile também rola horizontalmente quando há mais de 1 bloco de 6) —
        Amanda pediu pra remover, deixa o layout mais fluido (19/08/2026).

        05/09/2026 (Amanda: em telas estreitas — ela testou 390px e 403px —
        o bloco de 6 cabia inteiro e o começo do próximo bloco também
        aparecia INTEIRO ao lado, sem nenhuma bolinha cortada na borda. Sem
        nada cortado, não fica intuitivo que dá pra arrastar pra ver mais
        categorias — parecia só mais uma grade estática). Reduzido o gap
        interno do bloco (`gap-x-4 gap-y-4` → `gap-x-2 gap-y-2`) e o gap
        ENTRE blocos (`gap-4` → `gap-2`, no wrapper `flex` logo abaixo): com
        menos espaço "desperdiçado" nos respiros, a borda da tela passa a
        cortar uma bolinha do próximo bloco no meio, em vez de terminar
        exatamente numa folga — é esse corte que passa a sensação de "tem
        mais pra arrastar". Vale a Amanda conferir ao vivo nos mesmos 390px/
        403px e me pedir pra afinar mais (gap ainda menor) se o corte não
        ficar visível o bastante.
      */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex w-full gap-4 overflow-x-auto pb-1 scroll-smooth lg:w-[939px] lg:gap-0"
      >
        <div className="flex shrink-0 gap-2 lg:hidden">
          {Array.from({ length: Math.ceil(categories.length / 6) }, (_, blockIndex) => (
            <div key={blockIndex} className="grid shrink-0 grid-cols-3 grid-rows-2 gap-x-2 gap-y-2">
              {categories.slice(blockIndex * 6, blockIndex * 6 + 6).map((category) => (
                <CategoryBubble key={category.id} category={category} onSelect={onSelectCategory} />
              ))}
            </div>
          ))}
        </div>
        <div className="hidden shrink-0 lg:flex lg:gap-[24px]">
          {categories.map((category) => (
            <CategoryBubble key={category.id} category={category} onSelect={onSelectCategory} />
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Próximas categorias"
        onClick={() => scrollByAmount(DESKTOP_TRACK_WIDTH)}
        className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-main-red-200 text-main-red-800 lg:flex"
      >
        <ArrowFatLineRightIcon className="size-5" />
      </button>
    </div>
  );
}