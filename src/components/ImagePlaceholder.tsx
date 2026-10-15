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
  /**
   * Largura (px) que essa instância realmente ocupa na tela — usada só pra
   * pedir do Supabase uma versão já redimensionada da foto, em vez da foto
   * original inteira (15/10/2026: pedido da Amanda pra carregar mais rápido
   * em conexão fraca, não só economizar espaço no Storage). Opcional: sem
   * informar, usa um tamanho padrão que já é bem mais leve que o original.
   * Só afeta fotos de loja (Supabase); imagens fixas do Bunny (logo,
   * banners) não são tocadas por esse parâmetro.
   */
  width?: number;
}

const SUPABASE_PUBLIC_OBJECT_MARKER = '/storage/v1/object/public/';
const SUPABASE_RENDER_IMAGE_MARKER = '/storage/v1/render/image/public/';
const DEFAULT_TRANSFORM_WIDTH = 960;
const TRANSFORM_QUALITY = 75;

/**
 * Troca a URL pública "crua" do Supabase Storage pelo endpoint de Image
 * Transformation (recurso do plano Pro) — devolve a foto já redimensionada
 * e comprimida sob demanda, sem precisar reprocessar nenhuma das fotos já
 * existentes das 300 lojas. Se a URL não for do Supabase Storage (ex: Bunny,
 * usado pras imagens fixas de marca), devolve sem mexer.
 */
function withResponsiveTransform(url: string, width: number): string {
  if (!url.includes(SUPABASE_PUBLIC_OBJECT_MARKER)) return url;
  const transformed = url.replace(SUPABASE_PUBLIC_OBJECT_MARKER, SUPABASE_RENDER_IMAGE_MARKER);
  const separator = transformed.includes('?') ? '&' : '?';
  return `${transformed}${separator}width=${width}&quality=${TRANSFORM_QUALITY}&resize=cover`;
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
  width,
}: ImagePlaceholderProps) {
  const resolvedSrc = resolveBunnyImageUrl(src);

  if (resolvedSrc) {
    const finalSrc = withResponsiveTransform(resolvedSrc, width ?? DEFAULT_TRANSFORM_WIDTH);
    return (
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        className={`${className} ${rounded} object-cover`}
      />
    );
  }

  return <div aria-hidden="true" className={`${className} ${rounded}`} />;
}
