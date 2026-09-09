import type { ReactNode } from 'react';
import { XCircleIcon } from './icons';

interface PolosInfoModalProps {
  onClose: () => void;
}

function PoloTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="w-full font-display font-bold text-[16px] tracking-[1px] text-main-red-700">
      {children}
    </h3>
  );
}

function PoloLabel({ children }: { children: ReactNode }) {
  return (
    <p className="w-full font-body text-[12px] font-bold text-main-dark-900">{children}</p>
  );
}

function PoloText({ children }: { children: ReactNode }) {
  return <p className="w-full font-body text-[12px] text-main-dark-900">{children}</p>;
}

function PoloList({ items }: { items: string[] }) {
  return (
    <ul className="flex w-full flex-col gap-0.5">
      {items.map((item) => (
        <li key={item} className="w-full font-body text-[12px] text-main-dark-900">
          • {item}
        </li>
      ))}
    </ul>
  );
}

/** Aviso (⚠️) — usa a rampa "error" (a mesma já usada no botão "Cancelar" do
 * LogoutConfirmModal) porque é a única rampa de tom "atenção" que o app já
 * tem — não existe uma rampa "warning"/amber separada no StyleGuide. */
function PoloWarning({ children }: { children: ReactNode }) {
  return <p className="w-full font-body text-[12px] font-bold text-error-700">{children}</p>;
}

function PoloBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <PoloTitle>{title}</PoloTitle>
      {children}
    </div>
  );
}

/**
 * 05/09/2026 (Amanda): modal do botão "Info dos Polos" do bloco "Acesso
 * Rápido" (Home) — rascunho aprovado no Figma (node 1552:6932, página
 * WireFrames). Cobre vários polos (não só o Brás), já que ela trabalha com
 * "vários polos", como ela mesma colocou.
 *
 * 09/09/2026 (Amanda): texto revisado e definitivo pros 3 polos — substitui
 * a lista provisória de horários "*estimativa" do Brás e os dois blocos
 * "conteúdo a definir" (25 de Março e Bom Retiro) que existiam até então.
 * Conteúdo colado literalmente do texto que ela passou, só reorganizado nos
 * componentes de título/parágrafo/lista/aviso acima pra manter a hierarquia
 * visual (⚠️ sempre em destaque, igual já era feito com o "*" do Brás).
 */
export default function PolosInfoModal({ onClose }: PolosInfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/40 px-6">
      <div className="flex max-h-[80vh] w-full max-w-[342px] flex-col gap-4 overflow-y-auto rounded-2xl bg-base-white px-6 py-6 lg:max-w-[480px]">
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="flex items-center justify-end p-0.5"
        >
          <XCircleIcon className="size-6 text-gray-400" />
        </button>

        <div className="flex w-full flex-col gap-1">
          <h2 className="w-full font-display font-bold text-[28px] tracking-[1.4px] text-base-black">
            Polos Namoda
          </h2>
          <p className="w-full font-body text-[13px] text-gray-500">
            Horários e principais endereços dos nossos polos parceiros.
          </p>
        </div>

        <PoloBlock title="📍 Brás — Horários de Funcionamento">
          <PoloLabel>Melhores dias para compras no atacado:</PoloLabel>
          <PoloText>
            Segunda e terça-feira, quando os fornecedores costumam estar mais abastecidos e com
            grades completas.
          </PoloText>
          <PoloLabel>Horários de referência:</PoloLabel>
          <PoloList
            items={[
              'Feira da Madrugada: 00h às 5h30',
              'Caldeirão da Juta: 2h às 10h',
              'Bancas — Vautier, Canindé e região: 2h às 10h',
              'Feira da Manhã: 7h30 às 10h30',
              'Shoppings: em média 6h às 16h',
              'Lojas de rua: em média 7h às 16h',
            ]}
          />
          <PoloWarning>⚠️ Os horários podem variar de acordo com cada fornecedor.</PoloWarning>
        </PoloBlock>

        <div className="h-px w-full bg-gray-200" />
        <PoloBlock title="📍 Bom Retiro - SP">
          <PoloLabel>Funcionamento:</PoloLabel>
          <PoloText>Segunda a sábado, em horário comercial. 8h às 17h</PoloText>
          <PoloWarning>⚠️ Lojas 100% atacado normalmente não abrem aos sábados!</PoloWarning>
          <PoloText>
            Ideal para programar a visita durante o dia e conciliar com as compras nas demais
            regiões do Brás.
          </PoloText>
          <PoloWarning>
            ⚠️ Importante: o horário de funcionamento pode variar entre as lojas de atacado e
            varejo
          </PoloWarning>
        </PoloBlock>

        <div className="h-px w-full bg-gray-200" />
        <PoloBlock title="📍 25 de Março">
          <PoloLabel>Funcionamento geral:</PoloLabel>
          <PoloList
            items={[
              'Segunda a sexta: horário comercial - 8h às 17h',
              'Sábado: horário comercial, geralmente reduzido - 8h às 12h',
              'Domingo: grande parte das lojas não abre',
            ]}
          />
          <PoloWarning>
            ⚠️ Na 25 de Março os horários variam bastante entre lojas, galerias e shoppings,
            principalmente aos sábados.
          </PoloWarning>
        </PoloBlock>
      </div>
    </div>
  );
}
