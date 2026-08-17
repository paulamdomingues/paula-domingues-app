import { PiXCircle } from 'react-icons/pi';

interface LogoutConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmação de logout (POP-UP "sure-logout" do Figma). Curiosamente o
 * botão em destaque no design é o "Cancelar" (preenchido), enquanto "Sim,
 * sair" fica no estilo discreto — mantive assim de propósito, é o padrão
 * "opção segura em destaque" para uma ação que não dá pra desfazer fácil.
 */
export default function LogoutConfirmModal({ onCancel, onConfirm }: LogoutConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/40 px-6">
      <div className="flex w-full max-w-[342px] flex-col items-end gap-2 rounded-2xl bg-base-white px-6 py-4">
        <button
          type="button"
          aria-label="Fechar"
          onClick={onCancel}
          className="flex items-center justify-end p-0.5"
        >
          <PiXCircle className="size-5 text-gray-400" />
        </button>

        <div className="flex w-full flex-col items-center gap-7">
          <div className="flex w-full flex-col gap-1">
            <h2 className="w-full font-display font-bold capitalize text-[32px] tracking-[1.6px] text-base-black">
              Sair do aplicativo?
            </h2>
            <p className="w-full font-body text-[15px] tracking-[0.75px] text-gray-500">
              Você precisará fazer login novamente para ver os fornecedores e acessar seus favoritos.
            </p>
          </div>

          <div className="flex w-full items-center gap-4">
            <button
              type="button"
              onClick={onConfirm}
              className="flex h-10 flex-1 items-center justify-center rounded-lg border-[1.5px] border-gray-200 font-body font-medium text-[13px] tracking-[0.65px] text-gray-400"
            >
              Sim, sair
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#D97706] font-body font-medium text-[13px] tracking-[0.65px] text-base-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
