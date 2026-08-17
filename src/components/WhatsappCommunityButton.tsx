import { FaWhatsapp } from 'react-icons/fa6';

interface WhatsappCommunityButtonProps {
  href?: string;
}

export default function WhatsappCommunityButton({ href = '#' }: WhatsappCommunityButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center justify-center gap-[9px] rounded-lg bg-[#54fd97] p-4"
    >
      <FaWhatsapp className="size-[28px] text-success-800" />
      <span className="whitespace-nowrap font-body font-bold text-[14px] tracking-[0.7px] text-success-800">
        Comunidade no WhatsApp
      </span>
    </a>
  );
}
