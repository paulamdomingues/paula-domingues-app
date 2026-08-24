import { useEffect, useState, type ReactNode } from 'react';
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
import { getStoreById } from '../lib/catalog';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { StoreWithCategory } from '../types';

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
 * Página da loja/fornecedor (V2-PAG-FORNECEDOR), agora com dado real do
 * Supabase (`catalog.ts`). Lojas recém-cadastradas sem os campos de
 * detalhe preenchidos simplesmente não mostram aquele card (sem texto
 * genérico inventado) — mesmo princípio de honestidade usado no Relatórios.
 */
export default function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { session } = useAuth();
  const [copied, setCopied] = useState(false);
  const [store, setStore] = useState<StoreWithCategory | null | undefined>(undefined);
  // Qual das 4 fotos (fachada + 3 miniaturas) está em destaque na foto
  // grande do topo — 22/08/2026, clicar numa miniatura troca ela de lugar
  // com a foto principal (pedido da Amanda). Precisa ficar ANTES dos
  // `return` antecipados abaixo pra não quebrar a ordem dos hooks.
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setStore(undefined);
    getStoreById(storeId)
      .then((data) => {
        if (!cancelled) setStore(data);
      })
      .catch(() => {
        if (!cancelled) setStore(null);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [store?.id]);

  // `undefined` = ainda buscando (não redireciona ainda); `null` = buscou e
  // não achou (aí sim redireciona pra Lojas).
  if (store === null) {
    return <Navigate to="/lojas" replace />;
  }
  if (store === undefined) {
    return null;
  }

  const details = store.details ?? {};
  const favorited = isFavorite(store.id);

  // As 4 fotos do carrossel de cima vêm só da galeria (fotos 1-4 cadastradas
  // no admin) — `activeImageIndex` decide qual delas vira a foto grande; as
  // outras aparecem como miniaturas clicáveis, na ordem original (22/08/2026).
  //
  // 24/08/2026, BUG corrigido (Instruções Mudanças App V5.md, item 7 —
  // "inverter fotos 1 e 5"): antes a foto da fachada (`facadeImageUrl`)
  // entrava aqui na posição 0 (virava a foto grande padrão) e a galeria só
  // aparecia como miniatura. A Amanda apontou que a fachada tem um
  // propósito fixo — próprio, upado separadamente no admin — e não deveria
  // ocupar o lugar da foto 1 do carrossel. Agora a fachada tem sua própria
  // seção mais abaixo na página (ver `details.facadeImageUrl` perto do
  // final deste arquivo) e nunca entra nesse carrossel.
  const galleryImages: (string | null)[] = [...(details.galleryImageUrls ?? [])];
  while (galleryImages.length < 4) galleryImages.push(null);
  const heroImage = galleryImages[activeImageIndex] ?? null;
  const thumbnailEntries = galleryImages
    .map((url, index) => ({ url, index }))
    .filter((entry) => entry.index !== activeImageIndex);

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

  // Loga o clique em Instagram/WhatsApp em `store_contact_clicks` (alimenta
  // "Cliques em Contatos"/"Top 5 Lojas" no Relatórios) — sem bloquear a
  // navegação do link (`<a target="_blank">` já abre normalmente).
  const handleContactClick = (channel: 'whatsapp' | 'instagram') => {
    const userId = session?.user.id;
    if (!userId) return;
    supabase
      .from('store_contact_clicks')
      .insert({ store_id: Number(store.id), channel, user_id: userId })
      .then(() => {
        // Sem tratamento de erro de propósito: logging não pode atrapalhar
        // a pessoa que só quer abrir o WhatsApp/Instagram da loja.
      });
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
          A foto "cheia" do topo (com as miniaturas embaixo, coração e
          código sobrepostos) vem só da galeria de 4 fotos — a fachada não
          entra aqui, ver comentário em `galleryImages` acima (item 7,
          24/08/2026).
        */}
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex w-full flex-col gap-2 lg:w-[552px] lg:shrink-0">
            <div className="relative">
              {/*
                BUG corrigido em 22/08/2026: `calc(100%+48px)` (sem espaço
                em volta do `+`) é CSS inválido — a especificação exige
                espaço nos dois lados do operador dentro de um `calc()`.
                O navegador descartava a declaração inteira de `width`
                silenciosamente, então a imagem nunca chegava de fato a
                virar full-bleed no mobile (relatado pela Amanda em telas de
                360 a 440px de largura). `calc(100%_+_48px)` — o `_` vira
                espaço de verdade no valor arbitrário do Tailwind.

                SEGUNDO bug, mesmo sintoma (22/08/2026): corrigido o calc(),
                a imagem AINDA não ficava full-bleed — o Preflight do
                Tailwind aplica `img, video { max-width: 100%; height: auto }`
                globalmente. `max-width` é uma propriedade separada de
                `width`; mesmo com `width: calc(100% + 48px)` calculando
                certo, o teto de `max-width: 100%` do Preflight cortava a
                imagem de volta pra 100% do espaço disponível. `max-w-none`
                cancela esse teto só aqui.
              */}
              <ImagePlaceholder
                src={heroImage}
                alt={store.name}
                className="-mx-6 aspect-square w-[calc(100%_+_48px)] max-w-none object-top lg:mx-0 lg:aspect-square lg:h-auto lg:w-full"
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

            {/* Miniaturas clicáveis (22/08/2026): clicar em uma troca ela de
                lugar com a foto grande de cima — `activeImageIndex` guarda
                qual das 4 fotos está em destaque no momento. */}
            <div className="flex w-full items-center justify-center gap-2">
              {thumbnailEntries.map(({ url, index }) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  aria-label={`Ver foto ${index + 1} de ${store.name} em destaque`}
                  className="aspect-square w-1/3"
                >
                  <ImagePlaceholder
                    src={url}
                    alt={`Foto ${index + 1} de ${store.name}`}
                    className="size-full object-top"
                  />
                </button>
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

            {/*
              22/08/2026: os botões agora seguem o que a loja realmente tem
              cadastrado no admin — antes apareciam sempre os dois, com
              `href="#"` quando faltava Instagram/WhatsApp. Sem nenhum dos
              dois, mostra "Somente Presencial" no lugar (pedido da Amanda).
            */}
            {details.instagramUrl || details.whatsappUrl ? (
              <div className="flex w-full items-center gap-3">
                {details.instagramUrl && (
                  <a
                    href={details.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleContactClick('instagram')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5] p-3"
                  >
                    <InstagramIcon className="size-5 text-base-white" />
                    <span className="font-body font-bold text-[14px] tracking-[0.7px] text-base-white">
                      Instagram
                    </span>
                  </a>
                )}
                {details.whatsappUrl && (
                  <a
                    href={details.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleContactClick('whatsapp')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] p-3"
                  >
                    <WhatsappIcon className="size-5 text-base-white" />
                    <span className="font-body font-bold text-[14px] tracking-[0.7px] text-base-white">
                      WhatsApp
                    </span>
                  </a>
                )}
              </div>
            ) : (
              <div className="flex w-full items-center justify-center rounded-lg border border-gray-300 p-3">
                <span className="font-body font-bold text-[14px] tracking-[0.7px] text-gray-600">
                  Somente Presencial
                </span>
              </div>
            )}

            {details.tags && details.tags.length > 0 && (
              <div className="flex w-full flex-wrap justify-center gap-2">
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
          Bloco de baixo: foto da fachada (`details.facadeImageUrl` —
          24/08/2026, item 7: essa foto tem propósito fixo — mostrar a
          fachada da loja — então ganhou seção própria aqui embaixo em vez
          de disputar a posição da foto 1 no carrossel de cima) + cards de
          informação (lado a lado no desktop). Aqui a foto fica contida
          dentro da margem da página (sem full-bleed).
        */}
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
        {/* `object-top` (24/08/2026, pedido da Amanda): quando a foto é
            maior que a moldura, o corte do `object-cover` deve sempre
            "puxar" pra cima (topo/centro), não cortar pelo meio — assim o
            topo da fachada não some. */}
        <ImagePlaceholder
          src={details.facadeImageUrl}
          alt={`Fachada da loja — ${store.name}`}
          className="aspect-[4/3] w-full object-top lg:aspect-[4/5] lg:h-auto lg:w-1/2"
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

          {details.sizesLine && (
            <InfoCard icon={<RulerIcon className="size-6" />} title="Tamanhos">
              <p>{details.sizesLine}</p>
            </InfoCard>
          )}

          {details.hours && (
            <InfoCard icon={<ClockIcon className="size-6" />} title="Horário">
              <p>{details.hours}</p>
            </InfoCard>
          )}

          {details.shipping && (
            <InfoCard icon={<TruckIcon className="size-6" />} title="Envio">
              <p>{details.shipping}</p>
            </InfoCard>
          )}

          {details.wholesale && (
            <InfoCard icon={<ShoppingCartIcon className="size-6" />} title="Atacado">
              <p>{details.wholesale}</p>
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