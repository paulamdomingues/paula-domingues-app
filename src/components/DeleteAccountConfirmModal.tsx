import { XCircleIcon } from './icons';

interface DeleteAccountConfirmModalProps {
  loading?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmação de exclusão de conta (Perfil.tsx, 16/10/2026) — ação
 * permanente e irreversível, bem mais séria que o "Sair da Conta"
 * (LogoutConfirmModal). Segue o MESMO padrão de cor já usado no
 * `DeleteConfirmModal` do painel admin: ações destrutivas usam a paleta
 * "error" (âmbar/laranja, ex: error-600/#C56C05) — nunca a paleta
 * `main-red`, que é a cor da marca/cliente, não de erro ou perigo.
 *
 * Por pedido da Amanda: o texto detalha exatamente o que acontece (dados +
 * cache local apagados, login encerrado) e avisa que isso NÃO cancela uma
 * assinatura recorrente — ela é cobrada pela Hubla, um sistema separado.
 */
export default function DeleteAccountConfirmModal({
  loading = false,
  errorMessage,
  onCancel,
  onConfirm,
}: DeleteAccountConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/40 px-6">
      <div className="flex w-full max-w-[342px] flex-col items-end gap-2 rounded-2xl bg-base-white px-6 py-4 lg:max-w-[620px] lg:gap-4 lg:px-10 lg:py-8">
        <button
          type="button"
          aria-label="Fechar"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center justify-end p-0.5 disabled:opacity-40"
        >
          <XCircleIcon className="size-6 text-gray-400 lg:size-[54px]" />
        </button>

        <div className="flex w-full flex-col items-center gap-6 lg:gap-8">
          <div className="flex w-full flex-col gap-2 lg:gap-3">
            <h2 className="w-full font-display font-bold capitalize text-[30px] tracking-[1.5px] text-base-black lg:text-center lg:text-[42px]">
              Excluir sua conta?
            </h2>
            <p className="w-full font-body text-[14px] leading-[1.4] tracking-[0.7px] text-gray-500 lg:text-center lg:text-[18px]">
              Essa ação é <span className="font-semibold text-error-700">permanente e não pode ser desfeita</span>.
              Ao confirmar, vamos apagar seu perfil, seus favoritos e o cache salvo no aparelho — e seu login deixa
              de existir, encerrando o acesso ao catálogo agora mesmo.
            </p>
            <p className="w-full font-body text-[13px] leading-[1.4] tracking-[0.65px] text-gray-500 lg:text-center lg:text-[15px]">
              Isso não cancela sua assinatura. Se você tem um plano recorrente ativo, fale com o nosso suporte pelo
              WhatsApp pra cancelar a cobrança também.
            </p>
          </div>

          {errorMessage && (
            <p className="w-full rounded-lg bg-error-50 px-3 py-2 text-center font-body text-[13px] tracking-[0.65px] text-error-800">
              {errorMessage}
            </p>
          )}

          <div className="flex w-full items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex h-10 flex-1 items-center justify-center rounded-lg border-[1.5px] border-gray-200 font-body font-medium text-[13px] tracking-[0.65px] text-gray-500 transition-opacity disabled:opacity-50 lg:h-[50px] lg:text-[16px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex h-10 flex-1 items-center justify-center rounded-lg bg-error-600 font-body font-medium text-[13px] tracking-[0.65px] text-base-white transition-opacity disabled:opacity-60 lg:h-[50px] lg:text-[16px]"
            >
              {loading ? 'Excluindo...' : 'Sim, excluir conta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
