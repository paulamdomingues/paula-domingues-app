import { supabase } from './supabaseClient';
import type { Category, Story, StoreDetails, StoreWithCategory } from '../types';

/**
 * Camada de leitura de catálogo (categorias + lojas + stories) pro app
 * CLIENTE, direto do Supabase. Substitui `src/data/mockData.ts`.
 *
 * Só devolve lojas com `is_active = true` — é a mesma flag que o painel
 * admin usa pra "ocultar" uma loja do catálogo sem apagar o cadastro.
 */

// Mesma lista de colunas usada no admin (`AdminLojaForm.tsx`) + o nome da
// categoria via join, pra montar `categoryLabel` sem uma segunda consulta.
const STORE_COLUMNS =
  'id, name, category_id, categories(name), polo_location, tags, is_active, code_badge, whatsapp, instagram, storefront_image_url, gallery_images, address, working_hours, sizes_available, shipping_info, wholesale_rules, retail_rules, created_at';

interface StoreRow {
  id: number;
  name: string;
  category_id: number | null;
  categories: { name: string } | { name: string }[] | null;
  polo_location: string | null;
  tags: string[] | null;
  is_active: boolean;
  code_badge: string | null;
  whatsapp: string | null;
  instagram: string | null;
  storefront_image_url: string | null;
  gallery_images: string[] | null;
  address: string | null;
  working_hours: string | null;
  sizes_available: string | null;
  shipping_info: string | null;
  wholesale_rules: string | null;
  retail_rules: string | null;
  created_at: string;
}

interface CategoryRow {
  id: number;
  name: string;
  icon_url: string | null;
}

/**
 * `stores.whatsapp` é só o número cru (ex: "11999999999"), não uma URL —
 * limpa qualquer caractere não-numérico e monta o link `wa.me`. `null`
 * quando não há número cadastrado (o botão de WhatsApp na página da loja já
 * trata `undefined`/`'#'` como "sem ação").
 *
 * BUG corrigido em 21/08/2026: essa função nunca prefixava o código do
 * país (55) — o campo é cadastrado como número local (ver placeholder
 * "11 91234-5678" em `AdminLojaForm.tsx`, sem o 55 na frente), mas o
 * `wa.me` PRECISA do código do país pra montar o link certo. Sem isso, o
 * WhatsApp tenta adivinhar o país/DDD sozinho e manda pro número errado
 * (confirmado com dado real: "(11) 93016-8572" abria um contato completamente
 * diferente). Números locais brasileiros sempre têm 10 (fixo, DDD + 8
 * dígitos) ou 11 (celular, DDD + 9 dígitos) dígitos — só nesses casos falta
 * o 55. Se já vier com 12/13 dígitos, presume que o 55 já está incluso.
 */
export function buildWhatsappUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return undefined;
  const withCountryCode = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountryCode}`;
}

/**
 * `stores.instagram` pode vir como "@loja", "loja" ou já uma URL completa
 * (o campo é texto livre no cadastro) — normaliza pros 3 casos e sempre
 * devolve uma URL `instagram.com/<handle>` (ou a própria URL, se já vier
 * como link de outro formato tipo instagram.com/loja/).
 */
export function buildInstagramUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, '').replace(/^instagram\.com\//i, '');
  if (!handle) return undefined;
  return `https://instagram.com/${handle}`;
}

function categoryNameFromRow(row: StoreRow): string {
  const cat = row.categories;
  if (!cat) return '';
  return Array.isArray(cat) ? (cat[0]?.name ?? '') : cat.name;
}

function mapStoreDetails(row: StoreRow): StoreDetails {
  const gallery = row.gallery_images ?? [];
  return {
    address: row.address ?? undefined,
    sizesLine: row.sizes_available ?? undefined,
    hours: row.working_hours ?? undefined,
    shipping: row.shipping_info ?? undefined,
    wholesale: row.wholesale_rules ?? undefined,
    retail: row.retail_rules ?? undefined,
    tags: row.tags ?? undefined,
    instagramUrl: buildInstagramUrl(row.instagram),
    whatsappUrl: buildWhatsappUrl(row.whatsapp),
    secondaryImageUrl: row.storefront_image_url ?? null,
    thumbnailImageUrls: gallery.slice(0, 3),
  };
}

function mapStore(row: StoreRow): StoreWithCategory {
  const gallery = row.gallery_images ?? [];
  return {
    id: String(row.id),
    code: row.code_badge ?? '',
    name: row.name,
    categoryLabel: categoryNameFromRow(row),
    // BUG corrigido em 22/08/2026: essa "peça em destaque" (StoreDetail.tsx,
    // mais abaixo na página) usava a foto de fachada como primeira opção —
    // como a fachada quase sempre está preenchida, a mesma foto acabava
    // aparecendo duas vezes na tela (uma vez como fachada lá em cima, outra
    // como "peça em destaque" aqui embaixo). Agora prioriza uma foto da
    // galeria (peça/coleção, campo separado da fachada no cadastro) e só
    // cai pra fachada se a loja não tiver nenhuma foto de galeria ainda.
    imageUrl: gallery[0] ?? row.storefront_image_url ?? null,
    categoryId: row.category_id !== null ? String(row.category_id) : '',
    neighborhood: row.polo_location,
    createdAt: row.created_at,
    details: mapStoreDetails(row),
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: String(row.id),
    label: row.name,
    imageUrl: row.icon_url,
  };
}

interface StoryRow {
  id: number;
  video_path: string | null;
}

function mapStory(row: StoryRow): Story {
  return {
    id: String(row.id),
    videoUrl: row.video_path,
    // Sem coluna própria no Supabase ainda — ver comentário em `Story`
    // (`src/types/index.ts`).
    linkUrl: null,
    linkLabel: null,
  };
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('id, name, icon_url').order('name');
  if (error) throw error;
  return ((data ?? []) as CategoryRow[]).map(mapCategory);
}

export async function listStores(): Promise<StoreWithCategory[]> {
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return ((data ?? []) as unknown as StoreRow[]).map(mapStore);
}

export async function listRecentStores(limit = 8): Promise<StoreWithCategory[]> {
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as StoreRow[]).map(mapStore);
}

export async function getStoreById(id: string): Promise<StoreWithCategory | null> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;

  const { data, error } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .eq('id', numericId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapStore(data as unknown as StoreRow);
}

/**
 * Stories ativos (ainda dentro da janela de 24h, `expires_at`) pro player de
 * tela cheia do app cliente (`StoryPlayerOverlay`). Ordena do mais antigo
 * pro mais novo — a ordem "cronológica" de visualização faz mais sentido
 * pro usuário final do que a ordem "mais recente primeiro" usada na lista
 * de gerenciamento do admin (`AdminStories.tsx`).
 */
export async function listActiveStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('id, video_path')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as StoryRow[]).map(mapStory);
}

/**
 * Tenta casar um termo de busca com o nome de uma categoria, pra logar em
 * `search_queries.category_id` quando fizer sentido (ex: buscar "jeans"
 * associa à categoria "Jeans"). Casamento simples por substring — não
 * precisa ser perfeito, é só um dado complementar pro relatório de
 * "Categorias mais buscadas".
 */
export function matchCategoryByTerm(term: string, categories: Category[]): Category | null {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return null;
  return (
    categories.find(
      (c) => c.label.toLowerCase().includes(normalized) || normalized.includes(c.label.toLowerCase())
    ) ?? null
  );
}
