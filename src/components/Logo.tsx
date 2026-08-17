import { BUNNY_LOGO_URL } from '../lib/bunnyStorage';

interface LogoProps {
  className?: string;
}

/**
 * Logo oficial da marca, servida direto do Bunny.net (Pull Zone
 * `paula-assets.b-cdn.net`) — não é mais um arquivo local. A largura usa
 * `clamp()` (via classe arbitrária do Tailwind) pra escalar suavemente
 * entre telas pequenas (mobile) e maiores (desktop/admin) sem quebrar o
 * layout; `object-contain` preserva a proporção original da imagem.
 * `className` pode sobrescrever o tamanho quando o local de uso pedir algo
 * mais compacto (ex: cabeçalhos internos) ou maior (telas de auth).
 */
export default function Logo({ className = 'h-auto w-[clamp(120px,24vw,179px)]' }: LogoProps) {
  return (
    <img
      src={BUNNY_LOGO_URL}
      alt="Paula Domingues"
      className={`${className} object-contain`}
      loading="eager"
    />
  );
}
