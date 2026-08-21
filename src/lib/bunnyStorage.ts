/**
 * Integração com o Bunny.net (Storage + CDN) usada pra exibir as imagens
 * cadastradas pelo painel admin. O Supabase (tabela `stores`) guarda só o
 * nome/caminho do arquivo — nunca a URL inteira — então toda exibição de
 * imagem precisa passar por aqui pra virar uma URL de verdade.
 *
 * O UPLOAD em si (mandar o arquivo pro Bunny) fica numa Supabase Edge
 * Function, pra chave de API do Bunny nunca ficar exposta no navegador.
 * Este arquivo cuida só do lado de LEITURA/EXIBIÇÃO.
 */

/** Pull Zone (CDN) oficial do Bunny.net do projeto. Sempre termina com "/". */
export const BUNNY_CDN_BASE_URL = 'https://paula-assets.b-cdn.net/';

/** Logo oficial da marca, já hospedada no Bunny. */
export const BUNNY_LOGO_URL = `${BUNNY_CDN_BASE_URL}logo-paula-app.png`;

/**
 * Resolve um caminho de imagem salvo no Supabase (ex: `storefront_image_url`
 * de uma loja, algo como "al-0034-fachada.jpg") pra URL pública da CDN do
 * Bunny. Também aceita:
 * - `null`/`undefined`/string vazia → devolve `null` (deixa o
 *   `ImagePlaceholder` mostrar o estado neutro de "sem foto ainda").
 * - uma URL já absoluta (http/https) → devolve como está, sem concatenar de
 *   novo — protege contra dado antigo/errado que já venha com URL completa.
 */
export function resolveBunnyImageUrl(path?: string | null): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const cleanPath = trimmed.replace(/^\/+/, '');
  return `${BUNNY_CDN_BASE_URL}${cleanPath}`;
}

/**
 * Mesma resolução, só que pra uma lista de caminhos — usado na galeria de
 * fotos da loja (`gallery_images`, array de até 4 posições no Supabase).
 * Descarta entradas nulas/vazias.
 */
export function resolveBunnyImageUrls(paths?: (string | null)[] | null): string[] {
  if (!paths) return [];
  return paths
    .map((path) => resolveBunnyImageUrl(path))
    .filter((url): url is string => Boolean(url));
}
