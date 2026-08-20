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
}

/**
 * "Nova Categoria" / edição (Figma: `modal - nova categoria`, node
 * 627:10301). Capa (1:1) + Nome à esquerda; busca-e-vincula lojas à
 * direita ("Adicionar Loja" + chips "Lojas Adicionadas").
 *
 * Decisão de escopo: o Figma mostra a busca de lojas já disponível na
 * criação, mas isso exigiria linkar `stores.category_id` a uma categoria
 * que ainda não existe no banco — não dá. Por isso, no cadastro NOVO essa
 * seção fica escondida (com um aviso), e libera assim que a categoria já
 * existe (reabrindo o mesmo modal pra editar, ao clicar no card). Vincular/
 * desvincular loja é sempre "ao vivo" (grava na hora, não espera o Salvar
 * do modal) — só Nome/Capa dependem do botão Salvar.
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
  const [searchResults, setSearchResults] = useState<StoreOption[]>([]);
  const [searching, setSearching] = useState(false);

  const capaInputRef = useRef<HTMLInputElement>(null);
  const folderKeyRef = useRef(String(category?.id ?? crypto.randomUUID()));

  useEffect(() => {
    if (!category) return;
    supabase
      .from('stores')
      .select('id, name')
      .eq('category_id', category.id)
      .order('name', { ascending: true })
      .then(({ data }) => setLinkedStores(data ?? []));
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
        .neq('category_id', category!.id)
        .limit(6)
        .then(({ data }) => {
          if (cancelled) return;
          setSearching(false);
          setSearchResults(data ?? []);
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

  async function handleAddStore(store: StoreOption) {
    const { error: updateError } = await supabase
      .from('stores')
      .update({ category_id: category!.id })
      .eq('id', store.id);
    if (updateError) {
      setError('Não foi possível vincular essa loja.');
      return;
    }
    setLinkedStores((prev) => [...prev, store].sort((a, b) => a.name.localeCompare(b.name)));
    setSearchResults((prev) => prev.filter((s) => s.id !== store.id));
  }

  async function handleRemoveStore(store: StoreOption) {
    const { error: updateError } = await supabase.from('stores').update({ category_id: null }).eq('id', store.id);
    if (updateError) {
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
              <input ref={capaInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCapaChange} />
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
                          className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 font-body text-[13px] text-gray-700"
                        >
                          {store.name}
                          {canManage && (
                            <button type="button" onClick={() => handleRemoveStore(store)} aria-label={`Remover ${store.name}`}>
                              <PiX className="size-3" />
                            </button>
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
