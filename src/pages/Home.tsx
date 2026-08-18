import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import TopBar from '../components/TopBar';
import HighlightBanner from '../components/HighlightBanner';
import WhatsappCommunityButton from '../components/WhatsappCommunityButton';
import CategoryGrid from '../components/CategoryGrid';
import StoreCard from '../components/StoreCard';
import StoryPlayerOverlay from '../components/StoryPlayerOverlay';
import { categories, recentStores, stories } from '../data/mockData';
import { useFavorites } from '../context/FavoritesContext';
import type { Category, Store } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [storyPlayerOpen, setStoryPlayerOpen] = useState(false);

  const handleSelectCategory = (category: Category) => {
    navigate(`/categoria/${category.id}`);
  };

  return (
    <div className="flex w-full flex-col items-center gap-8 px-6 py-8 lg:gap-10 lg:px-[156px] lg:py-10">
      <div className="flex w-full flex-col gap-8 lg:gap-10">
        <div className="flex w-full flex-col gap-6 lg:gap-0">
          {/* Mobile: saudação "Olá, Amanda!". Desktop: a mesma TopBar/nav das outras telas. */}
          <div className="lg:hidden">
            <Header userFirstName="Amanda" />
          </div>
          <div className="hidden lg:-mx-[156px] lg:block lg:px-[156px]">
            <TopBar />
          </div>
          <div className="lg:pt-10">
            {/* No desktop, o mini-player + texto mede 640px (mesma largura do botão do WhatsApp abaixo). */}
            <div className="lg:mx-auto lg:max-w-[640px]">
              <HighlightBanner onClick={() => setStoryPlayerOpen(true)} />
            </div>
          </div>
        </div>
        <div className="lg:mx-auto lg:w-full lg:max-w-[640px]">
          <WhatsappCommunityButton />
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

        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="w-full font-display font-bold capitalize text-[32px] tracking-[1.6px] text-base-black">
            Chegaram Recentemente
          </h2>
          <div className="flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-8 lg:justify-start">
            {recentStores.map((store: Store) => (
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
    </div>
  );
}
