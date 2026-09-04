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

/**
 * Logo oficial da marca, já hospedada no Bunny.
 * 03/09/2026 (Amanda): logo trocada pela versão nova — arquivo "logo-nova"
 * (.png) substituiu o antigo "logo-paula-app" no Bunny.
 * 05/09/2026 (Amanda: "achei ela borrada em tamanhos maiores"): trocada de
 * novo, agora pra um SVG ("logo.svg") — vetorial, não borra em nenhum
 * tamanho (era o problema real do PNG anterior ao escalar pra 300px+ nas
 * telas de Entrar/Criar Conta). Como é uma constante única usada por
 * `Logo.tsx` em toda tela, a troca aqui já propaga sozinha.
 */
export const BUNNY_LOGO_URL = `${BUNNY_CDN_BASE_URL}logo.svg`;

/**
 * Fotos institucionais reais (Figma, 25/08/2026 — substituem os placeholders
 * de gradiente que existiam em `PreLogin.tsx`/`AuthShowcasePanel.tsx` desde
 * que a Amanda ainda não tinha mandado o link da foto de verdade). Cada uma
 * já vem tratada/recortada do jeito certo pro lugar onde é usada:
 * - As duas de Pré-Login já saem do Figma com o escurecimento aplicado (não
 *   precisa de nenhum overlay extra por cima no código).
 * - A de Login/Criar Conta é a foto "limpa" — o tom vermelho por cima
 *   continua sendo aplicado via CSS em `AuthShowcasePanel.tsx`.
 */
export const BUNNY_PRELOGIN_BG_DESKTOP_URL = `${BUNNY_CDN_BASE_URL}prelogin-bg-desktop.png`;
export const BUNNY_PRELOGIN_BG_MOBILE_URL = `${BUNNY_CDN_BASE_URL}prelogin-bg-mobile.png`;
// 03/09/2026 (Amanda): trocada pela foto nova — arquivo "auth-showcase-2"
// (.png) no Bunny, substituindo "auth-showcase".
export const BUNNY_AUTH_SHOWCASE_URL = `${BUNNY_CDN_BASE_URL}auth-showcase-2.png`;

/**
 * 03/09/2026 (Amanda + Figma node 113:7556): 2 imagens fixas novas da Home.
 * Ambas hospedadas no Bunny, mesmo padrão das outras acima — só sobe o
 * arquivo com esse nome exato e já funciona, sem tocar em código.
 *
 * - `BUNNY_HOME_STORIES_BANNER_URL`: banner que ocupa a LARGURA TOTAL da
 *   tela no mobile (sangra além do padding de 24px do resto da Home) — fica
 *   atrás do mini-player de stories (o "STREAMING..." da referência do
 *   Figma). Proporção de referência: 390×203 (~1.92:1).
 * - `BUNNY_COMMUNITY_BANNER_URL`: substitui o antigo botão verde "Comunidade
 *   no WhatsApp" — agora é um banner-imagem clicável (mesmo link
 *   `WHATSAPP_GROUP_URL`), dentro do conteúdo normal (não sangra a tela).
 *   Proporção de referência: 342×211 (~1.62:1).
 *
 * 04/09/2026: extensão em MAIÚSCULO (`.PNG`) de propósito — é assim que os
 * 2 arquivos foram subidos de verdade no Bunny, e essa URL é case-sensitive
 * (bate exatamente com o nome do arquivo no storage, então "png" minúsculo
 * dava 404 mesmo o arquivo existindo).
 */
export const BUNNY_HOME_STORIES_BANNER_URL = `${BUNNY_CDN_BASE_URL}home-stories-banner.PNG`;
export const BUNNY_COMMUNITY_BANNER_URL = `${BUNNY_CDN_BASE_URL}community-banner.PNG`;

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