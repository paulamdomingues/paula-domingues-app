import { useNavigate } from 'react-router-dom';
import { PiArrowLeft } from 'react-icons/pi';
import TopBar from './TopBar';

interface ScreenHeaderProps {
  title: string;
  suffix?: string;
  userFirstName?: string;
}

/**
 * Cabeçalho compacto reusado nas telas internas (Categoria, Busca, ...):
 * logo pequena + nome do usuário + sino (via <TopBar />), seguido do botão
 * "Voltar" e o título da tela.
 */
export default function ScreenHeader({ title, suffix, userFirstName = 'Amanda' }: ScreenHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex w-full flex-col gap-4">
      <TopBar userFirstName={userFirstName} />

      <div className="flex w-full flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-body text-[16px] tracking-[0.8px] text-main-red-800"
        >
          <PiArrowLeft className="size-4" />
          Voltar
        </button>
        <div className="flex items-center justify-center gap-3">
          <h1 className="font-display font-bold text-[26px] tracking-[0.78px] text-gray-900">{title}</h1>
          {suffix && <p className="font-body text-[14px] tracking-[0.7px] text-gray-800">{suffix}</p>}
        </div>
      </div>
    </div>
  );
}
