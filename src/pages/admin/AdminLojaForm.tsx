import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PiPlus, PiTrash, PiUploadSimple, PiX } from 'react-icons/pi';
import AdminSelect from '../../components/admin/AdminSelect';
import {
  ArrowLeftIcon,
  BellIcon,
  ClockIcon,
  InstagramIcon,
  MapPinIcon,
  RulerIcon,
  ShoppingCartIcon,
  TeaBagIcon,
  TruckIcon,
  WhatsappIcon,
} from '../../components/icons';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { generateNextCodeBadge } from '../../lib/codeBadge';
import { uploadStoreImage } from '../../lib/storeImages';
import { NEIGHBORHOODS as neighborhoods } from '../../lib/neighborhoods';

const MAX_GALLERY_IMAGES = 4;
const MAX_TAGS = 5;

interface CategoryOption {
  id: number;
  name: string;
  /** Prefixo de 2 letras do "iD da loja" (ex: "AL"), fixado na criação da
   * categoria — ver `resolveCategoryPrefix` em `lib/codeBadge.ts`. */
  code_prefix: string;
}

interface StoreRow {
  id: number;
  name: string;
  category_id: number | null;
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
  created_at: string | null;
}

interface FormState {
  name: string;
  category_id: number | null;
  polo_location: string;
  tags: string[];
  is_active: boolean;
  code_badge: string;
  whatsapp: string;
  instagram: string;
  storefront_image_url: string | null;
  gallery_images: string[];
  address: string;
  working_hours: string;
  sizes_available: string;
  shipping_info: string;
  wholesale_rules: string;
  retail_rules: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  category_id: null,
  polo_location: '',
  tags: [],
  is_active: false,
  code_badge: '',
  whatsapp: '',
  instagram: '',
  storefront_image_url: null,
  gallery_images: [],
  address: '',
  working_hours: '',
  sizes_available: '',
  shipping_info: '',
  wholesale_rules: '',
  retail_rules: '',
};

function rowToForm(row: StoreRow): FormState {
  return {
    name: row.name,
    category_id: row.category_id,
    polo_location: row.polo_location ?? '',
    tags: row.tags ?? [],
    is_active: row.is_active,
    code_badge: row.code_badge ?? '',
    whatsapp: row.whatsapp ?? '',
    instagram: row.instagram ?? '',
    storefront_image_url: row.storefront_image_url,
    gallery_images: row.gallery_images ?? [],
    address: row.address ?? '',
    working_hours: row.working_hours ?? '',
    sizes_available: row.sizes_available ?? '',
    shipping_info: row.shipping_info ?? '',
    wholesale_rules: row.wholesale_rules ?? '',
    retail_rules: row.retail_rules ?? '',
  };
}

/**
 * Cadastro/Edição de Loja (Figma: `Lojas-cadastro-VAZIO` node 627:10182 e
 * `Lojas-cadastro-PREENCHIDO` node 627:10362 — inspecionados ao vivo em
 * 21/08/2026 pra tirar essa tela do papel).
 *
 * Uma decisão de escopo que vale documentar: no Figma, os cards
 * "Informações Básicas", "Contatos" e "Detalhes Complementares" têm um
 * botão "Editar" próprio (instância "EDIT-TO-SAVE") que só existe na tela
 * PREENCHIDA — ou seja, cada card se edita e salva por conta própria
 * (visualização em texto → clique em Editar → vira formulário → Salvar
 * grava só aquele card), enquanto o cadastro de loja NOVA é um formulário
 * único com um "Salvar" geral no topo. Implementei fiel a essa diferença:
 * `isCreate` decide se o card sempre aparece editável (cadastro) ou se
 * abre/fecha com o toggle (edição). Status, Fachada e Galeria não têm
 * "Editar" no Figma — são sempre "ao vivo" (o próprio toggle/upload já
 * salva na hora, na edição).
 *
 * 21/08/2026: layout mobile adicionado (nodes 666:12265 "VAZIO" e 666:12554
 * "Preenchido") — as 3 colunas viram uma pilha única, na ordem do Figma
 * (Informações Básicas → iD → Fotos → Contatos → Disponibilidade → Foto da
 * Fachada → Detalhes Complementares). O botão de ação do topo (Salvar no
 * cadastro / Excluir na edição) some no mobile e reaparece em largura
 * cheia no fim da página — os dois frames mobile mostram um botão "+
 * Salvar Loja" no rodapé; mantive o MESMO modelo de interação do desktop
 * (cada card salva por conta própria na edição, sem um "Salvar Loja" geral
 * ali) e só troquei esse botão de rodapé pra "Excluir Loja" quando
 * `!isCreate`, já que não vi nenhum outro jeito de excluir uma loja pelo
 * mobile no Figma.
 */
export default function AdminLojaForm() {
  const { storeId } = useParams<{ storeId?: string }>();
  const isCreate = !storeId;
  const navigate = useNavigate();
  const { accessLevel } = useAuth();

  // 21/08/2026 (valores do banco renomeados de verdade, ver `AccessLevel`
  // em AuthContext.tsx): `editor` tem CRUD completo em Lojas; `suporte`
  // cria/edita mas nunca exclui.
  const canManage = accessLevel === 'master_admin' || accessLevel === 'editor' || accessLevel === 'suporte';
  const canDelete = accessLevel === 'master_admin' || accessLevel === 'editor';

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isCreate);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editingBasico, setEditingBasico] = useState(isCreate);
  const [editingContatos, setEditingContatos] = useState(isCreate);
  const [editingComplementares, setEditingComplementares] = useState(isCreate);

  // Chave de pasta pro upload de imagem: o id real (edição) ou um id
  // provisório gerado uma única vez (cadastro), pra dar pra subir foto
  // antes de "Salvar" existir de verdade.
  const tempFolderKeyRef = useRef(crypto.randomUUID());
  const folderKey = storeId ?? tempFolderKeyRef.current;

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('categories')
      .select('id, name, code_prefix')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setCategories(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isCreate || !storeId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('stores')
      .select(
        'id, name, category_id, polo_location, tags, is_active, code_badge, whatsapp, instagram, storefront_image_url, gallery_images, address, working_hours, sizes_available, shipping_info, wholesale_rules, retail_rules, created_at'
      )
      .eq('id', storeId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error || !data) {
          setLoadError('Não foi possível carregar essa loja.');
          return;
        }
        setForm(rowToForm(data as StoreRow));
        setCreatedAt(data.created_at);
      });
    return () => {
      cancelled = true;
    };
  }, [isCreate, storeId]);

  // Prévia do "iD da loja" só no cadastro — na edição o código já existe e
  // fica travado (o plano confirma: "id auto-gerado e travado").
  useEffect(() => {
    if (!isCreate || form.category_id === null) return;
    const category = categories.find((c) => c.id === form.category_id);
    if (!category) return;
    let cancelled = false;
    generateNextCodeBadge(category.code_prefix).then((code) => {
      if (!cancelled) setForm((prev) => ({ ...prev, code_badge: code }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreate, form.category_id, categories]);

  const categoryName = useMemo(
    () => categories.find((c) => c.id === form.category_id)?.name ?? '',
    [categories, form.category_id]
  );

  const categoryPrefix = useMemo(
    () => categories.find((c) => c.id === form.category_id)?.code_prefix ?? '',
    [categories, form.category_id]
  );

  /**
   * Aplica uma alteração local e, fora do cadastro, já grava no Supabase.
   * Devolve `true` em caso de sucesso — os "Salvar" de cada card usam isso
   * pra só fechar o modo de edição quando a gravação realmente funcionou
   * (senão o usuário perderia a edição sem perceber o erro).
   */
  async function persist(patch: Partial<FormState>, dbPatch?: Record<string, unknown>): Promise<boolean> {
    setForm((prev) => ({ ...prev, ...patch }));
    if (isCreate || !storeId) return true;
    const { error } = await supabase
      .from('stores')
      .update(dbPatch ?? patch)
      .eq('id', storeId);
    if (error) {
      setSaveError('Não foi possível salvar essa alteração.');
      return false;
    }
    return true;
  }

  async function handleUpload(file: File, slot: 'fachada' | `galeria-${number}`) {
    setSaveError(null);
    setUploadingSlot(slot);
    try {
      const url = await uploadStoreImage(file, folderKey, slot);
      if (slot === 'fachada') {
        await persist({ storefront_image_url: url });
      } else {
        const index = Number(slot.split('-')[1]);
        const nextGallery = [...form.gallery_images];
        nextGallery[index] = url;
        await persist({ gallery_images: nextGallery });
      }
    } catch {
      setSaveError('Não foi possível enviar a imagem. Tente novamente.');
    } finally {
      setUploadingSlot(null);
    }
  }

  async function handleRemoveGalleryImage(index: number) {
    const nextGallery = form.gallery_images.filter((_, i) => i !== index);
    await persist({ gallery_images: nextGallery });
  }

  function validateBasico(): string | null {
    if (!form.name.trim()) return 'Informe o nome da loja.';
    if (!form.category_id) return 'Escolha a categoria.';
    if (!form.polo_location) return 'Escolha a localização.';
    if (form.tags.length === 0) return 'Insira pelo menos 1 tag (SEO).';
    return null;
  }

  function validateComplementares(): string | null {
    if (!form.address.trim()) return 'Endereço é obrigatório.';
    if (!form.working_hours.trim()) return 'Horário é obrigatório.';
    return null;
  }

  async function handleSaveBasico() {
    const error = validateBasico();
    if (error) {
      setSaveError(error);
      return;
    }
    setSaveError(null);
    const ok = await persist(
      {},
      { name: form.name, category_id: form.category_id, polo_location: form.polo_location, tags: form.tags }
    );
    if (ok) setEditingBasico(false);
  }

  async function handleSaveContatos() {
    setSaveError(null);
    const ok = await persist({}, { whatsapp: form.whatsapp || null, instagram: form.instagram || null });
    if (ok) setEditingContatos(false);
  }

  async function handleSaveComplementares() {
    const error = validateComplementares();
    if (error) {
      setSaveError(error);
      return;
    }
    setSaveError(null);
    const ok = await persist(
      {},
      {
        address: form.address,
        working_hours: form.working_hours,
        sizes_available: form.sizes_available || null,
        shipping_info: form.shipping_info || null,
        wholesale_rules: form.wholesale_rules || null,
        retail_rules: form.retail_rules || null,
      }
    );
    if (ok) setEditingComplementares(false);
  }

  async function handleCreate() {
    const basicoError = validateBasico();
    const complementaresError = validateComplementares();
    if (basicoError || complementaresError) {
      setSaveError(basicoError ?? complementaresError);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const codeBadge = categoryPrefix ? await generateNextCodeBadge(categoryPrefix) : form.code_badge;
      const { data, error } = await supabase
        .from('stores')
        .insert({
          name: form.name,
          category_id: form.category_id,
          polo_location: form.polo_location,
          tags: form.tags,
          is_active: form.is_active,
          code_badge: codeBadge,
          whatsapp: form.whatsapp || null,
          instagram: form.instagram || null,
          storefront_image_url: form.storefront_image_url,
          gallery_images: form.gallery_images,
          address: form.address,
          working_hours: form.working_hours,
          sizes_available: form.sizes_available || null,
          shipping_info: form.shipping_info || null,
          wholesale_rules: form.wholesale_rules || null,
          retail_rules: form.retail_rules || null,
        })
        .select('id')
        .single();

      if (error || !data) {
        setSaveError('Não foi possível salvar a loja. Tente novamente.');
        return;
      }
      navigate(`/admin/lojas/${data.id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!storeId) return;
    setDeleting(true);
    const { error } = await supabase.from('stores').delete().eq('id', storeId);
    setDeleting(false);
    if (error) {
      setSaveError('Não foi possível excluir essa loja.');
      setShowDeleteModal(false);
      return;
    }
    navigate('/admin/lojas', { replace: true });
  }

  if (loading) {
    return <p className="font-body text-[14px] text-gray-600">Carregando...</p>;
  }

  if (loadError) {
    return <p className="font-body text-[14px] text-main-red-800">{loadError}</p>;
  }

  return (
    <div className="flex w-full flex-col gap-6 pb-16">
      <div className="flex flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <Link
            to="/admin/lojas"
            className="flex w-fit items-center gap-2 font-body text-[15px] tracking-[0.75px] text-gray-600"
          >
            <ArrowLeftIcon className="size-[18px]" />
            Voltar para lojas
          </Link>
          <BellIcon className="size-6 shrink-0 text-gray-400 lg:hidden" />
        </div>

        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[26px] font-bold tracking-[0.78px] text-main-dark-900 lg:text-[32px] lg:tracking-[0.96px]">
              {isCreate ? 'Cadastrar nova loja' : form.name || '—'}
            </h1>
            <p className="font-body text-[14px] tracking-[0.7px] text-gray-500">
              {isCreate
                ? 'Preencha os dados abaixo. Dados marcados por *, são obrigatórios'
                : `Cadastrada em: ${formatDate(createdAt)}`}
            </p>
          </div>

          {/* Desktop: botão de ação no topo. No mobile ele reaparece em
              largura cheia no fim da página (ver rodapé mobile abaixo). */}
          {isCreate ? (
            <button
              type="button"
              disabled={saving || !canManage}
              onClick={handleCreate}
              title={canManage ? undefined : 'Sua conta não tem permissão para cadastrar lojas.'}
              className="hidden h-[50px] items-center gap-2 rounded-lg bg-main-red-600 px-6 font-body text-[15px] font-bold tracking-[0.75px] text-base-white transition-opacity disabled:opacity-60 lg:flex"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          ) : (
            canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="hidden h-10 items-center gap-2 rounded-lg bg-error-600 px-4 font-body text-[14px] font-bold tracking-[0.7px] text-base-white lg:flex"
              >
                <PiTrash className="size-4" />
                Excluir Loja
              </button>
            )
          )}
        </div>

        {saveError && <p className="font-body text-[13px] text-main-red-800">{saveError}</p>}
        {!canManage && (
          <p className="font-body text-[13px] text-gray-500">
            Sua conta ({accessLevel ?? '—'}) tem acesso só de leitura a essa tela.
          </p>
        )}
      </div>

      {/* No mobile empilha em coluna única (grid-cols-1) — a ordem segue a
          do código-fonte (Informações Básicas, depois tudo da coluna 2,
          depois tudo da coluna 3), que difere um pouco da ordem exata do
          Figma mobile (lá "Disponibilidade" vem depois de "Contatos", aqui
          vem antes) — simplificação deliberada pra não duplicar todo esse
          formulário em dois blocos JSX separados só por causa da ordem. */}
      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Coluna 1 — Informações Básicas */}
        <SectionCard
          title="Informações Básicas"
          editable={!isCreate}
          isEditing={editingBasico}
          onToggleEdit={() => setEditingBasico((v) => !v)}
          onSave={handleSaveBasico}
        >
          {editingBasico ? (
            <div className="flex flex-col gap-4">
              <TextField label="Nome*" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} maxLength={100} />
              <SelectField
                label="Categoria *"
                value={form.category_id ?? ''}
                onChange={(v) => setForm((p) => ({ ...p, category_id: v ? Number(v) : null }))}
                placeholder="Escolha aqui"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
              <SelectField
                label="Localização *"
                value={form.polo_location}
                onChange={(v) => setForm((p) => ({ ...p, polo_location: v }))}
                placeholder="Escolha aqui"
                options={neighborhoods.map((n) => ({ value: n, label: n }))}
              />
              <TagsField
                label="Tags (SEO)*"
                tags={form.tags}
                onChange={(tags) => setForm((p) => ({ ...p, tags }))}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ReadField label="Nome*" value={form.name} />
              <ReadField label="Categoria *" value={categoryName || '—'} />
              <ReadField label="Localização *" value={form.polo_location || '—'} />
              <div className="flex flex-col gap-1.5">
                <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">Tags (SEO)*</p>
                <div className="flex flex-wrap gap-2">
                  {form.tags.length === 0 && <span className="font-body text-[14px] text-gray-400">—</span>}
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-50 px-3 py-1 font-body text-[13px] tracking-[0.65px] text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Coluna 2 — Disponibilidade / iD / Fotos */}
        <div className="flex flex-col gap-6 rounded-lg bg-base-white p-6">
          <div className="flex flex-col gap-3">
            <p className="font-display text-[18px] font-bold tracking-[0.54px] text-main-dark-900">Disponibilidade</p>
            <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">Status</p>
            <button
              type="button"
              disabled={!canManage}
              onClick={() => persist({ is_active: !form.is_active }, { is_active: !form.is_active })}
              className={`flex w-fit items-center gap-2 rounded-full px-3 py-1.5 font-body text-[13px] font-bold tracking-[0.65px] transition-opacity disabled:opacity-60 ${
                form.is_active ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {form.is_active ? 'ativo' : 'inativo'}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">iD da loja</p>
            <div className="flex h-[50px] items-center rounded-lg border border-gray-200 bg-gray-50 px-4">
              <span className="font-body text-[14px] tracking-[0.7px] text-gray-600">
                {form.code_badge || (isCreate ? 'Escolha a categoria' : '—')}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">Fotos</p>
            <GalleryUpload
              images={form.gallery_images}
              uploadingSlot={uploadingSlot}
              disabled={!canManage}
              onUpload={(file, index) => handleUpload(file, `galeria-${index}`)}
              onRemove={handleRemoveGalleryImage}
            />
            <p className="font-body text-[12px] tracking-[0.6px] text-gray-400">
              envie um arquivo na proporção 1:1 ou 3:4 (quadrada/vertical)
            </p>
          </div>
        </div>

        {/* Coluna 3 — Contatos / Foto da Fachada */}
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Contatos"
            editable={!isCreate}
            isEditing={editingContatos}
            onToggleEdit={() => setEditingContatos((v) => !v)}
            onSave={handleSaveContatos}
          >
            {editingContatos ? (
              <div className="flex flex-col gap-4">
                <TextField
                  label="WhatsApp"
                  value={form.whatsapp}
                  onChange={(v) => setForm((p) => ({ ...p, whatsapp: v }))}
                  icon={<WhatsappIcon className="size-full" />}
                  placeholder="11 91234-5678"
                />
                <TextField
                  label="Instagram"
                  value={form.instagram}
                  onChange={(v) => setForm((p) => ({ ...p, instagram: v }))}
                  icon={<InstagramIcon className="size-full" />}
                  placeholder="usuariodoinstagram"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <ContactReadField icon={<WhatsappIcon className="size-full" />} label="WhatsApp" value={form.whatsapp} />
                <ContactReadField icon={<InstagramIcon className="size-full" />} label="Instagram" value={form.instagram} />
              </div>
            )}
          </SectionCard>

          <div className="flex flex-col gap-3 rounded-lg bg-base-white p-6">
            <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">Foto da Fachada</p>
            <SingleImageUpload
              image={form.storefront_image_url}
              uploading={uploadingSlot === 'fachada'}
              disabled={!canManage}
              onUpload={(file) => handleUpload(file, 'fachada')}
            />
            <p className="font-body text-[12px] tracking-[0.6px] text-gray-400">
              envie um arquivo na proporção 1:1 ou 3:4 (quadrada/vertical)
            </p>
          </div>
        </div>
      </div>

      {/* Detalhes Complementares */}
      <SectionCard
        title="Detalhes Complementares"
        editable={!isCreate}
        isEditing={editingComplementares}
        onToggleEdit={() => setEditingComplementares((v) => !v)}
        onSave={handleSaveComplementares}
      >
        <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
          <ComplementaryField
            icon={<MapPinIcon className="size-full" />}
            label="Endereço*"
            value={form.address}
            editing={editingComplementares}
            onChange={(v) => setForm((p) => ({ ...p, address: v }))}
            placeholder="Insira o endereço completo da loja"
          />
          <ComplementaryField
            icon={<ClockIcon className="size-full" />}
            label="Horário*"
            value={form.working_hours}
            editing={editingComplementares}
            onChange={(v) => setForm((p) => ({ ...p, working_hours: v }))}
            placeholder="Qual horário de funcionamento? Durante a semana e final de semana"
          />
          <ComplementaryField
            icon={<RulerIcon className="size-full" />}
            label="Tamanhos"
            value={form.sizes_available}
            editing={editingComplementares}
            onChange={(v) => setForm((p) => ({ ...p, sizes_available: v }))}
            placeholder="Quais tamanhos a loja trabalha? tem grade plus? tamanho único?"
          />
          <ComplementaryField
            icon={<TruckIcon className="size-full" />}
            label="Envio"
            value={form.shipping_info}
            editing={editingComplementares}
            onChange={(v) => setForm((p) => ({ ...p, shipping_info: v }))}
            placeholder="Quantas peças ou $ pra envio? e quais as formas de envio trabalham?"
          />
          <ComplementaryField
            icon={<ShoppingCartIcon className="size-full" />}
            label="Atacado"
            value={form.wholesale_rules}
            editing={editingComplementares}
            onChange={(v) => setForm((p) => ({ ...p, wholesale_rules: v }))}
            placeholder="Online e presencial, qual mínimo para valor de atacado?"
          />
          <ComplementaryField
            icon={<TeaBagIcon className="size-full" />}
            label="Varejo"
            value={form.retail_rules}
            editing={editingComplementares}
            onChange={(v) => setForm((p) => ({ ...p, retail_rules: v }))}
            placeholder="Trabalham com varejo? presencial apenas?"
          />
        </div>
      </SectionCard>

      {/* Mobile: botão de ação em largura cheia no fim da página (nodes
          666:12265/666:12554 mostram "+ Salvar Loja" no rodapé nos dois
          frames) — mantive o mesmo modelo do desktop (Salvar só no
          cadastro; na edição vira Excluir Loja, já que cada card já salva
          sozinho ali em cima). */}
      {isCreate ? (
        <button
          type="button"
          disabled={saving || !canManage}
          onClick={handleCreate}
          title={canManage ? undefined : 'Sua conta não tem permissão para cadastrar lojas.'}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-lg bg-main-red-600 px-6 font-body text-[15px] font-bold tracking-[0.75px] text-base-white transition-opacity disabled:opacity-60 lg:hidden"
        >
          <PiPlus className="size-4" />
          {saving ? 'Salvando...' : 'Salvar Loja'}
        </button>
      ) : (
        canDelete && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-lg bg-error-600 px-6 font-body text-[15px] font-bold tracking-[0.75px] text-base-white lg:hidden"
          >
            <PiTrash className="size-4" />
            Excluir Loja
          </button>
        )
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          title="Excluir Loja?"
          description={`Essa ação não pode ser desfeita. "${form.name}" será removida permanentemente do catálogo.`}
          loading={deleting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

interface SectionCardProps {
  title: string;
  editable: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  children: ReactNode;
}

function SectionCard({ title, editable, isEditing, onToggleEdit, onSave, children }: SectionCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-[18px] font-bold tracking-[0.54px] text-main-dark-900">{title}</p>
        {editable && (
          <button
            type="button"
            onClick={isEditing ? onSave : onToggleEdit}
            className="font-body text-[13px] font-bold tracking-[0.65px] text-main-red-700"
          >
            {isEditing ? 'Salvar' : 'Editar'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  icon,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">{label}</span>
      <div className="flex h-[50px] items-center gap-2 rounded-lg border border-gray-200 px-4">
        {icon && <span className="size-5 shrink-0 text-gray-500">{icon}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full border-0 bg-transparent font-body text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
    </label>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">{label}</p>
      <p className="font-body text-[14px] tracking-[0.7px] text-gray-900">{value}</p>
    </div>
  );
}

function ContactReadField({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">{label}</p>
      <div className="flex items-center gap-2">
        <span className="size-5 shrink-0 text-gray-500">{icon}</span>
        <p className="font-body text-[14px] tracking-[0.7px] text-gray-900">{value || '—'}</p>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder: string;
  options: Array<{ value: string | number; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">{label}</span>
      <AdminSelect
        value={String(value)}
        onChange={onChange}
        triggerClassName="flex h-[50px] w-full items-center gap-2 rounded-lg border border-gray-200 pl-4 pr-3 font-body text-[14px] text-gray-900 focus:outline-none"
        options={[
          { value: '', label: placeholder },
          ...options.map((opt) => ({ value: String(opt.value), label: opt.label })),
        ]}
      />
    </label>
  );
}

function TagsField({
  label,
  tags,
  onChange,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function addTag() {
    const value = draft.trim();
    if (!value || tags.length >= MAX_TAGS || tags.includes(value)) {
      setDraft('');
      return;
    }
    onChange([...tags, value]);
    setDraft('');
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">{label}</span>
        <span className="font-body text-[12px] text-gray-400">
          {tags.length}/{MAX_TAGS}
        </span>
      </div>
      <div className="flex min-h-[98px] flex-col gap-2 rounded-lg border border-gray-200 p-3">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 font-body text-[13px] tracking-[0.65px] text-gray-700"
            >
              {tag}
              <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}>
                <PiX className="size-3" />
              </button>
            </span>
          ))}
        </div>
        {tags.length < MAX_TAGS && (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder="Use vírgulas para separar as tags (até 5)"
            className="w-full border-0 bg-transparent font-body text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}

function SingleImageUpload({
  image,
  uploading,
  disabled,
  onUpload,
}: {
  image: string | null;
  uploading: boolean;
  disabled: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  }

  return (
    <button
      type="button"
      disabled={disabled || uploading}
      onClick={() => inputRef.current?.click()}
      className="relative flex size-[233px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-gray-50 disabled:opacity-60"
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {image ? (
        <img src={image} alt="Fachada" className="size-full object-cover" />
      ) : (
        <>
          <PiUploadSimple className="size-[30px] text-gray-400" />
          <div className="flex flex-col items-center gap-1">
            <span className="font-body text-[14px] text-gray-600">{uploading ? 'Enviando...' : 'Upload Image'}</span>
            <span className="font-body text-[12px] text-gray-400">JPG, PNG or WebP</span>
          </div>
        </>
      )}
    </button>
  );
}

function GalleryUpload({
  images,
  uploadingSlot,
  disabled,
  onUpload,
  onRemove,
}: {
  images: string[];
  uploadingSlot: string | null;
  disabled: boolean;
  onUpload: (file: File, index: number) => void;
  onRemove: (index: number) => void;
}) {
  // 24/08/2026, pedido da Amanda: volta pra upload de UMA foto de cada vez
  // por slot. O `multiple` (22/08/2026) juntava até 4 uploads concorrentes
  // — cada `handleUpload` lia `form.gallery_images` do fechamento (closure)
  // daquele instante, então quando 2+ terminavam quase juntos, o último a
  // gravar sobrescrevia a galeria só com a SUA própria foto, apagando as
  // dos outros (o "erro" que a Amanda via ao subir 4 de uma vez). Cada
  // slot agora tem seu próprio `<input>` (sem `multiple`), então só existe
  // um upload por vez em cada um.
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function openPicker(index: number) {
    inputRefs.current[index]?.click();
  }

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onUpload(file, index);
  }

  const slots = Array.from({ length: MAX_GALLERY_IMAGES }, (_, i) => images[i] ?? null);

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((image, index) => {
        const slotKey = `galeria-${index}`;
        const isUploading = uploadingSlot === slotKey;
        if (!image && index > images.length) return null; // só mostra o próximo slot vazio, não todos de uma vez
        return (
          <div key={index} className="relative size-[100px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleChange(index, e)}
            />
            {image ? (
              <>
                <img src={image} alt={`Foto ${index + 1}`} className="size-full object-cover" />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-base-black/60 text-base-white"
                  >
                    <PiX className="size-3" />
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                disabled={disabled || isUploading}
                onClick={() => openPicker(index)}
                className="flex size-full flex-col items-center justify-center gap-1 disabled:opacity-60"
              >
                <PiPlus className="size-5 text-gray-400" />
                <span className="font-body text-[10px] text-gray-400">{isUploading ? '...' : 'Adicionar'}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ComplementaryField({
  icon,
  label,
  value,
  editing,
  onChange,
  placeholder,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-gray-100 p-4">
      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-main-red-50 text-main-red-700">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-body text-[13px] font-bold tracking-[0.65px] text-gray-900">{label}</p>
        {editing ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-none border-0 bg-transparent font-body text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        ) : (
          <p className="whitespace-pre-line font-body text-[13px] text-gray-700">{value || '—'}</p>
        )}
      </div>
    </div>
  );
}
