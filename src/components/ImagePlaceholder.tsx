import { PiImage } from 'react-icons/pi';
import { resolveBunnyImageUrl } from '../lib/bunnyStorage';

interface ImagePlaceholderProps {
  /**
   * Caminho/nome do arquivo salvo no Supabase (ex: `storefront_image_url`
   * de uma loja) OU já uma URL completa — os dois formatos funcionam, a
   * resolução pra CDN do Bunny acontece aqui dentro. `null`/`undefined`
   * mostra o placeholder neutro.
   */
  src?: string | null;
  alt: string;
  className?: string;
  rounded?: string;
}

/**
 * Espaço reservado para fotos de categoria/loja/produto que ainda serão
 * cadastradas pelo painel administrativo. Todo `src` passa por
 * `resolveBunnyImageUrl` — assim, quando o Supabase começar a devolver o
 * caminho salvo pelo admin, a imagem já aparece certa sem precisar tocar em
 * cada tela que usa este componente. Enquanto não houver imagem, mostra um
 * bloco neutro no lugar, sem depender de nenhuma imagem externa.
 */
export default function ImagePlaceholder({
  src,
  alt,
  className = '',
  rounded = 'rounded-lg',
}: ImagePlaceholderProps) {
  const resolvedSrc = resolveBunnyImageUrl(src);

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        className={`${className} ${rounded} object-cover`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`${className} ${rounded} flex items-center justify-center border border-dashed border-gray-200 bg-white/60 text-gray-200`}
    >
      <PiImage className="size-1/4 min-h-4 min-w-4" />
    </div>
  );
}
