import { BUNNY_COMMUNITY_BANNER_URL } from '../lib/bunnyStorage';

interface WhatsappCommunityButtonProps {
  href?: string;
}

/**
 * 03/09/2026 (Amanda, Figma node 113:7556): o botão verde "Comunidade no
 * WhatsApp" virou um banner-imagem (arquivo fixo no Bunny,
 * `BUNNY_COMMUNITY_BANNER_URL` — ver `bunnyStorage.ts`) — o texto/arte já
 * vêm prontos na própria imagem, então não sobrou nenhum texto/ícone vivo
 * aqui. Continua um link pro mesmo grupo (`href`/`WHATSAPP_GROUP_URL`,
 * passado pela Home). Proporção de referência do Figma: 342×211.
 */
export default function WhatsappCommunityButton({ href = '#' }: WhatsappCommunityButtonProps) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block w-full">
      <img
        src={BUNNY_COMMUNITY_BANNER_URL}
        alt="Comunidade no WhatsApp"
        className="aspect-[342/211] w-full rounded-2xl object-cover"
      />
    </a>
  );
}