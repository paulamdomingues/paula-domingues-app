import { useState } from 'react';
import { SortArrowsIcon } from '../icons';
import { sortOptions, type SortOptionId } from '../../data/mockData';

interface SortDropdownProps {
  value: SortOptionId;
  onChange: (value: SortOptionId) => void;
  /**
   * De que lado a lista abre (mobile principalmente — no desktop sempre
   * cabe). 'right' (padrão) = lista abre pra esquerda a partir do botão,
   * usado quando o botão fica perto da borda direita da tela (Busca,
   * Categoria). 'left' = lista abre pra direita, usado quando o botão fica
   * perto da borda esquerda (Lojas) — sem isso a lista vazava da tela
   * (Amanda, 19/08/2026).
   */
  align?: 'left' | 'right';
  /**
   * Largura fixa de 163px pro botão + label/ícone espalhados nas pontas —
   * usado só na tela Lojas (mobile), pra bater exatamente com a largura do
   * botão "Filtrar" ao lado (163px cada, 16px de gap entre os dois = 342px,
   * mesma largura de duas colunas da grade de cards embaixo). Some no
   * desktop (`lg:`), onde esse botão volta a ter largura automática, igual
   * nos outros lugares que usam esse componente (Busca, Categoria) — Amanda,
   * 20/08/2026.
   */
  fixedWidth?: boolean;
}

export default function SortDropdown({ value, onChange, align = 'right', fixedWidth = false }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const current = sortOptions.find((option) => option.id === value) ?? sortOptions[0];

  return (
    <div className={`relative ${fixedWidth ? 'w-[163px] lg:w-auto' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 border-b border-[#929799] px-4 py-2 font-body text-[15px] tracking-[0.75px] text-gray-500 ${
          fixedWidth ? 'w-full justify-between lg:w-auto lg:justify-start' : ''
        }`}
      >
        {current.label}
        <SortArrowsIcon className="size-[18px]" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute top-full z-20 mt-1 w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-base-white shadow-lg ${
              align === 'left' ? 'left-0' : 'right-0'
            }`}
          >
            <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
              <span className="font-body text-[15px] tracking-[0.75px] text-base-white">
                {current.label}
              </span>
              <SortArrowsIcon className="size-[18px] text-base-white" />
            </div>
            {sortOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className="block w-full border-b border-gray-100 px-4 py-2 text-left font-body text-[15px] tracking-[0.75px] text-gray-800 last:border-b-0 hover:bg-screen-bg"
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
