import { XCircleIcon } from '../icons';

interface DeleteConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modal de confirmação de exclusão do painel admin — genérico, pra
 * reaproveitar em Lojas/Categorias/Stories (mesmo padrão visual dos 3
 * modais "Excluir X?" do Figma). Paleta corrigida a pedido da Amanda
 * (20/08/2026): vermelho é a cor da CLIENTE (StorefrontIcon, marca), erros e
 * ações destrutivas usam a paleta "erro" (laranja) — por isso "Sim,
 * excluir" fica no ERROR preenchido (destaque) e "Cancelar" fica neutro/
 * inline, ao contrário do `LogoutConfirmModal` do app cliente (que é
 * vermelho, não uma ação destrutiva de dado).
 */
export default function DeleteConfirmModal({
  title,
  description,
  confirmLabel = 'Sim, excluir',
  loading = false,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/40 px-6">
      <div className="flex w-full max-w-[420px] flex-col items-end gap-4 rounded-2xl bg-base-white px-8 py-6">
        <button type="button" aria-label="Fechar" onClick={onCancel} className="flex items-center justify-end p-0.5">
          <XCircleIcon className="size-6 text-gray-400" />
        </button>

        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex w-full flex-col gap-2 text-center">
            <h2 className="font-display text-[28px] font-bold tracking-[0.84px] text-main-dark-900">{title}</h2>
            <p className="font-body text-[14px] tracking-[0.7px] text-gray-600">{description}</p>
          </div>

          <div className="flex w-full items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-[46px] flex-1 items-center justify-center rounded-lg border-[1.5px] border-gray-200 font-body font-medium text-[14px] tracking-[0.7px] text-gray-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="flex h-[46px] flex-1 items-center justify-center rounded-lg bg-error-600 font-body font-medium text-[14px] tracking-[0.7px] text-base-white transition-opacity disabled:opacity-60"
            >
              {loading ? 'Excluindo...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
