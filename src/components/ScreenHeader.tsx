import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './icons';
import TopBar from './TopBar';

interface ScreenHeaderProps {
  title: string;
  suffix?: string;
  /**
   * Quando true, mantém o título (e sufixo) centralizados também a partir do
   * breakpoint `lg`. Por padrão o título é centralizado no mobile e alinhado
   * à esquerda no desktop — usado apenas por telas que pedem título sempre
   * centralizado (ex.: Lojas).
   */
  centerTitleOnDesktop?: boolean;
}

/**
 * Cabeçalho compacto reusado nas telas internas (Categoria, Busca, ...):
 * logo pequena + nome do usuário + sino (via <TopBar />), seguido do botão
 * "Voltar" e o título da tela.
 */
export default function ScreenHeader({
  title,
  suffix,
  centerTitleOnDesktop = false,
}: ScreenHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-10">
      <TopBar />

      <div className="flex w-full flex-col gap-4">
        {/* `self-start`: sem isso, o botão herda `align-items: stretch` do
            pai (flex-col sem `items-*` definido) e vira clicável na largura
            inteira da tela no desktop, mesmo com o texto alinhado à
            esquerda — toque acidental em qualquer parte da faixa contava
            como "Voltar". Amanda pegou isso com o inspetor do navegador
            (19/08/2026). */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-fit items-center gap-2 self-start font-body text-[16px] tracking-[0.8px] text-main-red-800 lg:font-display lg:text-[32px] lg:font-bold lg:tracking-[0.96px]"
        >
          <ArrowLeftIcon className="size-4 lg:size-6" />
          Voltar
        </button>
        <div
          className={`flex items-center justify-center gap-3 ${centerTitleOnDesktop ? '' : 'lg:justify-start'}`}
        >
          <h1 className="font-display font-bold text-[26px] tracking-[0.78px] text-gray-900 lg:text-[48px] lg:font-extrabold lg:tracking-[1.44px]">
            {title}
          </h1>
          {suffix && (
            <p className="font-body text-[14px] tracking-[0.7px] text-gray-800 lg:text-[24px]">{suffix}</p>
          )}
        </div>
      </div>
    </div>
  );
}
