import { HUBLA_PORTAL_URL } from '../lib/constants';
import { XCircleIcon } from './icons';

interface PortalExclusivoModalProps {
  onClose: () => void;
}

/**
 * 05/09/2026 (Amanda): modal do botão "Portal Exclusivo" do bloco "Acesso
 * Rápido" (Home) — rascunho aprovado no Figma (node 1552:6954, página
 * WireFrames). Substitui o antigo botão "Grupo WhatsApp" da referência que
 * ela mandou (redundante, já existe o banner do WhatsApp na Home).
 *
 * "Portal Exclusivo" foi o rótulo que a Amanda escolheu entre as
 * alternativas sugeridas (as outras eram "Portal Hubla", "Portal de
 * Vídeos", "Acesso ao Portal") pra substituir "Vídeos Hubla". O botão leva
 * pra área de membros paga na Hubla, com vídeos mais completos sobre os
 * polos e outras informações.
 *
 * `HUBLA_PORTAL_URL` (ver `lib/constants.ts`) é um link PLACEHOLDER
 * (`areademembros.hubla.com`) — a Amanda pediu explicitamente pra deixar
 * assim por enquanto ("dps vamos trocar tbm"), antes do link real de
 * acesso à área de membros estar pronto.
 */
export default function PortalExclusivoModal({ onClose }: PortalExclusivoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/40 px-6">
      <div className="flex w-full max-w-[342px] flex-col gap-4 rounded-2xl bg-base-white px-6 py-6 lg:max-w-[480px]">
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="flex items-center justify-end p-0.5"
        >
          <XCircleIcon className="size-6 text-gray-400" />
        </button>

        <div className="flex w-full flex-col gap-3">
          <h2 className="w-full font-display font-bold text-[28px] tracking-[1.4px] text-base-black">
            Portal Exclusivo
          </h2>
          <p className="w-full font-body text-[14px] text-gray-500">
            Na área de membros você encontra vídeos mais completos sobre os polos — Brás, 25
            de Março e Bom Retiro —, dicas de compra e outras informações extras.
          </p>
        </div>

        <a
          href={HUBLA_PORTAL_URL}
          target="_blank"
          rel="noreferrer"
          className="flex h-[50px] w-full items-center justify-center rounded-lg bg-main-red-600 font-body text-[15px] font-bold tracking-[0.75px] text-base-white"
        >
          Acessar Portal
        </a>
        <p className="w-full font-body text-[11px] text-gray-400">
          Abre em uma nova aba. Link provisório — será atualizado.
        </p>
      </div>
    </div>
  );
}
