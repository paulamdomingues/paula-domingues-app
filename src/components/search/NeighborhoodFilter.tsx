import { neighborhoods, type Neighborhood } from '../../data/mockData';

interface NeighborhoodFilterProps {
  value: Neighborhood | null;
  onChange: (value: Neighborhood | null) => void;
}

/**
 * Filtro de localização/bairro da tela de Categoria: 4 opções fixas
 * (Brás, 25 de Março, Bom Retiro, Outros), funcionamento exclusivo tipo
 * rádio — selecionar uma desmarca a anterior, e clicar na já selecionada
 * desmarca (volta a mostrar tudo). Dado interno/admin, sem tooltip extra
 * pro usuário (Amanda, 18/08/2026).
 *
 * Desktop: 4 botões lado a lado. Mobile: grid 2x2. Largura sempre 100% do
 * grid (sem largura fixa em px) pra bater exatamente com a margem do
 * título e da grade de cards abaixo — Amanda pediu pra alinhar certinho
 * com o resto do conteúdo, 19/08/2026.
 */
export default function NeighborhoodFilter({ value, onChange }: NeighborhoodFilterProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {neighborhoods.map((neighborhood) => {
        const isSelected = value === neighborhood;
        return (
          <button
            key={neighborhood}
            type="button"
            onClick={() => onChange(isSelected ? null : neighborhood)}
            aria-pressed={isSelected}
            className={`flex h-[90px] w-full items-center justify-center rounded-lg p-2 text-center font-display text-[26px] font-bold uppercase tracking-[0.78px] ${
              isSelected
                ? 'border-2 border-main-dark-700 bg-main-dark-400 text-main-dark-900'
                : 'border border-gray-100 bg-main-red-200 text-gray-50'
            }`}
          >
            {neighborhood}
          </button>
        );
      })}
    </div>
  );
}
