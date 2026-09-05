import { XCircleIcon } from './icons';

interface PolosInfoModalProps {
  onClose: () => void;
}

interface PoloBlockProps {
  title: string;
  items?: string[];
  placeholder?: string;
}

function PoloBlock({ title, items, placeholder }: PoloBlockProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      <h3 className="w-full font-display font-bold text-[16px] tracking-[1px] text-main-red-700">
        {title.toUpperCase()}
      </h3>
      {placeholder ? (
        <p className="w-full font-body text-[12px] text-gray-400">{placeholder}</p>
      ) : (
        items?.map((item) => (
          <p key={item} className="w-full font-body text-[12px] text-main-dark-900">
            {item}
          </p>
        ))
      )}
    </div>
  );
}

/**
 * 05/09/2026 (Amanda): modal do botão "Info dos Polos" do bloco "Acesso
 * Rápido" (Home) — rascunho aprovado no Figma (node 1552:6932, página
 * WireFrames). Substitui o antigo "Info do Brás" da referência que a
 * Amanda mandou: aqui cobre vários polos (não só o Brás), já que ela
 * trabalha com "vários polos", como ela mesma colocou.
 *
 * Conteúdo do Brás vem direto da referência (concorrente) que ela mandou:
 * Feira da Madrugada, Total Brás, New Mall, Vautier Popular, Vautier
 * Premium. Os horários vieram marcados com "*" porque são estimativa/
 * exemplo — a Amanda ainda precisa confirmar os reais antes de publicar.
 *
 * 25 de Março e Bom Retiro ficam como "a definir" por instrução explícita
 * dela ("pode deixar o 'a definir....' dps ajustamos") — ainda não tem os
 * nomes dos shoppings/galerias nem horários desses 2 polos.
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

        <PoloBlock
          title="Brás"
          items={[
            'Feira da Madrugada — seg-sáb, 20h–06h*',
            'Total Brás — seg-sáb, 07h–19h*',
            'New Mall — seg-sáb, 08h–18h*',
            'Vautier Popular — seg-sáb, 07h–19h*',
            'Vautier Premium — seg-sáb, 08h–18h*',
          ]}
        />
        <p className="w-full font-body text-[10px] text-gray-400">
          *horários de exemplo — confirmar os reais antes de publicar.
        </p>

        <div className="h-px w-full bg-gray-200" />
        <PoloBlock
          title="25 de Março"
          placeholder="Conteúdo a definir (nomes dos shoppings/galerias e horários)."
        />

        <div className="h-px w-full bg-gray-200" />
        <PoloBlock
          title="Bom Retiro"
          placeholder="Conteúdo a definir (nomes dos shoppings/galerias e horários)."
        />
      </div>
    </div>
  );
}
