import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import TopBar from '../components/TopBar';
import HighlightBanner from '../components/HighlightBanner';
import WhatsappCommunityButton from '../components/WhatsappCommunityButton';
import AcessoRapidoSection from '../components/AcessoRapidoSection';
import CategoryGrid from '../components/CategoryGrid';
import StoreCard from '../components/StoreCard';
import StoryPlayerOverlay from '../components/StoryPlayerOverlay';
import Toast from '../components/Toast';
import { listActiveStories, listCategories, listRecentStores } from '../lib/catalog';
import { useFavorites } from '../context/FavoritesContext';
import { getBunnyThumbnailUrl } from '../lib/bunnyStream';
import { WHATSAPP_GROUP_URL } from '../lib/constants';
import type { Category, Story, StoreWithCategory } from '../types';

/** Mensagem do toast de "sem stories" — ver `handleOpenStoryPlayer` abaixo. */
const NO_STORIES_MESSAGE = 'Não há vídeos disponíveis no momento.';

export default function Home() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [storyPlayerOpen, setStoryPlayerOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentStores, setRecentStores] = useState<StoreWithCategory[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
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
        <StoryPlayerOverlay stories={stories} onClose={() => setStoryPlayerOpen(false)} />
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