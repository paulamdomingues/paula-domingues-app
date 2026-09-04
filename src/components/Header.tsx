import { useNavigate } from 'react-router-dom';
import { BellIcon } from './icons';
import Logo from './Logo';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';

/**
 * Header mobile da Início (saudação "Olá, [nome]!" + logo + sino). Achado o bug
 * (Amanda, 19/08/2026): esse sino nunca teve `onClick` — por isso "impossível
 * clicar" a partir da Início — e a bolinha vinha com `hasUnreadNotifications`
 * fixo em `true`, nunca refletindo o que realmente foi lido. Os dois agora
 * usam o `NotificationsContext` de verdade, mesmo estado usado em `/notificacoes`.
 *
 * O nome também não vinha mais de prop fixa (`userFirstName="Amanda"`
 * hardcoded na Início) — agora busca direto do `AuthContext`, então mostra
 * sempre o primeiro nome de quem está logado de verdade (Amanda, 20/08/2026).
 *
 * 05/09/2026 (Amanda): duas mudanças aqui —
 * 1. A logo entrou entre a saudação e o sino. Ela e o sino formam um grupo
 *    (`gap-2` = 8px fixo entre os dois, "acompanha a altura": a logo usa
 *    `h-10` pra bater com a altura da box do sino, largura livre via
 *    `object-contain`); o espaçamento ENTRE esse grupo e o nome continua
 *    automático (`justify-between` no container de fora), deixando o grupo
 *    o mais afastado possível do nome.
 * 2. "Olá," e "{nome}!" estavam desalinhados verticalmente — `items-end`
 *    alinha pela base da CAIXA de cada `<span>`, que difere quando os dois
 *    têm tamanho de fonte diferente (18px vs 26px). Troquei pra
 *    `items-baseline`, que alinha pela linha de base do TEXTO em si — o
 *    alinhamento correto quando se mistura tamanhos de fonte numa mesma linha.
 */
export default function Header() {
  const navigate = useNavigate();
  const { hasUnread } = useNotifications();
  const { firstName } = useAuth();

  return (
    <div className="flex items-center justify-between border-b border-[rgba(169,169,169,0.42)] py-2 w-full">
      <div className="flex items-baseline gap-1">
        <span className="font-display font-semibold text-[18px] tracking-[0.9px] text-gray-900">
          Olá,
        </span>
        <span className="font-display font-bold text-[26px] tracking-[0.78px] text-base-black">
          {firstName} !
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Logo className="h-10 w-auto" />
        <button
          type="button"
          aria-label="Notificações"
          onClick={() => navigate('/notificacoes')}
          className="relative flex size-10 items-center justify-center"
        >
          <span className="relative flex size-6 items-center justify-center">
            <BellIcon className="size-6 text-gray-900" />
            {hasUnread && <span className="absolute right-0 top-0 size-[10px] rounded-full bg-main-red-400" />}
          </span>
        </button>
      </div>
    </div>
  );
}