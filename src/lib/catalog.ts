import { supabase } from './supabaseClient';
import { WHATSAPP_STORE_CONTACT_MESSAGE } from './constants';
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
// `store_categories(category_id)`: categorias ADICIONAIS (04/09/2026,
// Amanda) vinculadas pela tela Categorias do admin — ver `StoreWithCategory`
// em `types/index.ts` e `CategoriaModal.tsx`.
//
// BUG CRÍTICO corrigido no mesmo dia (04/09/2026): criar a tabela
// `store_categories` (FK pra `stores` E pra `categories`) fez o PostgREST
// passar a enxergar DOIS caminhos de relação entre `stores` e `categories`
// — o FK direto de sempre (`stores.category_id`) e um N:N implícito via
// `store_categories` (é assim que o PostgREST detecta N:N sozinho: 2 FKs
// numa tabela-ponte). Com 2 caminhos possíveis, `categories(name)` sem
// especificar QUAL vira ambíguo — PostgREST devolve 300/PGRST201 e a
// consulta INTEIRA falha (foi o "Não foi possível carregar as lojas"/loja
// e categoria sumindo tanto no admin quanto no catálogo do cliente).
// Correção: `categories!stores_category_id_fkey(name)` — o `!nome_do_fk`
// diz explicitamente "quero o FK direto", nunca o caminho N:N. Precisa do
// mesmo `!` em QUALQUER outro lugar do código que já embede
// `categories(...)` a partir de `stores` (ou `stores(...)` a partir de
// `categories`) — ver também `AdminLojas.tsx` e `AdminCategorias.tsx`.
const STORE_COLUMNS =
  'id, name, category_id, categories!stores_category_id_fkey(name), store_categories(category_id), polo_location, tags, is_active, code_badge, whatsapp, instagram, storefront_image_url, gallery_images, address, working_hours, sizes_available, shipping_info, wholesale_rules, retail_rules, created_at';

interface StoreRow {
  id: number;
  name: string;
  category_id: number | null;
  categories: { name: string } | { name: string }[] | null;
  store_categories: { category_id: number }[] | null;
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
 *
 * 28/09/2026 (Amanda): a conversa agora já abre com uma mensagem pré-pronta
 * digitada (`?text=`, `WHATSAPP_STORE_CONTACT_MESSAGE` em `constants.ts`) —
 * mesmo padrão que o `WHATSAPP_SUPPORT_URL` já usava, só que aqui é genérica
 * pra qualquer loja (não menciona o nome do fornecedor). `encodeURIComponent`
 * garante que acentos/espaços da mensagem virem um `%XX` válido na URL.
 */
export function buildWhatsappUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return undefined;
  const withCountryCode = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(WHATSAPP_STORE_CONTACT_MESSAGE)}`;
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
    facadeImageUrl: row.storefront_image_url ?? null,
    galleryImageUrls: gallery.slice(0, 4),
  };
}

function mapStore(row: StoreRow): StoreWithCategory {
  const gallery = row.gallery_images ?? [];
  return {
    id: String(row.id),
    code: row.code_badge ?? '',
    name: row.name,
    categoryLabel: categoryNameFromRow(row),
    // BUG corrigido em 22/08/2026, reafirmado em 24/08/2026 (Instruções
    // Mudanças App V5.md, item 8): thumbnail do card (StoreCard.tsx, usado
    // em Lojas/Início/Categorias) sempre prioriza a foto 1 da galeria — só
    // cai pra fachada se a loja ainda não tiver nenhuma foto de galeria
    // cadastrada. 24/08/2026: `StoreDetail.tsx` não usa mais esse campo pra
    // "peça em destaque" — aquela seção agora mostra `details.facadeImageUrl`
    // dedicado (ver `mapStoreDetails` acima e item 7), então esse `imageUrl`
    // serve só o card mesmo.
    imageUrl: gallery[0] ?? row.storefront_image_url ?? null,
    categoryId: row.category_id !== null ? String(row.category_id) : '',
    extraCategoryIds: (row.store_categories ?? []).map((sc) => String(sc.category_id)),
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
 * 08/10/2026 (Amanda): "Fornecedor Destaque" da Home. Primeiro tenta achar a
 * loja marcada manualmente no admin (`stores.is_featured`, só 1 por vez —
 * garantido por um trigger no banco, `trg_enforce_single_featured_store`).
 * Se nenhuma estiver marcada ainda, cai no fallback automático combinado
 * originalmente com a Amanda: loja com mais favoritos, empate por mais
 * recente (`created_at`), empate nisso por ordem alfabética.
 *
 * 13/10/2026 (Amanda perguntou o critério do fallback — ao conferir, achei
 * um BUG): a versão antiga contava favoritos lendo a tabela `favorites`
 * direto do cliente (`supabase.from('favorites').select('store_id')`), mas
 * a RLS dela (`favorites_select_own`) só deixa cada usuária enxergar OS
 * PRÓPRIOS favoritos — nunca os de todo mundo. Na prática, cada pessoa via
 * uma "loja com mais favoritos" calculada só em cima do que ELA MESMA
 * favoritou (ou caía direto no desempate por recência/nome, se ela não
 * tivesse favoritado nada ainda) — nunca o total real do app inteiro.
 * Corrigido: a contagem agora roda dentro do banco, numa função
 * `get_most_favorited_store_id()` (SECURITY DEFINER, mesmo padrão de
 * `recompute_weekly_rankings()`) que enxerga a tabela `favorites` inteira,
 * sem passar pela RLS — devolve só o ID da loja vencedora, já com o mesmo
 * critério de empate de sempre.
 */
export async function getFeaturedStore(): Promise<StoreWithCategory | null> {
  const { data: manual, error: manualError } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .eq('is_active', true)
    .eq('is_featured', true)
    .maybeSingle();
  if (manualError) throw manualError;
  if (manual) return mapStore(manual as unknown as StoreRow);

  const { data: fallbackStoreId, error: fallbackError } = await supabase.rpc(
    'get_most_favorited_store_id'
  );
  if (fallbackError) throw fallbackError;
  if (fallbackStoreId == null) return null;

  return getStoreById(String(fallbackStoreId));
}

export interface RankedStore extends StoreWithCategory {
  rank: number;
  viewCount: number;
}

/**
 * Top N do ranking "Mais Procuradas da Semana" — lê direto de
 * `store_weekly_rankings` (resultado já pronto, recalculado a cada 24h por
 * `recompute_weekly_rankings()` via pg_cron), nunca agrega `store_views` na
 * hora. `limit` corta quantas entradas vêm (Home mostra 5, a tela de
 * Ranking completo pede até 10).
 */
export async function getWeeklyRanking(limit = 10): Promise<RankedStore[]> {
  const { data: rankingRows, error: rankingError } = await supabase
    .from('store_weekly_rankings')
    .select('rank, store_id, view_count')
    .order('rank', { ascending: true })
    .limit(limit);
  if (rankingError) throw rankingError;
  if (!rankingRows || rankingRows.length === 0) return [];

  const storeIds = rankingRows.map((r) => r.store_id);
  const { data: storeRows, error: storesError } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .in('id', storeIds)
    .eq('is_active', true);
  if (storesError) throw storesError;

  const storesById = new Map(
    ((storeRows ?? []) as unknown as StoreRow[]).map((row) => [row.id, mapStore(row)])
  );

  return rankingRows
    .map((r) => {
      const store = storesById.get(r.store_id);
      if (!store) return null;
      return { ...store, rank: r.rank, viewCount: r.view_count };
    })
    .filter((s): s is RankedStore => s !== null);
}

/**
 * Registra 1 visita à página da loja (StoreDetail.tsx) — alimenta
 * `store_views`/`store_weekly_rankings`. Conta visitas repetidas da mesma
 * pessoa (não deduplica), por pedido explícito da Amanda. Falha silenciosa:
 * visualizar a loja não pode travar por causa de log (mesmo padrão do
 * logging de busca em `Busca.tsx`). Sem usuário logado, não loga nada.
 */
export function logStoreView(storeId: string, userId?: string | null): void {
  if (!userId) return;
  const numericId = Number(storeId);
  if (!Number.isFinite(numericId)) return;
  supabase
    .from('store_views')
    .insert({ store_id: numericId, user_id: userId })
    .then(() => {
      // Sem tratamento de erro de propósito.
    });
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