import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { PiMagnifyingGlass, PiUploadSimple, PiX } from 'react-icons/pi';
import { XCircleIcon } from '../icons';
import { supabase } from '../../lib/supabaseClient';
import { generateSlug } from '../../lib/categorySlug';
import { resolveCategoryPrefix } from '../../lib/codeBadge';
import { uploadCategoryImage } from '../../lib/categoryImages';

interface CategoriaModalProps {
  /** `null`/`undefined` = criar categoria nova. Um objeto = editar uma existente. */
  category?: { id: number; name: string; icon_url: string | null } | null;
  /** master_admin/editor/suporte — quem não tem, só visualiza (RLS bloqueia a escrita mesmo assim). */
  canManage: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

interface StoreOption {
  id: number;
  name: string;
  /**
   * true = essa é a categoria RAIZ da loja (`stores.category_id` — a que
   * gera o código/`code_badge`). false = vínculo ADICIONAL, gravado em
   * `store_categories` (tabela N:N, 04/09/2026). Só o vínculo adicional
   * pode ser desfeito por aqui — desvincular a raiz deixaria a loja sem
   * categoria (foi exatamente o bug que corrigimos na "Sn Biju"), então
   * pra trocar a raiz o caminho continua sendo o cadastro da loja
   * (`AdminLojaForm.tsx`).
   */
  isRoot: boolean;
}

/** Resultado da busca "Adicionar Loja" — ainda não vinculada a essa categoria. */
interface SearchStoreOption {
  id: number;
  name: string;
}

/**
 * "Nova Categoria" / edição (Figma: `modal - nova categoria`, node
 * 627:10301). Capa (1:1) + Nome à esquerda; busca-e-vincula lojas à
 * direita ("Adicionar Loja" + chips "Lojas Adicionadas").
 *
 * Decisão de escopo: o Figma mostra a busca de lojas já disponível na
 * criação, mas isso exigiria linkar uma categoria que ainda não existe no
 * banco — não dá. Por isso, no cadastro NOVO essa seção fica escondida
 * (com um aviso), e libera assim que a categoria já existe (reabrindo o
 * mesmo modal pra editar, ao clicar no card). Vincular/desvincular loja é
 * sempre "ao vivo" (grava na hora, não espera o Salvar do modal) — só
 * Nome/Capa dependem do botão Salvar.
 *
 * 04/09/2026 (Amanda: "eu quero que a loja seja encontrada em mais de uma
 * categoria, sem mudar o codigo e sem remover ela da categoria inicial"):
 * antes, "Adicionar Loja" aqui simplesmente SOBRESCREVIA
 * `stores.category_id` — ou seja, "adicionar" na prática MOVIA a loja pra
 * cá e tirava ela de onde estava (e o código mudava junto, já que o
 * `code_badge` é gerado a partir da categoria). Agora vincula em
 * `store_categories` (tabela N:N nova) em vez de tocar em `category_id` —
 * a categoria raiz (e o código) fica intacta, e a loja passa a aparecer
 * nas duas categorias pro cliente final (`CategoryScreen.tsx` já lê os
 * dois). "Lojas Adicionadas" mostra a raiz (sem botão de remover — pra
 * tirar a raiz, editar o cadastro da loja) e os vínculos extras (com botão
 * de remover) juntos, na mesma lista.
 */
export default function CategoriaModal({ category, canManage, onCancel, onSaved }: CategoriaModalProps) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? '');
  const [iconUrl, setIconUrl] = useState<string | null>(category?.icon_url ?? null);
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [linkedStores, setLinkedStores] = useState<StoreOption[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchStoreOption[]>([]);
  const [searching, setSearching] = useState(false);

  const capaInputRef = useRef<HTMLInputElement>(null);
  const folderKeyRef = useRef(String(category?.id ?? crypto.randomUUID()));
  // Espelha `linkedStores` num ref só pra ler o valor mais recente dentro do
  // debounce da busca (abaixo) sem precisar colocar `linkedStores` nas deps
  // do efeito — isso re-disparava a busca (e cancelava o que a pessoa tava
  // digitando) toda vez que uma loja era vinculada/desvinculada.
  const linkedStoresRef = useRef<StoreOption[]>([]);
  useEffect(() => {
    linkedStoresRef.current = linkedStores;
  }, [linkedStores]);

  useEffect(() => {
    if (!category) return;
    // Junta a categoria RAIZ (`stores.category_id`) com os vínculos
    // ADICIONAIS (`store_categories`, N:N) numa lista só — a raiz nunca
    // deveria aparecer duplicada como vínculo extra, mas o `!rootIds.has`
    // protege mesmo assim (ex: se um dia a raiz mudar pra uma categoria que
    // já tinha um vínculo extra igual).
    Promise.all([
      supabase.from('stores').select('id, name').eq('category_id', category.id).order('name', { ascending: true }),
      supabase.from('store_categories').select('stores(id, name)').eq('category_id', category.id),
    ]).then(([rootRes, extraRes]) => {
      const rootStores: StoreOption[] = (rootRes.data ?? []).map((s) => ({ ...s, isRoot: true }));
      const rootIds = new Set(rootStores.map((s) => s.id));
      const extraStores: StoreOption[] = (extraRes.data ?? [])
        .flatMap((row) => (Array.isArray(row.stores) ? row.stores : row.stores ? [row.stores] : []))
        .filter((s) => !rootIds.has(s.id))
        .map((s) => ({ ...s, isRoot: false }));
      setLinkedStores([...rootStores, ...extraStores].sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, [category]);

  useEffect(() => {
    if (!isEdit || !search.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timeout = setTimeout(() => {
      supabase
        .from('stores')
        .select('id, name')
        .ilike('name', `%${search.trim()}%`)
        .limit(12)
        .then(({ data }) => {
          if (cancelled) return;
          setSearching(false);
          // Some as já vinculadas (raiz OU extra) da lista de resultados —
          // adicionar de novo seria um no-op confuso.
          const linkedIds = new Set(linkedStoresRef.current.map((s) => s.id));
          setSearchResults((data ?? []).filter((s) => !linkedIds.has(s.id)).slice(0, 6));
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isEdit]);

  async function handleCapaChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCapa(true);
    setError(null);
    try {
      const url = await uploadCategoryImage(file, folderKeyRef.current);
      setIconUrl(url);
    } catch {
      setError('Não foi possível enviar a capa.');
    } finally {
      setUploadingCapa(false);
      e.target.value = '';
    }
  }

  async function handleAddStore(store: SearchStoreOption) {
    setError(null);
    // Vínculo ADICIONAL (`store_categories`) — nunca toca em
    // `stores.category_id`, então a categoria raiz e o código continuam os
    // mesmos e a loja não sai de onde já estava.
    const { error: insertError } = await supabase
      .from('store_categories')
      .insert({ store_id: store.id, category_id: category!.id });
    if (insertError) {
      setError('Não foi possível vincular essa loja.');
      return;
    }
    setLinkedStores((prev) => [...prev, { ...store, isRoot: false }].sort((a, b) => a.name.localeCompare(b.name)));
    setSearchResults((prev) => prev.filter((s) => s.id !== store.id));
  }

  async function handleRemoveStore(store: StoreOption) {
    // A raiz não pode ser removida por aqui (ver doc-comment de `StoreOption`
    // acima) — os botões de remover já não aparecem pra ela na UI, isso é
    // só uma segunda trava.
    if (store.isRoot) return;
    setError(null);
    const { error: deleteError } = await supabase
      .from('store_categories')
      .delete()
      .eq('store_id', store.id)
      .eq('category_id', category!.id);
    if (deleteError) {
      setError('Não foi possível desvincular essa loja.');
      return;
    }
    setLinkedStores((prev) => prev.filter((s) => s.id !== store.id));
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Informe o nome da categoria.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (isEdit) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ name: name.trim(), icon_url: iconUrl })
          .eq('id', category!.id);
        if (updateError) {
          setError('Não foi possível salvar as alterações.');
          return;
        }
      } else {
        // 21/08/2026: o prefixo de 2 letras do "iD da loja" é decidido
        // AGORA, uma vez só, e fica gravado pra sempre em `code_prefix` —
        // por isso busca todos os prefixos já em uso antes de resolver um
        // novo, garantindo que a categoria nova nunca repita o de outra já
        // existente (ver doc de `resolveCategoryPrefix` em `codeBadge.ts`).
        const { data: existing, error: fetchError } = await supabase.from('categories').select('code_prefix');
        if (fetchError) {
          setError('Não foi possível criar a categoria.');
          return;
        }
        const usedPrefixes = (existing ?? []).map((c) => c.code_prefix).filter(Boolean) as string[];
        const codePrefix = resolveCategoryPrefix(name, usedPrefixes);

        const { error: insertError } = await supabase
          .from('categories')
          .insert({ name: name.trim(), slug: generateSlug(name), icon_url: iconUrl, code_prefix: codePrefix });
        if (insertError) {
          setError('Não foi possível criar a categoria.');
          return;
        }
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/40 px-6">
      <div className="flex w-full max-w-[878px] flex-col gap-6 rounded-2xl bg-base-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] font-bold tracking-[0.6px] text-main-dark-900">
            {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button type="button" aria-label="Fechar" onClick={onCancel}>
            <XCircleIcon className="size-6 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">
                envie um arquivo na proporção 1:1 (quadrada)
              </p>
              <input ref={capaInputRef} type="file" accept="image/*" className="hidden" onChange={handleCapaChange} />
              <button
                type="button"
                disabled={uploadingCapa || !canManage}
                onClick={() => capaInputRef.current?.click()}
                className="relative flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-gray-50 disabled:opacity-60"
              >
                {iconUrl ? (
                  <img src={iconUrl} alt="Capa da categoria" className="size-full object-cover" />
                ) : (
                  <>
                    <PiUploadSimple className="size-[30px] text-gray-400" />
                    <span className="font-body text-[14px] text-gray-600">
                      {uploadingCapa ? 'Enviando...' : 'Insira a foto de capa'}
                    </span>
                  </>
                )}
              </button>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">Nome da Categoria</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Categoria da loja"
                disabled={!canManage}
                className="flex h-[50px] w-full items-center rounded-lg border border-gray-200 px-4 font-body text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-60"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4">
            {isEdit ? (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">Adicionar Loja</span>
                  <div className="flex h-[50px] items-center gap-2 rounded-lg border border-gray-200 px-4">
                    <PiMagnifyingGlass className="size-4 shrink-0 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Pesquise uma loja"
                      className="w-full border-0 bg-transparent font-body text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                </label>

                {search.trim() && (
                  <div className="flex flex-col gap-1 rounded-lg border border-gray-100 p-2">
                    {searching && <p className="px-2 font-body text-[13px] text-gray-400">Buscando...</p>}
                    {!searching && searchResults.length === 0 && (
                      <p className="px-2 font-body text-[13px] text-gray-400">Nenhuma loja encontrada.</p>
                    )}
                    {searchResults.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        disabled={!canManage}
                        onClick={() => handleAddStore(store)}
                        className="flex items-center justify-between rounded-lg px-2 py-2 text-left font-body text-[14px] text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {store.name}
                        <span className="font-body text-[12px] text-main-red-700">+ adicionar</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-2 rounded-lg border border-gray-100 p-4">
                  <p className="font-body text-[13px] font-bold tracking-[0.65px] text-gray-700">Lojas Adicionadas</p>
                  {linkedStores.length === 0 ? (
                    <p className="font-body text-[13px] text-gray-400">Nenhuma adicionada</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {linkedStores.map((store) => (
                        <span
                          key={store.id}
                          title={store.isRoot ? 'Categoria principal desta loja — para trocar, edite o cadastro dela.' : undefined}
                          className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 font-body text-[13px] text-gray-700"
                        >
                          {store.name}
                          {store.isRoot ? (
                            <span className="font-body text-[11px] text-gray-400">principal</span>
                          ) : (
                            canManage && (
                              <button type="button" onClick={() => handleRemoveStore(store)} aria-label={`Remover ${store.name}`}>
                                <PiX className="size-3" />
                              </button>
                            )
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
                <p className="font-body text-[13px] text-gray-400">
                  Salve a categoria primeiro — depois é só reabrir pra vincular lojas existentes a ela.
                </p>
              </div>
            )}
          </div>
        </div>

        {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}
        {!canManage && (
          <p className="font-body text-[13px] text-gray-500">Sua conta tem acesso só de leitura a essa tela.</p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-[50px] flex-1 items-center justify-center rounded-lg border-[1.5px] border-gray-200 font-body text-[15px] font-bold tracking-[0.75px] text-gray-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || !canManage}
            onClick={handleSave}
            className="flex h-[50px] flex-1 items-center justify-center rounded-lg bg-main-red-600 font-body text-[15px] font-bold tracking-[0.75px] text-base-white transition-opacity disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}