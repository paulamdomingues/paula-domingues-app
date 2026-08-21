import { useEffect, useState } from 'react';
import { PiPlus, PiTrash } from 'react-icons/pi';
import { BellIcon } from '../../components/icons';
import CadastrarStoryModal from '../../components/admin/CadastrarStoryModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import StoryPreviewModal from '../../components/admin/StoryPreviewModal';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { deleteBunnyVideo, getBunnyThumbnailUrl } from '../../lib/bunnyStream';

interface StoryRow {
  id: number;
  title: string;
  video_path: string | null;
  created_at: string;
  expires_at: string;
}

/**
 * Vídeos/Stories (Figma: `Stories-full` node 627:9945 / `Stories-empty` node
 * 1160:10874). O primeiro card da grade é sempre o tile "Upload Vídeo" (abre
 * o `CadastrarStoryModal`); os demais são os stories já cadastrados, com
 * hover revelando o ícone de excluir — igual ao padrão já confirmado no
 * card publicado do Figma.
 *
 * 21/08/2026: layout mobile adicionado (Figma node 666:10685 "Stories-full"
 * mobile) — bem diferente do grid de 4 colunas do desktop: no mobile o tile
 * "Upload Vídeo" fica sozinho, em destaque, no topo (largura cheia); abaixo
 * entra a seção "Stories Ativos" com os stories cadastrados numa faixa de
 * scroll horizontal (cards de 269px lado a lado), já que 4 colunas não cabem
 * numa tela de celular. O botão de excluir, que no desktop só aparece no
 * hover do card, vira sempre visível no mobile (sem hover em touch).
 */
export default function AdminStories() {
  const { accessLevel } = useAuth();
  // 20/08/2026 (regra de níveis de acesso revisada pela Amanda): Stories é
  // função exclusiva do Convidado (fora o Master Admin) — Editor perdeu o
  // acesso que tinha antes (ele cuida só de Lojas/Categorias agora), e
  // Convidado passou a poder excluir também, não só subir vídeo.
  const canUpload = accessLevel === 'master_admin' || accessLevel === 'convidado';
  const canDelete = accessLevel === 'master_admin' || accessLevel === 'convidado';

  const [stories, setStories] = useState<StoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [previewStory, setPreviewStory] = useState<StoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  function fetchStories() {
    supabase
      .from('stories')
      .select('id, title, video_path, created_at, expires_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError('Não foi possível carregar os stories.');
          return;
        }
        const rows = data ?? [];
        setStories(rows);
        cleanupExpiredStories(rows);
      });
  }

  /**
   * Limpeza automática (21/08/2026, a pedido da Amanda): toda vez que o
   * painel de Stories é aberto (ou recarregado depois de salvar/excluir),
   * qualquer story já expirado (`expires_at` no passado) é removido de
   * verdade — apaga o vídeo na Bunny e a linha no Supabase, em vez de só
   * ficar marcado como "Expirado" pra sempre. Roda em segundo plano sem
   * travar a tela; se apagar algo, recarrega a lista em seguida.
   *
   * Limitação conhecida: só roda quando alguém abre esse painel — não é um
   * job agendado rodando sozinho no servidor a cada hora. Resolve o
   * problema de acúmulo de armazenamento na prática, mas não é instantâneo
   * no segundo exato em que um story completa 24h.
   */
  async function cleanupExpiredStories(rows: StoryRow[]) {
    const now = Date.now();
    const expired = rows.filter((row) => new Date(row.expires_at).getTime() < now);
    if (expired.length === 0) return;

    let anyDeleted = false;
    for (const row of expired) {
      if (row.video_path) {
        const { error: bunnyError } = await deleteBunnyVideo(row.video_path);
        if (bunnyError) continue; // tenta de novo na próxima vez que o painel abrir
      }
      const { error: deleteRowError } = await supabase.from('stories').delete().eq('id', row.id);
      if (!deleteRowError) anyDeleted = true;
    }

    if (anyDeleted) fetchStories();
  }

  async function handleStorySaved({ title, videoId }: { title: string; videoId: string }) {
    // O vídeo já subiu pra Bunny nesse ponto (o modal só chama isso depois
    // do upload confirmado) — aqui só falta gravar a linha em `stories`.
    const { error: insertError } = await supabase.from('stories').insert({ title, video_path: videoId });
    if (insertError) {
      setError('O vídeo foi enviado, mas não foi possível salvar o story. Tente de novo.');
      return;
    }
    setShowCadastroModal(false);
    fetchStories();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    // Apaga o vídeo na Bunny primeiro — se isso falhar, mantém a linha no
    // Supabase (não desfaz um exclusão parcial) pra dar pra tentar de novo
    // depois, em vez de perder a referência do videoId.
    if (deleteTarget.video_path) {
      const { error: bunnyError } = await deleteBunnyVideo(deleteTarget.video_path);
      if (bunnyError) {
        setDeleting(false);
        setError(`Não foi possível excluir o vídeo na Bunny: ${bunnyError}`);
        return;
      }
    }

    const { error: deleteError } = await supabase.from('stories').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (deleteError) {
      setError('O vídeo já foi excluído da Bunny, mas não foi possível remover o story do banco. Tente excluir de novo.');
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    fetchStories();
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-[26px] font-bold tracking-[0.78px] text-main-dark-900 lg:text-[32px] lg:tracking-[0.96px]">
          Stories
        </h1>
        <BellIcon className="size-6 shrink-0 text-gray-400" />
      </div>

      {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

      {stories === null ? (
        <p className="font-body text-[14px] text-gray-600">Carregando...</p>
      ) : (
        <>
          {/* Desktop: grid de 4 colunas, tile "Upload Vídeo" é o primeiro item. */}
          <div className="hidden w-full grid-cols-4 gap-6 lg:grid">
            <button
              type="button"
              disabled={!canUpload}
              onClick={() => setShowCadastroModal(true)}
              title={canUpload ? undefined : 'Sua conta não tem permissão para subir stories.'}
              className="flex aspect-[269/342] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 disabled:opacity-60"
            >
              <PiPlus className="size-[30px] text-gray-400" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-body text-[15px] font-bold tracking-[0.75px] text-gray-700">Upload Vídeo</span>
                <span className="font-body text-[12px] text-gray-400">Mov, Mp4, etc</span>
              </div>
            </button>

            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                canDelete={canDelete}
                onOpen={() => setPreviewStory(story)}
                onDelete={() => setDeleteTarget(story)}
              />
            ))}
          </div>

          {/* Mobile: tile "Upload Vídeo" em destaque no topo (largura cheia)
              + "Stories Ativos" numa faixa de scroll horizontal abaixo
              (node 666:10685). */}
          <div className="flex w-full flex-col gap-4 lg:hidden">
            <button
              type="button"
              disabled={!canUpload}
              onClick={() => setShowCadastroModal(true)}
              title={canUpload ? undefined : 'Sua conta não tem permissão para subir stories.'}
              className="flex aspect-[269/342] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 disabled:opacity-60"
            >
              <PiPlus className="size-[30px] text-gray-400" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-body text-[15px] font-bold tracking-[0.75px] text-gray-700">Upload Vídeo</span>
                <span className="font-body text-[12px] text-gray-400">Mov, Mp4, etc</span>
              </div>
            </button>

            {stories.length > 0 && (
              <div className="flex flex-col gap-4">
                <p className="font-display text-[26px] font-bold tracking-[0.78px] text-main-dark-900">Stories Ativos</p>
                <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2">
                  {stories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      canDelete={canDelete}
                      onOpen={() => setPreviewStory(story)}
                      onDelete={() => setDeleteTarget(story)}
                      variant="mobile"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {stories !== null && stories.length === 0 && (
        <p className="font-body text-[14px] text-gray-500">Nenhum story publicado ainda.</p>
      )}

      {showCadastroModal && (
        <CadastrarStoryModal onCancel={() => setShowCadastroModal(false)} onSaved={handleStorySaved} />
      )}

      {previewStory && (
        <StoryPreviewModal title={previewStory.title} videoPath={previewStory.video_path} onClose={() => setPreviewStory(null)} />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Excluir Storie?"
          description="Essa ação é irreversível, você não poderá recuperar esse vídeo."
          loading={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function StoryCard({
  story,
  canDelete,
  onOpen,
  onDelete,
  variant = 'desktop',
}: {
  story: StoryRow;
  canDelete: boolean;
  onOpen: () => void;
  onDelete: () => void;
  /** 'mobile' = card da faixa de scroll horizontal (node 666:10775/515:9924),
   * texto embaixo da imagem em vez de sobreposto — ver comentário no topo
   * do arquivo. */
  variant?: 'desktop' | 'mobile';
}) {
  const isExpired = new Date(story.expires_at).getTime() < Date.now();
  // Thumbnail (21/08/2026, a pedido da Amanda): a Bunny Stream já gera uma
  // miniatura sozinha pra todo vídeo — ver `getBunnyThumbnailUrl`.
  const thumbnailUrl = getBunnyThumbnailUrl(story.video_path);

  if (variant === 'mobile') {
    return (
      <div className="flex w-[269px] shrink-0 flex-col overflow-hidden rounded-lg bg-base-white">
        <div className="relative h-[232px] w-full shrink-0">
          <ImagePlaceholder
            src={thumbnailUrl}
            alt={story.title}
            className="absolute inset-0 size-full rounded-tl-lg rounded-tr-lg"
          />
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Abrir ${story.title}`}
            className="absolute inset-0 flex size-full items-center justify-center"
          >
            {isExpired && (
              <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-base-black/50 px-2 py-0.5 font-body text-[11px] text-base-white">
                Expirado
              </span>
            )}
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label={`Excluir ${story.title}`}
              className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-base-black/50 text-base-white"
            >
              <PiTrash className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4 px-4 py-2">
          <div className="flex flex-col gap-0.5">
            <p className="truncate font-display text-[22px] font-bold tracking-[0.66px] text-main-dark-900">{story.title}</p>
            <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">
              {new Date(story.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <p className="whitespace-nowrap font-body text-[12px] tracking-[0.36px] text-gray-500">
            Expira em: {new Date(story.expires_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex aspect-[269/342] flex-col justify-end overflow-hidden rounded-2xl bg-main-dark-100">
      <ImagePlaceholder src={thumbnailUrl} alt={story.title} className="absolute inset-0 size-full rounded-2xl" />
      <button type="button" onClick={onOpen} className="absolute inset-0" aria-label={`Abrir ${story.title}`} />

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

      {isExpired && (
        <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-base-black/50 px-2 py-0.5 font-body text-[11px] text-base-white">
          Expirado
        </span>
      )}

      <div className="pointer-events-none relative z-10 flex flex-col gap-1 bg-gradient-to-t from-base-black/70 to-transparent p-4 pt-10">
        <p className="truncate font-body text-[14px] font-bold tracking-[0.7px] text-base-white">{story.title}</p>
        <p className="font-body text-[11px] tracking-[0.55px] text-base-white/70">
          {new Date(story.created_at).toLocaleDateString('pt-BR')}
        </p>
        <p className="font-body text-[11px] tracking-[0.55px] text-base-white/70">
          Expira em: {new Date(story.expires_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      </div>
    </div>
  );
}
