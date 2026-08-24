import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FunnelIcon } from '../icons';
import { listCategories } from '../../lib/catalog';
import type { Category } from '../../types';

/**
 * Botão "Filtrar" que abre a lista de categorias (mesmo conteúdo do
 * POP-UP: FILTROS do Figma). Selecionar uma categoria navega direto para a
 * página dela.
 */
interface CategoryFilterSheetProps {
  /** Largura fixa de 163px + label/ícone espalhados nas pontas (mobile, tela Lojas) — ver mesmo prop no `SortDropdown`. */
  fixedWidth?: boolean;
}

export default function CategoryFilterSheet({ fixedWidth = false }: CategoryFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        // Falha silenciosa: a lista só fica vazia (o botão "Filtrar"
        // continua funcionando, só sem opções pra listar).
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`relative ${fixedWidth ? 'w-[163px] lg:w-auto' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 whitespace-nowrap border-b border-[#929799] px-4 py-2 font-body text-[15px] tracking-[0.75px] text-gray-500 lg:border-b-0 lg:px-0 lg:py-0 ${
          fixedWidth ? 'h-10 w-full justify-between lg:h-auto lg:w-auto lg:justify-start' : ''
        }`}
      >
        Filtrar
        <FunnelIcon className="size-[18px] shrink-0" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          {/* `right-0` (não `left-0`): o botão "Filtrar" fica perto da borda
              direita da tela (Lojas), então a lista precisa abrir pra
              esquerda — com `left-0` ela vazava da tela (Amanda, 19/08/2026). */}
          <div className="absolute right-0 top-full z-20 mt-1 max-h-[320px] w-[220px] overflow-y-auto rounded-lg border border-gray-100 bg-base-white shadow-lg">
            <div className="sticky top-0 flex items-center justify-between bg-gray-800 px-4 py-2">
              <span className="font-body text-[15px] tracking-[0.75px] text-base-white">Filtrar</span>
              <FunnelIcon className="size-[18px] text-base-white" />
            </div>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(`/categoria/${category.id}`);
                }}
                className="block w-full break-words border-b border-gray-100 px-4 py-2 text-left font-body text-[15px] tracking-[0.75px] text-gray-800 last:border-b-0 hover:bg-screen-bg"
              >
                {category.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
