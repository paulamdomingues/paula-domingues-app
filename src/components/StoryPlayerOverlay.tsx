import { useCallback, useEffect, useRef, useState } from 'react';
import { PiVideoCameraSlash } from 'react-icons/pi';
import { XCircleIcon } from './icons';
import { ensurePlayerJsLoaded, getBunnyEmbedUrl } from '../lib/bunnyStream';
import type { Story } from '../types';

interface StoryPlayerOverlayProps {
  stories: Story[];
  /** Índice inicial (ex: reabrir no story que o usuário estava vendo). Padrão: 0. */
  initialIndex?: number;
  onClose: () => void;
}

/** Duração de cada story sem vídeo real (ou enquanto o vídeo ainda não deu load), em ms. */
const FALLBACK_DURATION_MS = 6000;
/** Intervalo de atualização da barrinha de progresso quando não há vídeo pra guiar o tempo. */
const PROGRESS_TICK_MS = 100;
/**
 * Failsafe pros stories com vídeo real: se o Player.js da Bunny não
 * carregar (ex: rede bloqueando o script, extensão de ad-block) ou o evento
 * `ready`/`timeupdate` nunca disparar, força o avanço depois desse tempo em
 * vez de travar o overlay parado num vídeo que nunca reporta progresso.
 * Bem mais longo que `FALLBACK_DURATION_MS` porque aqui existe vídeo de
 * verdade tocando por trás — só existe pra não travar de vez.
 */
const PLAYER_READY_FAILSAFE_MS = 45000;
/**
 * CTA "Ver essa loja": DESATIVADO por enquanto a pedido da Amanda
 * (19/08/2026) — ela não quer esse botão aparecendo de jeito nenhum por
 * ora, mesmo que um story tenha `linkUrl` cadastrado. Pra reativar, troca
 * pra `true`.
 */
const STORY_CTA_ENABLED = false;

/**
 * Overlay de tela cheia com os stories/destaques em vídeo, aberto a partir
 * do mini-player em `HighlightBanner` (ver estado `storyPlayerOpen` em
 * `Home.tsx`). Comportamento (Amanda, 18/08/2026):
 * - Vídeo central, formato vertical estrito 9:16, sem título/descrição.
 * - Barrinhas no topo indicam quantos stories existem e a posição atual.
 * - Toque/clique na metade direita avança, na metade esquerda volta.
 * - Os vídeos vêm do painel admin, cadastrados na Bunny STREAM (não a
 *   Storage/CDN comum usada pras imagens) — `videoUrl` guarda o videoId, e
 *   o player exibe um `<iframe>` de embed via `getBunnyEmbedUrl`
 *   (`src/lib/bunnyStream.ts`), igual o preview do admin já fazia. BUG
 *   corrigido em 21/08/2026: antes usava `resolveBunnyVideoUrl` (Storage),
 *   que montava uma URL que não existe — todo vídeo real dava 404 silencioso.
 *
 * Decisões de UX tomadas aqui (documentando por não estarem 100% explícitas
 * no texto da cliente):
 * - Story sem `videoUrl` (ainda não cadastrado): mostra um estado neutro
 *   (fundo escuro + ícone), igual ao `ImagePlaceholder`, e ainda assim
 *   avança sozinho depois de `FALLBACK_DURATION_MS` — assim o player nunca
 *   trava numa tela vazia esperando um vídeo que não existe.
 * - Passar do último story fecha o overlay automaticamente (em vez de
 *   voltar pro primeiro em loop).
 * - Voltar a partir do primeiro story não faz nada (fica parado nele) —
 *   evita fechar o overlay sem querer com um duplo toque à esquerda.
 * - Quando o story atual tem `linkUrl`, mostra um botão de call-to-action
 *   fixo na parte inferior do vídeo (em vez de interceptar o toque no vídeo
 *   inteiro, que já é usado pra navegação entre stories).
 */
export default function StoryPlayerOverlay({ stories, initialIndex = 0, onClose }: StoryPlayerOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(stories.length - 1, 0))
  );
  const [progress, setProgress] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const total = stories.length;
  const currentStory = stories[currentIndex];
  const embedUrl = getBunnyEmbedUrl(currentStory?.videoUrl);
  // Variável local só pra o TS conseguir estreitar `string | null | undefined`
  // pra `string` de forma confiável dentro do JSX abaixo (o encadeamento de
  // `&&` direto com `currentStory.linkUrl` não estava sendo aceito pelo
  // modo `strict` do tsconfig real do projeto — só apareceu no build da
  // Vercel, não no meu confere manual, 19/08/2026).
  // `?.` é necessário aqui (21/08/2026): com `stories` vindo do Supabase de
  // verdade (em vez do mock, que sempre tinha 5 itens fixos), é totalmente
  // possível abrir o player com 0 stories ativos (todos expiraram) — nesse
  // caso `currentStory` é `undefined` e o acesso direto quebrava o player
  // antes mesmo do `if (total === 0) return null` mais abaixo ser avaliado.
  const currentLinkUrl = currentStory?.linkUrl;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= total - 1) {
        onClose();
        return prev;
      }
      return prev + 1;
    });
  }, [onClose, total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Trava o scroll do body enquanto o overlay estiver aberto.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Fecha com Esc (útil no desktop).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, onClose]);

  // Reseta a barrinha ao trocar de story e, quando não há vídeo real pra
  // guiar o tempo (ou ele ainda não carregou), avança sozinho depois de
  // FALLBACK_DURATION_MS via timer simples.
  useEffect(() => {
    setProgress(0);

    if (embedUrl) return undefined;

    const stepMs = PROGRESS_TICK_MS;
    const steps = FALLBACK_DURATION_MS / stepMs;
    let ticks = 0;

    const interval = window.setInterval(() => {
      ticks += 1;
      setProgress(Math.min((ticks / steps) * 100, 100));
      if (ticks >= steps) {
        window.clearInterval(interval);
        goNext();
      }
    }, stepMs);

    return () => window.clearInterval(interval);
  }, [currentIndex, embedUrl, goNext]);

  // Quando há vídeo real (embed da Bunny Stream via iframe), a barrinha de
  // progresso e o avanço automático dependem dos eventos do Player.js
  // (ver `ensurePlayerJsLoaded` em `lib/bunnyStream.ts`) — o `<iframe>` não
  // expõe os eventos nativos de `<video>` (`onTimeUpdate`/`onEnded`) que o
  // player usava antes. Um failsafe garante que o story avança mesmo se o
  // script da Bunny falhar em carregar ou o vídeo nunca reportar progresso.
  useEffect(() => {
    if (!embedUrl) return undefined;

    let cancelled = false;
    let sawPlayback = false;
    const failsafe = window.setTimeout(() => {
      if (!sawPlayback) goNext();
    }, PLAYER_READY_FAILSAFE_MS);

    ensurePlayerJsLoaded()
      .then(() => {
        if (cancelled || !iframeRef.current || !window.playerjs) return;
        const player = new window.playerjs.Player(iframeRef.current);
        player.on('timeupdate', (data) => {
          sawPlayback = true;
          if (!data.duration) return;
          setProgress(Math.min((data.seconds / data.duration) * 100, 100));
        });
        player.on('ended', () => {
          sawPlayback = true;
          goNext();
        });
      })
      .catch(() => {
        // Sem Player.js, o failsafe acima cuida de não travar o overlay —
        // o vídeo ainda toca normal dentro do iframe (autoplay=true na
        // URL de embed), só a barrinha de progresso fica parada em 0%.
      });

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
    };
  }, [currentIndex, embedUrl, goNext]);

  if (total === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-base-black"
      role="dialog"
      aria-modal="true"
      aria-label="Player de stories"
    >
      {/* Fade nas laterais: escurece as bordas da tela em volta do vídeo central. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-base-black via-transparent to-base-black" />
      <div className="pointer-events-none absolute inset-0 bg-base-black/60 lg:bg-base-black/80" />

      <div className="relative flex aspect-[9/16] h-full max-h-screen w-full items-stretch justify-center overflow-hidden bg-base-black lg:max-h-[1024px] lg:w-[576px] lg:min-w-[576px]">
        {embedUrl ? (
          <iframe
            ref={iframeRef}
            key={currentStory.id}
            src={embedUrl}
            title="Vídeo do story"
            className="size-full border-0 object-cover"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        ) : (
          <div
            role="img"
            aria-label="Vídeo deste story ainda não foi cadastrado"
            className="flex size-full flex-col items-center justify-center gap-3 bg-main-dark-900 text-base-white/40"
          >
            <PiVideoCameraSlash className="size-16" />
          </div>
        )}

        {/* Barrinhas de progresso: uma por story, indicando quantidade + posição atual. */}
        <div className="absolute inset-x-4 top-6 z-10 flex items-center gap-1.5 lg:inset-x-10 lg:top-10">
          {stories.map((story, index) => (
            <div
              key={story.id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100/50"
            >
              <div
                className="h-full rounded-full bg-base-white"
                style={{
                  width:
                    index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
                  transition: index === currentIndex ? 'width 100ms linear' : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Botão de fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-16 z-10 text-base-white/90 transition-opacity hover:opacity-80 lg:left-10 lg:top-24"
          aria-label="Fechar player de stories"
        >
          <XCircleIcon className="size-10 lg:size-14" />
        </button>

        {/* Zonas de navegação: metade esquerda volta, metade direita avança. */}
        <button
          type="button"
          onClick={goPrev}
          className="absolute inset-y-0 left-0 z-0 h-full w-1/2 cursor-pointer"
          aria-label="Story anterior"
        />
        <button
          type="button"
          onClick={goNext}
          className="absolute inset-y-0 right-0 z-0 h-full w-1/2 cursor-pointer"
          aria-label="Próximo story"
        />

        {/* Call-to-action do link associado à mídia ("Ver essa loja") — ver STORY_CTA_ENABLED acima. */}
        {STORY_CTA_ENABLED && currentLinkUrl && (
          <a
            href={currentLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-x-6 bottom-8 z-10 rounded-full bg-base-white px-6 py-3 text-center font-body font-bold text-base-black shadow-lg"
          >
            {currentStory.linkLabel || 'Ver mais'}
          </a>
        )}
      </div>
    </div>
  );
}
