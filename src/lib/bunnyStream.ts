/**
 * Bunny Stream (vídeos dos Stories) — diferente do `bunnyStorage.ts` (que é
 * pra Pull Zone de imagem/CDN direta). O Library ID NÃO é segredo (ele
 * aparece publicamente em qualquer URL de embed), então pode ficar aqui,
 * hardcoded, sem problema — quem é secreto de verdade é a AccessKey da API,
 * que mora só no servidor (Edge Function `bunny-video-upload`, secret
 * `BUNNY_STREAM_API_KEY`).
 */
export const BUNNY_STREAM_LIBRARY_ID = '732490';

/**
 * Monta a URL de embed (iframe) de um vídeo da Bunny Stream a partir do
 * `videoId` (guid) salvo em `stories.video_path`. `null`/`undefined` →
 * `null`, pra tela mostrar o estado de "vídeo ainda não disponível".
 */
export function getBunnyEmbedUrl(videoId?: string | null): string | null {
  if (!videoId) return null;
  return `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_LIBRARY_ID}/${videoId}?autoplay=true`;
}

/**
 * BUG corrigido em 21/08/2026: o player de stories do app CLIENTE
 * (`StoryPlayerOverlay.tsx`) tocava vídeo com uma tag `<video src=...>`
 * apontando pra Bunny Storage/CDN (`resolveBunnyVideoUrl`), tratando
 * `video_path` como se fosse um arquivo hospedado lá. Só que `video_path`
 * sempre foi o videoId da Bunny STREAM (confirmado pelo próprio preview do
 * admin, `StoryPreviewModal.tsx`, que já usava `getBunnyEmbedUrl` certo) —
 * um produto diferente da Bunny, servido só via iframe de embed, sem URL de
 * arquivo direto. Resultado: todo vídeo real cadastrado dava 404 silencioso
 * pro usuário final.
 *
 * A correção troca a tag `<video>` por um `<iframe>` (igual o admin já
 * fazia), mas isso tira o acesso direto aos eventos nativos de vídeo do
 * DOM (`onTimeUpdate`/`onEnded`) que a barrinha de progresso/avanço
 * automático do player dependiam. A Bunny Stream resolve isso com suporte a
 * Player.js (https://docs.bunny.net/stream/playback-api) — um script global
 * que expõe eventos `ready`/`timeupdate`/`ended` via postMessage a partir do
 * próprio iframe, sem precisar reimplementar nada do player.
 */
const PLAYER_JS_SCRIPT_URL = '//assets.mediadelivery.net/playerjs/playerjs-latest.min.js';

let playerJsLoadPromise: Promise<void> | null = null;

/**
 * Garante que o script global do Player.js foi injetado e carregado (só uma
 * vez, mesmo abrindo vários stories em sequência — reaproveita a mesma
 * promise enquanto ela não resolve/rejeita). Necessário antes de instanciar
 * `new window.playerjs.Player(iframe)` em `StoryPlayerOverlay`.
 */
export function ensurePlayerJsLoaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.playerjs) return Promise.resolve();
  if (playerJsLoadPromise) return playerJsLoadPromise;

  playerJsLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PLAYER_JS_SCRIPT_URL}"]`
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar o Player.js da Bunny.')));
      return;
    }
    const script = document.createElement('script');
    script.src = PLAYER_JS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar o Player.js da Bunny.'));
    document.head.appendChild(script);
  }).catch((err) => {
    // Não deixa uma falha de carregamento "travar" tentativas futuras nessa
    // mesma sessão de página — reseta pra próxima chamada tentar de novo.
    playerJsLoadPromise = null;
    throw err;
  });
  return playerJsLoadPromise;
}

/** Payload do evento `timeupdate` do Player.js. */
export interface PlayerJsTimeUpdateData {
  seconds: number;
  duration: number;
}

/** Superfície mínima do Player.js que `StoryPlayerOverlay` usa. */
export interface PlayerJsPlayer {
  on(event: 'ready' | 'ended', callback: () => void): void;
  on(event: 'timeupdate', callback: (data: PlayerJsTimeUpdateData) => void): void;
}

declare global {
  interface Window {
    /** Injetado pelo script carregado em `ensurePlayerJsLoaded`. */
    playerjs?: {
      Player: new (iframe: HTMLIFrameElement) => PlayerJsPlayer;
    };
  }
}
