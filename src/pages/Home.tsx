import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import TopBar from '../components/TopBar';
import HighlightBanner from '../components/HighlightBanner';
import ImagePlaceholder from '../components/ImagePlaceholder';
import { ArrowLeftIcon } from '../components/icons';
import WhatsappCommunityButton from '../components/WhatsappCommunityButton';
import AcessoRapidoSection from '../components/AcessoRapidoSection';
import CategoryGrid from '../components/CategoryGrid';
import StoreCard from '../components/StoreCard';
import RankedStoreCard from '../components/RankedStoreCard';
import StoryPlayerOverlay from '../components/StoryPlayerOverlay';
import Toast from '../components/Toast';
import {
  getFeaturedStore,
  getWeeklyRanking,
  listActiveStories,
  listCategories,
  listRecentStores,
  type RankedStore,
} from '../lib/catalog';
import { useFavorites } from '../context/FavoritesContext';
import { getBunnyThumbnailUrl } from '../lib/bunnyStream';
import { WHATSAPP_GROUP_URL } from '../lib/constants';
import type { Category, Story, StoreWithCategory } from '../types';

/** Quantas lojas do ranking semanal aparecem na prévia da Home (Figma node
 * 1815:5840: 5 cards + o card "Ver ranking completo"). A tela cheia
 * (`Ranking.tsx`) mostra até 10. */
const WEEKLY_RANKING_PREVIEW_SIZE = 5;

/** Mensagem do toast de "sem stories" — ver `handleOpenStoryPlayer` abaixo. */
const NO_STORIES_MESSAGE = 'Não há vídeos disponíveis no momento.';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [storyPlayerOpen, setStoryPlayerOpen] = useState(false);
  const [openStoryIndex, setOpenStoryIndex] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentStores, setRecentStores] = useState<StoreWithCategory[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [featuredStore, setFeaturedStore] = useState<StoreWithCategory | null>(null);
  const [weeklyRanking, setWeeklyRanking] = useState<RankedStore[]>([]);
  // Toast de "sem stories" (21/08/2026, a pedido da Amanda): o mini-player
  // continua sempre visível na Home (ver `HighlightBanner` abaixo) mesmo sem
  // nenhum story ativo no momento — em vez de simplesmente não responder ao
  // toque (o que parece um botão travado), avisa o motivo. `id` incrementado
  // a cada clique reinicia a animação do `Toast` em cliques repetidos
  // seguidos, mesmo com a mesma mensagem (mesmo padrão de
  // `AdminMobileNav.tsx`/`AdminSidebar.tsx` pro toast de permissão negada).
  const [noStoriesToast, setNoStoriesToast] = useState<{ id: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCategories(), listRecentStores(8), listActiveStories()])
      .then(([categoriesData, recentStoresData, storiesData]) => {
        if (cancelled) return;
        setCategories(categoriesData);
        setRecentStores(recentStoresData);
        setStories(storiesData);
      })
      .catch(() => {
        // Falha silenciosa: as seções ficam vazias em vez de quebrar a Home.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 08/10/2026 (Amanda): as 2 seções novas (Fornecedor Destaque + Mais
  // Procuradas da Semana) — buscadas à parte do efeito acima pra uma falha
  // aqui não derrubar categorias/stories nem vice-versa. Se não houver
  // nenhuma loja em destaque nem nenhuma visualização ainda (semana sem
  // dado), as seções simplesmente não aparecem (ver JSX abaixo) em vez de
  // mostrar um estado vazio/placeholder.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getFeaturedStore(), getWeeklyRanking(WEEKLY_RANKING_PREVIEW_SIZE)])
      .then(([featured, ranking]) => {
        if (cancelled) return;
        setFeaturedStore(featured);
        setWeeklyRanking(ranking);
      })
      .catch(() => {
        // Falha silenciosa, mesmo padrão do efeito acima.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 11/09/2026 (Amanda): clique em notificação de "story novo" (ver
  // `Notificacoes.tsx`) chega aqui via `navigate('/', { state: {
  // openStoryId } })` — assim que os stories carregam, acha o índice
  // correspondente e força a abertura do player nesse story específico
  // (em vez de só cair na Início, o que pareceria erro/clique sem
  // efeito). Se o story não for encontrado (ex: expirou), ignora
  // silenciosamente e a Home segue normal. O estado de navegação é
  // consumido (substituído por `null`) logo em seguida pra não reabrir o
  // player num back/refresh.
  useEffect(() => {
    const openStoryId = (location.state as { openStoryId?: string | number } | null)?.openStoryId;
    if (openStoryId === undefined || stories.length === 0) return;

    const index = stories.findIndex((story) => String(story.id) === String(openStoryId));
    if (index !== -1) {
      setOpenStoryIndex(index);
      setStoryPlayerOpen(true);
    }

    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories, location.state]);

  const handleSelectCategory = (category: Category) => {
    navigate(`/categoria/${category.id}`);
  };

  const handleOpenStoryPlayer = () => {
    if (stories.length === 0) {
      setNoStoriesToast({ id: Date.now() });
      return;
    }
    setStoryPlayerOpen(true);
  };

  return (
    <div className="flex w-full flex-col items-center gap-8 px-6 py-8 lg:gap-10 lg:px-[156px] lg:py-10">
      <div className="flex w-full flex-col gap-8 lg:gap-10">
        <div className="flex w-full flex-col gap-6 lg:gap-0">
          {/* Mobile: saudação "Olá, Amanda!". Desktop: a mesma TopBar/nav das outras telas. */}
          <div className="lg:hidden">
            <Header />
          </div>
          <div className="hidden lg:-mx-[156px] lg:block lg:px-[156px]">
            <TopBar />
          </div>
          <div className="lg:pt-10">
            {/* No desktop, o mini-player + texto mede 640px (mesma largura do botão do WhatsApp abaixo). */}
            <div className="lg:mx-auto lg:max-w-[640px]">
              <HighlightBanner
                onClick={handleOpenStoryPlayer}
                thumbnailUrl={getBunnyThumbnailUrl(stories[0]?.videoUrl)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Do título "O que você procura hoje?" até os cards de lojas, tudo fica dentro
          de uma caixa de 1128px centralizada no desktop (1440 - 2x156 já cobre isso
          no container raiz, mas deixamos o max-width explícito aqui também para não
          depender de o container raiz nunca mudar de largura). */}
      <div className="flex w-full flex-col items-center gap-8 lg:max-w-[1128px] lg:gap-10">
        <section className="flex w-full flex-col items-center gap-3">
          <h2 className="w-full font-display font-bold text-[26px] tracking-[0.78px] text-main-dark-900 lg:text-[48px] lg:font-extrabold lg:tracking-[1.44px]">
            O que você procura hoje?
          </h2>
          <CategoryGrid categories={categories} onSelectCategory={handleSelectCategory} />
        </section>

        {/* 08/10/2026 (Amanda, Figma node 1815:5840 "teste novo - 02"): 2
            seções novas, nessa ordem — logo depois de Categorias, antes do
            banner do WhatsApp (posição confirmada com ela). Cada uma só
            aparece se tiver dado de verdade pra mostrar. */}
        {featuredStore && (
          <section className="flex w-full flex-col items-start gap-4 lg:mx-auto lg:max-w-[640px]">
            <h2 className="font-display text-[26px] font-bold tracking-[0.78px] text-main-dark-900">
              Fornecedor Destaque
            </h2>
            <div
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/loja/${featuredStore.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/loja/${featuredStore.id}`);
              }}
              className="flex w-full cursor-pointer items-start gap-4 rounded-3xl border border-success-400 p-2"
            >
              <div className="relative size-[160px] shrink-0 overflow-hidden rounded-2xl">
                <ImagePlaceholder src={featuredStore.imageUrl} alt={featuredStore.name} className="size-full" />
                <div className="absolute bottom-0 right-0 flex h-6 w-[68px] items-center justify-end rounded-tl-2xl rounded-br-lg bg-main-red-800 p-1">
                  <span className="font-body text-[12px] leading-[1.35] tracking-[0.36px] text-base-white">
                    {featuredStore.code}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 py-1">
                <div className="flex flex-col items-start">
                  <p className="w-full font-display text-[22px] font-bold leading-[1.2] tracking-[0.66px] text-black">
                    {featuredStore.name}
                  </p>
                  <p className="w-full font-body text-[14px] leading-[1.35] tracking-[0.7px] text-[#706f6f]">
                    {featuredStore.categoryLabel}
                  </p>
                </div>
                {(featuredStore.details?.tags ?? []).length > 0 && (
                  <div className="flex flex-col items-start gap-1.5">
                    {(featuredStore.details?.tags ?? []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-main-dark-50 px-2.5 py-1 font-body text-[12px] text-main-dark-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {weeklyRanking.length > 0 && (
          <section className="flex w-full flex-col items-start gap-4">
            <h2 className="w-full font-display text-[26px] font-bold tracking-[0.78px] text-main-dark-900 lg:mx-auto lg:max-w-[1128px]">
              Mais Procuradas da Semana !
            </h2>
            <div className="w-full overflow-x-auto">
              <div className="flex w-fit items-start gap-4 lg:mx-auto lg:max-w-[1128px]">
                {weeklyRanking.map((store) => (
                  <RankedStoreCard key={store.id} store={store} rank={store.rank} />
                ))}
                <button
                  type="button"
                  onClick={() => navigate('/ranking')}
                  className="flex h-[240px] w-[160px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-main-red-700 p-4 text-center"
                >
                  <span className="font-body text-[16px] tracking-[0.8px] text-base-white">
                    Ver ranking completo
                  </span>
                  <ArrowLeftIcon className="size-[30px] rotate-180 text-base-white" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 03/09/2026 (Amanda, Figma node 113:7556): o banner da comunidade
            no WhatsApp mudou de posição — antes ficava colado no
            mini-player, lá em cima; agora vem depois das categorias, igual
            ao Figma. */}
        <div className="lg:mx-auto lg:w-full lg:max-w-[640px]">
          <WhatsappCommunityButton href={WHATSAPP_GROUP_URL} />
        </div>

        {/* 05/09/2026 (Amanda): bloco "Acesso Rápido" — ver doc comment em
            `AcessoRapidoSection.tsx` pro contexto completo (referência de
            concorrente + rascunho no Figma). Mesma largura máxima do banner
            do WhatsApp acima, pra ficar tudo alinhado no desktop.
            06/09/2026 (Amanda): faltava o `w-full` na base — sem ele essa
            div (item de um flex `items-center`, ou seja, sem stretch
            automático) encolhia pro tamanho mínimo do conteúdo em vez de
            ocupar a largura toda disponível (respeitando os 24px de
            padding da Home). O banner do WhatsApp ao lado não sofria disso
            porque o `<img>` dentro dele tem dimensão intrínseca grande o
            bastante pra forçar o esticamento; texto/botões não têm essa
            "muleta", então precisam do `w-full` explícito aqui. */}
        <div className="w-full lg:mx-auto lg:max-w-[640px]">
          <AcessoRapidoSection />
        </div>

        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="w-full font-display font-bold capitalize text-[32px] tracking-[1.6px] text-base-black">
            Chegaram Recentemente
          </h2>
          <div className="flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-8 lg:justify-start">
            {recentStores.map((store) => (
              <StoreCard
                key={store.id}
                store={{ ...store, isFavorite: isFavorite(store.id) }}
                onToggleFavorite={() => toggleFavorite(store.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {storyPlayerOpen && (
        <StoryPlayerOverlay
          stories={stories}
          initialIndex={openStoryIndex}
          onClose={() => setStoryPlayerOpen(false)}
        />
      )}

      <Toast
        key={noStoriesToast?.id ?? 'none'}
        message={noStoriesToast ? NO_STORIES_MESSAGE : null}
        variant="info"
        onDismiss={() => setNoStoriesToast(null)}
      />
    </div>
  );
}