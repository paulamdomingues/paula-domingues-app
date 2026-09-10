import { resolveBunnyImageUrl } from '../lib/bunnyStorage';

interface ImagePlaceholderProps {
  /**
   * Caminho/nome do arquivo salvo no Supabase (ex: `storefront_image_url`
   * de uma loja) OU já uma URL completa — os dois formatos funcionam, a
   * resolução pra CDN do Bunny acontece aqui dentro. `null`/`undefined`
   * não renderiza nenhuma foto (ver comentário abaixo).
   */
  src?: string | null;
  alt: string;
  className?: string;
  rounded?: string;
}

/**
 * Espaço reservado para fotos de loja (fachada, galeria, card) que ainda
 * serão cadastradas pelo painel administrativo. Todo `src` passa por
 * `resolveBunnyImageUrl` — assim, quando o Supabase começar a devolver o
 * caminho salvo pelo admin, a imagem já aparece certa sem precisar tocar em
 * cada tela que usa este componente.
 *
 * 10/09/2026 (Amanda, antes do lançamento): enquanto não houver foto, NÃO
 * mostra mais o bloco cinza com borda tracejada + ícone — isso é visível pro
 * cliente final e lia como "erro"/tela quebrada nas lojas sem fachada/fotos
 * cadastradas ainda. Agora mantém um espaço em branco do mesmo tamanho (só
 * pra não colapsar o layout — nos 3 lugares que usam este componente
 * `StoreCard`, carrossel/miniaturas e fachada em `StoreDetail`, esse espaço
 * segura posição de botões sobrepostos como o coração de favoritar e o selo
 * de código), sem nenhum indício visual de "placeholder vazio". Quando a
 * loja tem a foto real cadastrada, continua aparecendo normalmente, sem
 * nenhuma mudança nesse caminho.
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

  return <div aria-hidden="true" className={`${className} ${rounded}`} />;
}
