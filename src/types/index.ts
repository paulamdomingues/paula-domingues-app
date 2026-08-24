export interface Category {
  id: string;
  label: string;
  /**
   * Vem de `categories.icon_url` (Supabase Storage, bucket "capas") —
   * já uma URL pública completa, resolvida em `catalog.ts`.
   */
  imageUrl?: string | null;
}

/**
 * Informações extras da página da loja (V2-PAG-FORNECEDOR). Cada campo
 * mapeia 1:1 pra uma coluna de texto livre em `stores` (migração 0001/0002)
 * — o cadastro real no painel admin (`AdminLojaForm`) já trata cada uma
 * dessas seções como um único bloco de texto (não como linhas
 * estruturadas tipo "Seg a Sex / Sábado / Domingo" do protótipo do Figma),
 * então o tipo aqui segue a granularidade real do banco, não a do design.
 */
export interface StoreDetails {
  address?: string;
  sizesLine?: string;
  hours?: string;
  shipping?: string;
  wholesale?: string;
  retail?: string;
  tags?: string[];
  instagramUrl?: string;
  whatsappUrl?: string;
  /**
   * 24/08/2026: renomeado (Instruções Mudanças App V5.md, item 7) —
   * antes a foto da fachada (`secondaryImageUrl`) entrava misturada no
   * carrossel de cima como a foto padrão (posição 0), e o carrossel só
   * mostrava 3 das 4 fotos de galeria (`thumbnailImageUrls`). A Amanda
   * pediu pra inverter: a fachada tem um propósito fixo (mostrar a
   * fachada da loja, upada separadamente no admin) e não deveria
   * "roubar" o lugar da foto 1 no carrossel. Ver `StoreDetail.tsx`.
   */
  /** Foto da fachada (`stores.storefront_image_url`) — seção própria, não entra no carrossel de cima. */
  facadeImageUrl?: string | null;
  /** As 4 fotos do carrossel de cima (`stores.gallery_images`), na ordem cadastrada no admin. */
  galleryImageUrls?: (string | null)[];
}

export interface Store {
  id: string;
  code: string; // ex: "AL-0034"
  name: string;
  categoryLabel: string;
  /**
   * Thumbnail do card. Prioriza a foto 1 da galeria
   * (`stores.gallery_images[0]`) — só cai pra `storefront_image_url`
   * (fachada) se a loja ainda não tiver nenhuma foto de galeria (ver
   * `mapStore`, catalog.ts, e Instruções Mudanças App V5.md item 8).
   */
  imageUrl?: string | null;
  isFavorite?: boolean;
  details?: StoreDetails;
  /**
   * Vem de `stores.created_at`. Usado por `sortStores.ts` pra ordenar
   * "recentes"/"antigos" por data de verdade, em vez de depender da ordem
   * em que o array chegou de quem chamou.
   */
  createdAt?: string;
}

/**
 * `Store` + os 2 campos internos usados só pra filtrar (nunca exibidos pro
 * usuário final): `categoryId` (FK real de `stores.category_id`, como
 * string) e `neighborhood` (`stores.polo_location`). Antes vivia só em
 * `mockData.ts`; virou tipo de verdade porque `catalog.ts` devolve isso
 * pra alimentar os filtros de Categoria/Busca com dado real.
 */
export interface StoreWithCategory extends Store {
  categoryId: string;
  neighborhood: string | null;
}

export interface UserProfile {
  id: string;
  firstName: string;
  email: string;
}

/**
 * Item exibido no player de stories (overlay de tela cheia aberto a partir
 * do mini-player em `HighlightBanner`, ver `StoryPlayerOverlay`). Vem de
 * `listActiveStories` (`src/lib/catalog.ts`), que busca a tabela `stories`
 * do Supabase filtrando pelas que ainda não expiraram (`expires_at`, janela
 * de 24h a partir do cadastro).
 *
 * `linkUrl`/`linkLabel` não têm coluna própria no Supabase ainda — ficam
 * sempre `null` vindos do banco (feature planejada, não implementada; e o
 * CTA que os usaria está desativado por enquanto, ver `STORY_CTA_ENABLED`
 * em `StoryPlayerOverlay.tsx`).
 */
export interface Story {
  id: string;
  /**
   * `videoId` (guid) da Bunny STREAM, salvo em `stories.video_path` — NÃO é
   * um caminho de arquivo na Bunny Storage/CDN (diferente das imagens de
   * loja/categoria). Resolvido pra URL de embed via `getBunnyEmbedUrl`
   * (`src/lib/bunnyStream.ts`). `null`/`undefined` mostra um estado neutro
   * em vez de player quebrado.
   */
  videoUrl?: string | null;
  /**
   * Link opcional associado à mídia (ex: "ver essa loja"/oferta). Quando
   * presente, o player mostra um botão de call-to-action sobre o vídeo que
   * abre esse link numa nova aba ao ser tocado/clicado.
   */
  linkUrl?: string | null;
  /** Texto do botão de call-to-action quando `linkUrl` está preenchido. */
  linkLabel?: string | null;
}
