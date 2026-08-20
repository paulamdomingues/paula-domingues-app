import { useEffect, useState } from 'react';
import { PiPlus, PiTrash } from 'react-icons/pi';
import { BellIcon } from '../../components/icons';
import CategoriaModal from '../../components/admin/CategoriaModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface CategoryRow {
  id: number;
  name: string;
  icon_url: string | null;
  storeCount: number;
}

/**
 * Categorias (Figma: `Categorias` node 627:10047 / `Categorias-Vazio` node
 * 627:10071). Mesmo padrão de grade dos Stories: primeiro tile "+ Nova
 * Categoria", depois os cards já cadastrados com hover-pra-excluir. Clicar
 * num card (fora do ícone de excluir) abre o mesmo modal em modo edição,
 * já com a busca-e-vínculo de lojas liberada.
 */
export default function AdminCategorias() {
  const { accessLevel } = useAuth();
  const canManage = accessLevel === 'master_admin' || accessLevel === 'editor_conteudo';
  const canDelete = accessLevel === 'master_admin';

  const [categories, setCategories] = useState<CategoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalCategory, setModalCategory] = useState<CategoryRow | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  function fetchCategories() {
    supabase
      .from('categories')
      .select('id, name, icon_url, stores(count)')
      .order('name', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError('Não foi possível carregar as categorias.');
          return;
        }
        setCategories(
          (data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            icon_url: row.icon_url,
            storeCount: Array.isArray(row.stores) ? (row.stores[0]?.count ?? 0) : 0,
          }))
        );
      });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (deleteError) {
      setError('Não foi possível excluir essa categoria.');
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    fetchCategories();
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-[32px] font-bold tracking-[0.96px] text-main-dark-900">Categorias</h1>
        <BellIcon className="size-6 text-gray-400" />
      </div>

      {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

      {categories === null ? (
        <p className="font-body text-[14px] text-gray-600">Carregando...</p>
      ) : (
        <div className="grid w-full grid-cols-4 gap-6">
          <button
            type="button"
            disabled={!canManage}
            onClick={() => setModalCategory(null)}
            title={canManage ? undefined : 'Sua conta não tem permissão para criar categorias.'}
            className="flex aspect-[269/310] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 disabled:opacity-60"
          >
            <PiPlus className="size-[30px] text-gray-400" />
            <span className="font-body text-[15px] font-bold tracking-[0.75px] text-gray-700">Nova Categoria</span>
          </button>

          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              canDelete={canDelete}
              onOpen={() => setModalCategory(category)}
              onDelete={() => setDeleteTarget(category)}
            />
          ))}
        </div>
      )}

      {categories !== null && categories.length === 0 && (
        <p className="font-body text-[14px] text-gray-500">Nenhuma categoria ativa.</p>
      )}

      {modalCategory !== undefined && (
        <CategoriaModal
          category={modalCategory}
          canManage={canManage}
          onCancel={() => setModalCategory(undefined)}
          onSaved={() => {
            setModalCategory(undefined);
            fetchCategories();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Excluir Categoria?"
          description="Essa ação é irreversível, você não poderá recuperar essa categoria."
          loading={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function CategoryCard({
  category,
  canDelete,
  onOpen,
  onDelete,
}: {
  category: CategoryRow;
  canDelete: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative flex aspect-[269/310] flex-col justify-end overflow-hidden rounded-2xl bg-main-dark-100">
      <button type="button" onClick={onOpen} className="absolute inset-0" aria-label={`Editar ${category.name}`} />

      {category.icon_url && (
        <img src={category.icon_url} alt={category.name} className="pointer-events-none absolute inset-0 size-full object-cover" />
      )}

      {canDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-base-black/50 text-base-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <PiTrash className="size-4" />
        </button>
      )}

      <div className="pointer-events-none relative z-10 flex flex-col gap-1 bg-gradient-to-t from-base-black/70 to-transparent p-4 pt-10">
        <p className="truncate font-body text-[15px] font-bold uppercase tracking-[0.75px] text-base-white">{category.name}</p>
        <p className="font-body text-[11px] tracking-[0.55px] text-base-white/70">
          {category.storeCount} {category.storeCount === 1 ? 'loja adicionada' : 'lojas adicionadas'}
        </p>
      </div>
    </div>
  );
}
