export interface Category {
  id: string;
  label: string;
  /**
   * Preenchido depois via painel admin (Supabase Storage, bucket público
   * "capas"). Aceita tanto uma URL completa quanto só o nome do arquivo —
   * ver comentário em `src/data/mockData.ts` pro padrão exato de URL.
   */
  imageUrl?: string | null;
}

export interface StoreHour {
  label: string;
  value: string;
}

/**
 * Informações extras da página da loja (V2-PAG-FORNECEDOR). Opcional porque
 * ainda só temos esse nível de detalhe para a loja de exemplo vinda do
 * Figma — as demais mostram um texto genérico até o cadastro real.
 */
export interface StoreDetails {
  address?: string;
  sizesLine?: string;
  plusSizeLine?: string;
  hours?: StoreHour[];
  shippingFrom?: string;
  shippingMethods?: string;
  wholesaleOnline?: string;
  wholesaleInPerson?: string;
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
  /** Preenchido depois via painel admin (Supabase Storage). */
  imageUrl?: string | null;
  isFavorite?: boolean;
  details?: StoreDetails;
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
