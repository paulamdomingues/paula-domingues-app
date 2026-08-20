import { useState } from 'react';
import { SortArrowsIcon } from '../icons';
import { sortOptions, type SortOptionId } from '../../lib/sortOptions';

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
  /**
   * Versão compacta (padding/fonte menores) pra caber em uma linha só sem
   * quebrar, usada na Busca (mobile) ao lado do rótulo "Ordem de exibição:"
   * — os dois juntos formam uma caixa de até 342x40px. Some no desktop
   * (`lg:`), volta pro tamanho normal (Amanda, 20/08/2026).
   */
  compact?: boolean;
}

export default function SortDropdown({
  value,
  onChange,
  align = 'right',
  fixedWidth = false,
  compact = false,
}: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const current = sortOptions.find((option) => option.id === value) ?? sortOptions[0];

  return (
    <div className={`relative ${fixedWidth ? 'w-[163px] lg:w-auto' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center whitespace-nowrap border-b border-[#929799] font-body text-gray-500 ${
          compact
            ? 'gap-1.5 px-3 py-1.5 text-[13px] tracking-[0.65px] lg:gap-2 lg:px-4 lg:py-2 lg:text-[15px] lg:tracking-[0.75px]'
            : 'gap-2 px-4 py-2 text-[15px] tracking-[0.75px]'
        } ${fixedWidth ? 'w-full justify-between lg:w-auto lg:justify-start' : ''}`}
      >
        {current.label}
        <SortArrowsIcon className="size-[18px] shrink-0" />
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
