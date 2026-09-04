import { NEIGHBORHOODS as neighborhoods, type Neighborhood } from '../../lib/neighborhoods';

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
 *
 * 02/09/2026 (Amanda): tamanho base do botão trocado de 90px pra 48px de
 * altura (referência do Figma: 167×48) e paleta trocada — não selecionado
 * vira `main-red-700` sólido, selecionado vira `main-dark-600`, texto
 * branco nos dois estados. A largura continua `w-full` (não fixa em px) de
 * propósito: no mobile de referência (grid-cols-2, gap 16px) isso já
 * resulta em ~167px por botão sozinho, então não precisa hardcodar.
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
            // 05/09/2026 (Amanda, Figma "Sofia Sans Extra Condensed", Bold,
            // 26px, altura de linha 115%, letter-spacing 3%): label subiu de
            // 15px pra 26px e perdeu o uppercase forçado — os nomes (Brás,
            // 25 de Março, Bom Retiro, Outros) aparecem exatamente como
            // cadastrados, sem transformação de caixa. Testado pela Amanda
            // no Figma numa tela de 390px (a base mobile) sem quebrar.
            // No desktop os botões ficam maiores/mais altos (puramente
            // estético, sem valor de referência do Figma pra isso).
            className={`flex h-[48px] w-full items-center justify-center rounded-lg px-2 text-center font-display text-[26px] font-bold leading-[115%] tracking-[0.78px] text-base-white transition-colors lg:h-[64px] lg:px-4 ${
              isSelected ? 'bg-main-dark-600' : 'bg-main-red-700'
            }`}
          >
            {neighborhood}
          </button>
        );
      })}
    </div>
  );
}