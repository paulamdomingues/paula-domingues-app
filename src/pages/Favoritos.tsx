import { useMemo } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import FavoriteListCard from '../components/FavoriteListCard';
import { stores } from '../data/mockData';
import { useFavorites } from '../context/FavoritesContext';

export default function Favoritos() {
  const { isFavorite, toggleFavorite } = useFavorites();

  const favoriteStores = useMemo(() => stores.filter((store) => isFavorite(store.id)), [isFavorite]);

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8 lg:px-[156px] lg:py-10">
      <ScreenHeader
        title="Meus favoritos"
        suffix={`(${favoriteStores.length} ${favoriteStores.length === 1 ? 'loja' : 'lojas'})`}
      />

      {favoriteStores.length === 0 ? (
        <div className="flex w-full flex-col items-center gap-1 py-12">
          <p className="text-center font-display font-semibold text-[18px] tracking-[0.9px] text-base-black">
            Você ainda não tem favoritos
          </p>
          <p className="text-center font-body text-[14px] tracking-[0.7px] text-gray-400">
            Toque no coração de uma loja para guardá-la aqui.
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-3 lg:mx-auto lg:max-w-[640px]">
          {favoriteStores.map((store) => (
            <FavoriteListCard key={store.id} store={store} onToggleFavorite={() => toggleFavorite(store.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
