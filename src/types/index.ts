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
  /** Segunda foto grande (imagem "de destaque" abaixo dos contatos). */
  secondaryImageUrl?: string | null;
  /** Miniaturas do carrossel, além da foto principal. */
  thumbnailImageUrls?: (string | null)[];
}

export interface Store {
  id: string;
  code: string; // ex: "AL-0034"
  name: string;
  categoryLabel: string;
  /** Vem de `stores.storefront_image_url` (Supabase Storage). */
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
 * do mini-player em `HighlightBanner`, ver `StoryPlayerOverlay`). Alimentado
 * pela versão do painel administrativo do app — igual às imagens de
 * loja/categoria, o Supabase deve guardar só o caminho/nome do arquivo de
 * vídeo (resolvido pra URL do Bunny CDN via `resolveBunnyVideoUrl` em
 * `src/lib/bunnyStorage.ts`), nunca a URL inteira.
 */
export interface Story {
  id: string;
  /** Caminho/nome do arquivo de vídeo salvo no Supabase, OU já uma URL completa. `null`/`undefined` mostra um estado neutro em vez de player quebrado. */
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
