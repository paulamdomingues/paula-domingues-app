import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { resolveBunnyImageUrl } from './bunnyStorage';
import type { StoreWithCategory } from '../types';

/**
 * Cache local (dados + fotos) dos fornecedores favoritados, pra abrir a
 * página de detalhes do fornecedor mesmo sem internet — 15/10/2026, pedido
 * da Amanda ("quero que a aba favoritos abra mesmo sem internet"), só faz
 * sentido na versão NATIVA do app (Capacitor).
 *
 * Esse arquivo roda no MESMO bundle que o PWA (é o mesmo código-fonte,
 * compartilhado) — mas toda função aqui começa checando `isNativeApp()`, que
 * só dá `true` dentro do app nativo empacotado (Capacitor). No navegador
 * normal (PWA) dá sempre `false`, e cada função vira um no-op silencioso:
 * zero chamada de rede extra, zero gravação, zero mudança de comportamento.
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

const FAVORITES_DIR = 'favoritos-offline';
// Ids das lojas que já têm cache COMPLETO (dados + fotos baixadas).
const FULL_CACHE_INDEX_KEY = 'offline_favorites_full_index';
// Backup leve de TODOS os favoritos (id -> data em que foi favoritado), pra
// `isFavorite`/`favoritedAt` continuarem funcionando offline mesmo pra
// favoritos que a pessoa ainda não abriu (e por isso não têm fotos salvas).
const FAVORITES_IDS_KEY = 'offline_favorites_ids';

const fullStoreKey = (storeId: string) => `offline_favorite_store_${storeId}`;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string; // "data:<mime>;base64,XXXX"
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Baixa uma foto e guarda no armazenamento local do app (pasta privada do
 * app no aparelho, `Directory.Data`), devolvendo uma URL (`capacitor://...`)
 * que já dá pra usar direto num `<img src>` — sem precisar ler o arquivo de
 * novo depois (`Capacitor.convertFileSrc`). Falha de qualquer tipo (sem
 * internet nesse momento, URL inválida, sem espaço) devolve `null` em vez de
 * travar o resto do cache — essa foto só fica indisponível offline.
 */
async function cacheImage(storeId: string, slot: string, url: string): Promise<string | null> {
  try {
    const resolved = resolveBunnyImageUrl(url);
    if (!resolved) return null;
    const response = await fetch(resolved);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const path = `${FAVORITES_DIR}/${storeId}/${slot}.jpg`;
    await Filesystem.writeFile({ path, data: base64, directory: Directory.Data, recursive: true });
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Data });
    return Capacitor.convertFileSrc(uri);
  } catch {
    return null;
  }
}

async function readFullCacheIndex(): Promise<string[]> {
  try {
    const { value } = await Preferences.get({ key: FULL_CACHE_INDEX_KEY });
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

async function writeFullCacheIndex(ids: string[]): Promise<void> {
  try {
    await Preferences.set({ key: FULL_CACHE_INDEX_KEY, value: JSON.stringify(ids) });
  } catch {
    // Melhor esforço.
  }
}

/**
 * Guarda os dados + as fotos (fachada e galeria) de uma loja favoritada, pra
 * dar pra abrir a página de detalhes dela offline depois. Chamada pela
 * página `StoreDetail` toda vez que ela carrega com sucesso (online) e a
 * loja já está favoritada — assim o cache vai sendo preenchido/atualizado
 * naturalmente conforme a pessoa visita suas lojas favoritas.
 *
 * Melhor esforço: se uma foto falhar em baixar, fica só essa de fora (ver
 * `cacheImage`); se o processo inteiro falhar (ex: sem espaço no aparelho),
 * a loja simplesmente não fica disponível offline dessa vez — nunca trava a
 * tela nem afeta o favorito em si, que continua normal online.
 */
export async function cacheFavoriteStore(store: StoreWithCategory): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const details = store.details ?? {};
    const galleryUrls = details.galleryImageUrls ?? [];

    const [facadeImageUrl, galleryImageUrls] = await Promise.all([
      details.facadeImageUrl ? cacheImage(store.id, 'facade', details.facadeImageUrl) : Promise.resolve(null),
      Promise.all(
        galleryUrls.map((url, index) => (url ? cacheImage(store.id, `gallery-${index}`, url) : Promise.resolve(null)))
      ),
    ]);

    const cachedStore: StoreWithCategory = {
      ...store,
      details: { ...details, facadeImageUrl, galleryImageUrls },
    };

    await Preferences.set({
      key: fullStoreKey(store.id),
      value: JSON.stringify({ store: cachedStore, cachedAt: new Date().toISOString() }),
    });

    const index = await readFullCacheIndex();
    if (!index.includes(store.id)) {
      await writeFullCacheIndex([...index, store.id]);
    }
  } catch {
    // Melhor esforço — ver comentário acima.
  }
}

/** Remove o cache completo (dados + fotos) de uma loja — chamado quando ela é desfavoritada, pra não acumular espaço à toa. */
export async function removeCachedFavoriteStore(storeId: string): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await Preferences.remove({ key: fullStoreKey(storeId) });
    const index = await readFullCacheIndex();
    await writeFullCacheIndex(index.filter((id) => id !== storeId));
    await Filesystem.rmdir({ path: `${FAVORITES_DIR}/${storeId}`, directory: Directory.Data, recursive: true });
  } catch {
    // Melhor esforço — se a pasta nem existir (nunca foi cacheada), ignora.
  }
}

export async function getCachedFavoriteStore(storeId: string): Promise<StoreWithCategory | null> {
  if (!isNativeApp()) return null;
  try {
    const { value } = await Preferences.get({ key: fullStoreKey(storeId) });
    if (!value) return null;
    const parsed = JSON.parse(value) as { store: StoreWithCategory };
    return parsed.store;
  } catch {
    return null;
  }
}

/** Todas as lojas favoritadas com cache completo (dados+fotos) — usado pela aba Favoritos quando está sem internet. */
export async function listCachedFavoriteStores(): Promise<StoreWithCategory[]> {
  if (!isNativeApp()) return [];
  const index = await readFullCacheIndex();
  const stores = await Promise.all(index.map((id) => getCachedFavoriteStore(id)));
  return stores.filter((store): store is StoreWithCategory => store !== null);
}

/**
 * Backup leve de quais lojas estão favoritadas (id -> data), separado do
 * cache completo acima — guardado toda vez que a lista real vem do
 * Supabase com sucesso, pra `isFavorite`/`favoritedAt` (`FavoritesContext`)
 * continuarem funcionando offline mesmo sem internet logo na abertura do
 * app.
 */
export async function cacheFavoritesIds(favorites: Map<string, string>): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await Preferences.set({
      key: FAVORITES_IDS_KEY,
      value: JSON.stringify(Object.fromEntries(favorites)),
    });
  } catch {
    // Melhor esforço.
  }
}

export async function getCachedFavoritesIds(): Promise<Map<string, string> | null> {
  if (!isNativeApp()) return null;
  try {
    const { value } = await Preferences.get({ key: FAVORITES_IDS_KEY });
    if (!value) return null;
    return new Map(Object.entries(JSON.parse(value) as Record<string, string>));
  } catch {
    return null;
  }
}

/**
 * Apaga TODO o cache offline de favoritos (índice + cada loja salva + a
 * pasta de fotos no disco do aparelho) — 16/10/2026, chamado por
 * `Perfil.tsx` quando a conta é excluída, pra não deixar nenhum dado
 * pessoal (nome, endereço, fotos de fornecedores favoritados) salvo
 * localmente depois que o login já deixou de existir no Supabase.
 * No PWA é sempre no-op, igual todo o resto deste arquivo.
 */
export async function clearAllOfflineCache(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const index = await readFullCacheIndex();
    await Promise.all(index.map((id) => Preferences.remove({ key: fullStoreKey(id) })));
    await Preferences.remove({ key: FULL_CACHE_INDEX_KEY });
    await Preferences.remove({ key: FAVORITES_IDS_KEY });
    await Filesystem.rmdir({ path: FAVORITES_DIR, directory: Directory.Data, recursive: true });
  } catch {
    // Melhor esforço — se a pasta nem existir (nunca cacheou nada), ignora.
  }
}
