import { useState, type ReactNode } from 'react';
import { LockIcon, MapPinIcon, PaperPlaneIcon } from './icons';
import { WHATSAPP_SUPPORT_URL } from '../lib/constants';
import PolosInfoModal from './PolosInfoModal';
import PortalExclusivoModal from './PortalExclusivoModal';

interface QuickAccessButtonProps {
  icon: ReactNode;
  label: string;
  bgClassName: string;
  onClick?: () => void;
  href?: string;
}

function QuickAccessButton({ icon, label, bgClassName, onClick, href }: QuickAccessButtonProps) {
  const content = (
    <>
      <span className="flex size-[34px] items-center justify-center rounded-full bg-white/20 text-base-white">
        {icon}
      </span>
      <span className="whitespace-pre-line text-center font-body text-[12px] font-semibold leading-tight text-base-white">
        {label}
      </span>
    </>
  );
  const className = `flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 py-3.5 ${bgClassName}`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

/**
 * 05/09/2026 (Amanda): bloco da Home com os 3 botões — rascunho +/-
 * desenhado primeiro no Figma (page WireFrames, node 1552:7046 "novos
 * ajustes") a partir de uma referência de um app concorrente que a Amanda
 * mandou (banner WhatsApp + 3 botões + "Lojas Recentes"). Adaptado pro
 * nosso contexto:
 *
 * - 06/09/2026: título do bloco trocado de "Acesso Rápido" pra "Atalhos" —
 *   Amanda pediu pra não ficar igual ao termo usado na referência do
 *   concorrente. Nome do arquivo/componente (`AcessoRapidoSection`) ficou
 *   igual por enquanto, é só o texto visível na tela que mudou.
 *
 * - O botão do grupo do WhatsApp da referência virou redundante (a Home já
 *   tem o `WhatsappCommunityButton`/banner), então foi substituído pelo
 *   "Portal Exclusivo" (área de membros paga na Hubla) — ver
 *   `PortalExclusivoModal.tsx`.
 * - "Info do Brás" da referência virou "Info dos Polos", porque a Amanda
 *   trabalha com vários polos (Brás, 25 de Março, Bom Retiro), não só o
 *   Brás — ver `PolosInfoModal.tsx`.
 * - "Suporte Técnico" não abre modal — vai direto pro WhatsApp de suporte,
 *   igual o botão "Falar com o Suporte" da tela de Perfil.
 *
 * Posicionado na Home entre o banner do WhatsApp e "Chegaram Recentemente",
 * mesma ordem da referência (banner → acesso rápido → lista de lojas).
 */
export default function AcessoRapidoSection() {
  const [polosModalOpen, setPolosModalOpen] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);

  return (
    <section className="flex w-full flex-col items-center gap-3">
      <h2 className="w-full font-display font-bold text-[22px] tracking-[0.66px] text-main-dark-900">
        Atalhos
      </h2>
      <div className="flex w-full gap-2.5">
        <QuickAccessButton
          icon={<LockIcon className="size-[18px]" />}
          label={'Portal\nExclusivo'}
          bgClassName="bg-main-dark-700"
          onClick={() => setPortalModalOpen(true)}
        />
        <QuickAccessButton
          icon={<MapPinIcon className="size-[18px]" />}
          label={'Info dos\nPolos'}
          bgClassName="bg-main-red-600"
          onClick={() => setPolosModalOpen(true)}
        />
        <QuickAccessButton
          icon={<PaperPlaneIcon className="size-[18px]" />}
          label={'Suporte\nTécnico'}
          bgClassName="bg-gray-700"
          href={WHATSAPP_SUPPORT_URL}
        />
      </div>

      {polosModalOpen && <PolosInfoModal onClose={() => setPolosModalOpen(false)} />}
      {portalModalOpen && <PortalExclusivoModal onClose={() => setPortalModalOpen(false)} />}
    </section>
  );
}