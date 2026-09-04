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
 * 03/09/2026 (Amanda, Figma node 113:7556 "Inicio"): o texto/logo "Destaques
 * e Novidades" ao lado do mini-player deu lugar a um banner-imagem fixo
 * (arquivo no Bunny, `BUNNY_HOME_STORIES_BANNER_URL` — ver `bunnyStorage.ts`).
 *
 * 05/09/2026 (Amanda: "no desktop o banner ainda não aparece e ainda temos o
 * título, adapte da melhor forma possível"): o banner passou a valer nos
 * DOIS breakpoints — não só no mobile. A diferença entre eles é só de
 * enquadramento:
 * - Mobile: sangra a LARGURA TOTAL da tela (`-mx-6`/`w-[calc(100%+3rem)]`,
 *   desfazendo o `px-6` do container pai da Home — mesma conta usada em
 *   outros lugares do app pra sangrar conteúdo), sem cantos arredondados
 *   (vai até a borda física do aparelho) e com `aspect-[390/203]` (proporção
 *   de referência do Figma, 390×203).
 * - Desktop: fica CONTIDO dentro do card de 640px que a Home já reserva pra
 *   essa seção — sem sangrar — com cantos arredondados (`lg:rounded-2xl`,
 *   já que aqui ele é só mais um bloco de conteúdo, não a borda da tela).
 *
 * 05/09/2026, BUG corrigido (Amanda: "no desktop sumiu banner e o mini
 * player"): a primeira versão desse ajuste tirava o `aspect-[390/203]` no
 * desktop (`lg:aspect-auto`) contando que a altura ficaria "definida pelo
 * conteúdo" — mas tanto a imagem de fundo quanto o mini-player são
 * `absolute inset-0`/posicionados de forma absoluta, então NENHUM dos dois
 * empurra a altura do container pai (elemento absoluto sai do fluxo normal).
 * Sem aspect-ratio E sem conteúdo em fluxo normal, o container ficava com
 * altura 0 no desktop — por isso banner e mini-player simplesmente
 * desapareciam (não é questão de z-index/CSS visual, o container real não
 * tinha altura nenhuma). Corrigido fixando `lg:h-[368px]` (cobre a altura do
 * mini-player nesse breakpoint, 320px, mais o respiro do `py-6` ao redor).
 *
 * Não existe (ainda) uma versão em proporção widescreen desse banner — o
 * mesmo arquivo do mobile é reaproveitado via `object-cover`, então ele sofre
 * um corte vertical um pouco maior no desktop. Vale conferir ao vivo se o
 * enquadramento ainda fica bom; se não, a solução correta seria pedir uma
 * variante mais larga do banner (ex: 640×368) em vez de mexer só no CSS.
 *
 * O mini-player de stories (a prévia clicável com o ícone de play) continua
 * VIVO por cima do banner nos dois breakpoints, sem nenhuma mudança de
 * comportamento — só a moldura ao redor dele que virou essa imagem. Ele fica
 * encostado na margem direita (`justify-end`, `px-8` = 32px) nos dois
 * tamanhos agora, já que não sobra mais nenhum texto ao lado dele pra
 * ocupar o espaço à esquerda.
 */
export default function HighlightBanner({ onClick, thumbnailUrl }: HighlightBannerProps) {
  return (
    // `isolate` é necessário (BUG corrigido em 04/09/2026): sem ele,
    // `relative` sozinho não cria um novo contexto de empilhamento — o
    // `-z-10` da imagem de fundo comparava com a pilha de empilhamento do
    // body inteiro (não só com os irmãos aqui dentro) e acabava atrás do
    // `background-color` opaco do `.app-shell`/body, sumindo por completo
    // mesmo carregando certinho. Mesmo truque já usado em `PreLogin.tsx`.
    <div className="relative isolate -mx-6 aspect-[390/203] w-[calc(100%+3rem)] overflow-hidden lg:mx-0 lg:aspect-auto lg:h-[368px] lg:w-full lg:rounded-2xl">
      <img
        src={BUNNY_HOME_STORIES_BANNER_URL}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full object-cover lg:rounded-2xl"
      />

      <div className="absolute inset-0 flex items-center justify-end px-8 py-6">
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
      </div>
    </div>
  );
}