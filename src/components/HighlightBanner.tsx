import { PlayIcon } from './icons';
import ImagePlaceholder from './ImagePlaceholder';
import { BUNNY_HOME_STORIES_BANNER_URL } from '../lib/bunnyStorage';

interface HighlightBannerProps {
  /** Abre o player de stories (overlay em tela cheia, ver `StoryPlayerOverlay` em `Home.tsx`). */
  onClick?: () => void;
  /**
   * Thumbnail do primeiro story ativo (21/08/2026, a pedido da Amanda) — vem
   * já pronta de `getBunnyThumbnailUrl` em `Home.tsx`. `null`/`undefined`
   * (sem stories ativos, ou vídeo ainda sem thumbnail gerada pela Bunny)
   * mantém o placeholder neutro de sempre.
   */
  thumbnailUrl?: string | null;
}

/**
 * 03/09/2026 (Amanda, Figma node 113:7556 "Inicio"): no MOBILE, o texto/logo
 * "Destaques e Novidades" ao lado do mini-player deu lugar a um banner-
 * imagem fixo (arquivo no Bunny, `BUNNY_HOME_STORIES_BANNER_URL` — ver
 * `bunnyStorage.ts`) que ocupa a LARGURA TOTAL da tela — sangra além do
 * padding de 24px da Home via `-mx-6`/`w-[calc(100%+3rem)]` (mesma conta de
 * "desfazer o px-6 do container pai" usada em outros lugares do app pra
 * sangrar conteúdo, ex: `TopBar` no desktop, `App.tsx`). A proporção
 * `aspect-[390/203]` reproduz a proporção do banner no Figma (referência
 * 390×203) continuamente, não só num breakpoint fixo.
 *
 * O mini-player de stories (a prévia clicável com o ícone de play) continua
 * VIVO por cima do banner, sem nenhuma mudança de comportamento — só a
 * moldura ao redor dele que virou essa imagem.
 *
 * DESKTOP não muda: continua com o texto "Destaques e Novidades" ao vivo,
 * dentro do card de 640px que já existia (a Amanda só pediu a mudança pro
 * mobile — "banner novo que fica na width total da tela MOBILE").
 */
export default function HighlightBanner({ onClick, thumbnailUrl }: HighlightBannerProps) {
  return (
    // `isolate` é o que faltava (BUG, 04/09/2026): sem ele, `relative`
    // sozinho não cria um novo contexto de empilhamento — o `-z-10` da
    // imagem de fundo então competia com a pilha de empilhamento do body
    // inteiro (não só com os irmãos aqui dentro) e acabava atrás do
    // `background-color` opaco do `.app-shell`/body, sumindo por completo
    // mesmo carregando certinho (confirmado: a URL responde ok, só não
    // aparecia). Mesmo truque já usado em `PreLogin.tsx` (lá o `isolate`
    // já estava certo desde o início).
    <div className="relative isolate -mx-6 aspect-[390/203] w-[calc(100%+3rem)] overflow-hidden lg:static lg:mx-0 lg:aspect-auto lg:w-full lg:overflow-visible">
      <img
        src={BUNNY_HOME_STORIES_BANNER_URL}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full object-cover lg:hidden"
      />

      {/* 04/09/2026 (Amanda): banner sangra a tela toda, mas o mini-player
          em cima dele respeita a margem de 32px (`px-8`) das laterais —
          no mobile ele é o único elemento vivo (o texto some, já embutido
          na imagem), então `justify-end` encosta ele na margem direita,
          igual à referência do Figma. Desktop não muda (`lg:justify-start`
          volta ao lado a lado de sempre). */}
      <div className="absolute inset-0 flex items-center justify-end gap-6 px-8 lg:static lg:justify-start lg:gap-9 lg:px-0">
        <button
          type="button"
          onClick={onClick}
          className="relative flex h-[178px] w-[100px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg p-0.5 shadow-[3px_4px_7.8px_2px_rgba(69,16,18,0.28)] lg:h-[320px] lg:w-[262px]"
          aria-label="Ver stories de destaques"
        >
          <ImagePlaceholder src={thumbnailUrl} alt="Prévia de stories" className="absolute inset-0 size-full" />
          {/* Máscara na cor main-red-500 a 60% de opacidade sobre a thumbnail */}
          <span className="absolute inset-0 rounded-lg bg-main-red-500/60" aria-hidden="true" />
          {/* Fundo circular atrás do play, pedido pela Amanda (20/08/2026) —
              antes era só o ícone branco flutuando direto sobre a imagem. */}
          <span className="relative flex size-10 items-center justify-center rounded-full bg-rose-100 shadow-[0px_4px_4px_0px_rgba(255,255,255,0.25)] lg:size-14">
            <PlayIcon className="size-5 text-rose-950 lg:size-7" />
          </span>
        </button>

        {/* Só desktop — no mobile esse texto saiu, já vem embutido no banner acima. */}
        <div className="hidden min-w-0 flex-1 flex-col items-start justify-center gap-6 lg:flex">
          <div className="flex w-full flex-col items-start gap-1">
            <p className="w-full font-display font-bold text-[26px] leading-[1.15] tracking-[0.78px] text-base-black lg:text-[32px]">
              Destaques e Novidades
            </p>
            <p className="w-full font-body text-[14px] leading-[1.35] tracking-[0.7px] text-gray-800">
              Conteúdos exclusivos para o seu negócio vender mais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}