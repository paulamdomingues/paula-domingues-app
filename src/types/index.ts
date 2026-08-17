export interface Category {
  id: string;
  label: string;
  /** Preenchido depois via painel admin (Supabase Storage). */
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
