import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckFatIcon,
  ClockIcon,
  CopyIcon,
  HeartIcon,
  HeartFillIcon,
  InstagramIcon,
  MapPinIcon,
  RulerIcon,
  ShoppingCartIcon,
  TeaBagIcon,
  TruckIcon,
  WhatsappIcon,
} from '../components/icons';
import TopBar from '../components/TopBar';
import ImagePlaceholder from '../components/ImagePlaceholder';
import { getStoreDetails, stores } from '../data/mockData';
import { useFavorites } from '../context/FavoritesContext';

function InfoCard({
  icon,
  title,
  headerAction,
  children,
}: {
  icon: ReactNode;
  title: string;
  /** Ação opcional alinhada ao título, na mesma linha (ex: "Copiar endereço" no card de Endereço). */
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full items-start gap-3 rounded-lg border border-[#B1B1B1] bg-base-white p-4 shadow-sm">
      <div className="flex size-9 shrink-0 items-center justify-center text-main-red-700">{icon}</div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex w-full items-center justify-between gap-2">
          <p className="font-display font-bold text-[22px] tracking-[0.66px] text-main-red-700">{title}</p>
          {headerAction}
        </div>
        <div className="flex flex-col gap-0.5 font-body text-[14px] leading-[1.4] tracking-[0.7px] text-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Página da loja/fornecedor (V2-PAG-FORNECEDOR). Fotos, tags e cards de
 * informação seguem "cru" — sem imagem real do Figma — mas para a loja de
 * exemplo "Studio Corte Nobre" (AL-0034) já uso o conteúdo real de texto
 * extraído do design. As demais lojas mostram um conteúdo genérico até
 * serem cadastradas de verdade (ver `getStoreDetails` em mockData.ts).
 */
export default function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [copied, setCopied] = useState(false);

  const store = stores.find((s) => s.id === storeId);

  if (!store) {
    return <Navigate to="/lojas" replace />;
  }

  const details = getStoreDetails(store);
  const favorited = isFavorite(store.id);

  const handleCopyAddress = async () => {
    if (!details.address) return;
    try {
      await navigator.clipboard.writeText(details.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível (ex: sem permissão) — ignora silenciosamente.
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8 lg:px-[156px] lg:py-10">
      <TopBar />

      <div className="flex w-full flex-col gap-4">
        {/* `self-start`: sem isso, o botão herda `align-items: stretch` do
            pai e vira clicável na largura inteira da tela no desktop —
            mesmo bug/ajuste do `ScreenHeader`, ver comentário lá (19/08/2026). */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-fit items-center gap-2 self-start font-body text-[16px] tracking-[0.8px] text-main-red-800 lg:font-display lg:text-[32px] lg:font-bold lg:tracking-[0.96px]"
        >
          <ArrowLeftIcon className="size-4 lg:size-6" />
          Voltar
        </button>

        {/*
          Bloco de cima: galeria + info principal (lado a lado no desktop).

          Amanda pediu pra inverter as fotos (19/08/2026): a foto "cheia" do
          topo (com as miniaturas embaixo, coração e código sobrepostos)
          agora é `details.secondaryImageUrl` (a foto "de destaque", em pé,
          já com o enquadramento certo) — e `store.imageUrl` desce pra virar
          a foto de destaque lá embaixo, perto dos cards de informação.
        */}
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex w-full flex-col gap-2 lg:w-[552px] lg:shrink-0">
            <div className="relative">
              <ImagePlaceholder
                src={details.secondaryImageUrl}
                alt={store.name}
                className="-mx-6 aspect-square w-[calc(100%+48px)] lg:mx-0 lg:aspect-square lg:h-auto lg:w-full"
                rounded="rounded-none lg:rounded-lg"
              />

              <button
                type="button"
                aria-label={favorited ? `Remover ${store.name} dos favoritos` : `Favoritar ${store.name}`}
                onClick={() => toggleFavorite(store.id)}
                className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full border border-gray-200 bg-base-white/90"
              >
                {favorited ? (
                  <HeartFillIcon className="size-5 text-main-red-600" />
                ) : (
                  <HeartIcon className="size-5 text-main-red-900" />
                )}
              </button>

              <div className="absolute right-3 top-3 flex h-7 items-center justify-center rounded-full bg-accent-yellow px-3">
                <span className="font-body text-[13px] leading-[1.35] tracking-[0.39px] text-base-black">
                  {store.code}
                </span>
              </div>
            </div>

            <div className="flex w-full items-center justify-center gap-2">
              {(details.thumbnailImageUrls ?? [null, null, null]).slice(0, 3).map((url, i) => (
                <ImagePlaceholder
                  key={i}
                  src={url}
                  alt={`Foto ${i + 2} de ${store.name}`}
                  className="aspect-square w-1/3"
                />
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 lg:w-1/2 lg:gap-6">
            <div className="flex w-full flex-col items-start text-left">
              <h1 className="w-full font-display font-bold capitalize text-[32px] tracking-[1.6px] text-base-black lg:text-[48px]">
                {store.name}
              </h1>
              <p className="w-full font-body text-[24px] tracking-[1.3px] text-gray-800">
                {store.categoryLabel}
              </p>
            </div>

            <div className="flex w-full items-center gap-3">
              <a
                href={details.instagramUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5] p-3"
              >
                <InstagramIcon className="size-5 text-base-white" />
                <span className="font-body font-bold text-[14px] tracking-[0.7px] text-base-white">Instagram</span>
              </a>
              <a
                href={details.whatsappUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] p-3"
              >
                <WhatsappIcon className="size-5 text-base-white" />
                <span className="font-body font-bold text-[14px] tracking-[0.7px] text-base-white">WhatsApp</span>
              </a>
            </div>

            {details.tags && details.tags.length > 0 && (
              <div className="flex w-full flex-wrap gap-2 lg:justify-start">
                {details.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-200 px-3 py-1 font-body text-[13px] tracking-[0.65px] text-main-dark-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/*
          Bloco de baixo: foto secundária (agora `store.imageUrl` — trocou
          de lugar com a de cima, ver comentário acima) + cards de
          informação (lado a lado no desktop). Aqui a foto fica contida
          dentro da margem da página (sem full-bleed), como a de cima
          ficava antes da troca.
        */}
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
        <ImagePlaceholder
          src={store.imageUrl}
          alt={`Peça em destaque — ${store.name}`}
          className="aspect-[4/3] w-full lg:aspect-[4/5] lg:h-auto lg:w-1/2"
        />

        <div className="flex w-full flex-col gap-3 lg:w-1/2">
          {details.address && (
            <InfoCard
              icon={<MapPinIcon className="size-6" />}
              title="Endereço"
              headerAction={
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className={`flex w-fit shrink-0 items-center gap-1 font-body text-[13px] tracking-[0.65px] underline ${
                    copied ? 'text-success-800' : 'text-main-red-700'
                  }`}
                >
                  {copied ? <CheckFatIcon className="size-4" /> : <CopyIcon className="size-4" />}
                  {copied ? 'Endereço copiado!' : 'Copiar endereço'}
                </button>
              }
            >
              <p>{details.address}</p>
            </InfoCard>
          )}

          {(details.sizesLine || details.plusSizeLine) && (
            <InfoCard icon={<RulerIcon className="size-6" />} title="Tamanhos">
              {details.sizesLine && <p>{details.sizesLine}</p>}
              {details.plusSizeLine && <p>{details.plusSizeLine}</p>}
            </InfoCard>
          )}

          {details.hours && details.hours.length > 0 && (
            <InfoCard icon={<ClockIcon className="size-6" />} title="Horário">
              {details.hours.map((h) => (
                <p key={h.label}>
                  {h.label} - {h.value}
                </p>
              ))}
            </InfoCard>
          )}

          {(details.shippingFrom || details.shippingMethods) && (
            <InfoCard icon={<TruckIcon className="size-6" />} title="Envio">
              {details.shippingFrom && <p>{details.shippingFrom}</p>}
              {details.shippingMethods && <p>{details.shippingMethods}</p>}
            </InfoCard>
          )}

          {(details.wholesaleOnline || details.wholesaleInPerson) && (
            <InfoCard icon={<ShoppingCartIcon className="size-6" />} title="Atacado">
              {details.wholesaleOnline && <p>{details.wholesaleOnline}</p>}
              {details.wholesaleInPerson && <p>{details.wholesaleInPerson}</p>}
            </InfoCard>
          )}

          {details.retail && (
            <InfoCard icon={<TeaBagIcon className="size-6" />} title="Varejo">
              <p>{details.retail}</p>
            </InfoCard>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
