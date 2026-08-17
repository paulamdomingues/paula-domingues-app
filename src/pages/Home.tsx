import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import HighlightBanner from '../components/HighlightBanner';
import WhatsappCommunityButton from '../components/WhatsappCommunityButton';
import CategoryGrid from '../components/CategoryGrid';
import StoreCard from '../components/StoreCard';
import { categories, recentStores } from '../data/mockData';
import { useFavorites } from '../context/FavoritesContext';
import type { Category, Store } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleSelectCategory = (category: Category) => {
    navigate(`/categoria/${category.id}`);
  };

  return (
    <div className="flex w-full flex-col items-center gap-8 px-6 py-8">
      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <Header userFirstName="Amanda" />
          <HighlightBanner />
        </div>
        <WhatsappCommunityButton />
      </div>

      <section className="flex w-full flex-col items-center gap-3">
        <h2 className="w-full font-display font-bold text-[26px] tracking-[0.78px] text-main-dark-900">
          O que você procura hoje?
        </h2>
        <CategoryGrid categories={categories} onSelectCategory={handleSelectCategory} />
      </section>

      <section className="flex w-full flex-col items-center gap-4">
        <h2 className="w-full font-display font-bold capitalize text-[32px] tracking-[1.6px] text-base-black">
          Chegaram Recentemente
        </h2>
        <div className="flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-8">
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
  );
}
