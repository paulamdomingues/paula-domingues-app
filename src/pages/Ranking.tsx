import { useEffect, useState } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import RankListCard from '../components/RankListCard';
import { getWeeklyRanking, type RankedStore } from '../lib/catalog';

/** Top 10 completo — a prévia da Home mostra só os 5 primeiros (ver Home.tsx). */
const FULL_RANKING_SIZE = 10;

/**
 * 08/10/2026 (Amanda, Figma node 1831:6085 "teste ranking"): tela cheia do
 * ranking semanal "Mais Procuradas da Semana", aberta pelo card "Ver ranking
 * completo" na Home. Mesma base da tela de Favoritos (ScreenHeader + lista
 * de cards horizontais) — só troca o `FavoriteListCard` por `RankListCard`
 * (selo de posição no lugar do coração). Sem número de visualizações
 * exibido, por pedido da Amanda.
 */
export default function Ranking() {
  const [ranking, setRanking] = useState<RankedStore[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWeeklyRanking(FULL_RANKING_SIZE)
      .then((data) => {
        if (!cancelled) setRanking(data);
      })
      .catch(() => {
        // Falha silenciosa: a lista fica vazia em vez de quebrar a tela.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8 lg:px-[156px] lg:py-10">
      <ScreenHeader title="Em Alta Essa Semana!" />

      {loaded && ranking.length === 0 ? (
        <div className="flex w-full flex-col items-center gap-1 py-12">
          <p className="text-center font-display font-semibold text-[18px] tracking-[0.9px] text-base-black">
            Ainda não temos ranking pra mostrar
          </p>
          <p className="text-center font-body text-[14px] tracking-[0.7px] text-gray-400">
            Volte em alguns dias — ele é atualizado conforme as lojas vão sendo visitadas.
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-3 lg:mx-auto lg:max-w-[640px]">
          {ranking.map((store) => (
            <RankListCard key={store.id} store={store} rank={store.rank} />
          ))}
        </div>
      )}
    </div>
  );
}
