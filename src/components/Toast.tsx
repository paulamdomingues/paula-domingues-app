import { useEffect, useState } from 'react';

interface ToastProps {
  /** Texto exibido no toast. `null`/`undefined` faz o componente não renderizar nada. */
  message?: string | null;
  /**
   * 'removed' (laranja/error, padrão) ou 'added' (verde/success). Amanda
   * pediu os dois com cores diferentes, 19/08/2026 — 'removed' continua a
   * cor original pra não quebrar quem já usa o componente sem passar essa prop.
   * 'denied' (error-500, 20/08/2026): usado pelo painel admin quando alguém
   * clica numa seção do menu que o nível de acesso dela não alcança — cor
   * mais forte que 'removed' de propósito, pra ficar claro que é uma
   * restrição de permissão, não um probleminha reversível.
   * 'info' (gray-800, 21/08/2026): neutro, sem conotação de erro/sucesso —
   * usado no app cliente quando não há nada de errado, só nada pra mostrar
   * ainda (ex: tocar no mini-player de stories sem nenhum vídeo ativo no
   * momento, ver `HighlightBanner`/`Home.tsx`).
   */
  variant?: 'added' | 'removed' | 'denied' | 'info';
  /** Chamado depois que a animação de saída termina, pra quem estiver controlando o estado limpar `message`. */
  onDismiss: () => void;
  /** Tempo em ms que o toast fica visível antes de começar a desaparecer. */
  duration?: number;
}

const EXIT_TRANSITION_MS = 300;

const VARIANT_CLASSES: Record<'added' | 'removed' | 'denied' | 'info', string> = {
  removed: 'bg-error-400 text-error-900',
  added: 'bg-success-200 text-success-900',
  denied: 'bg-error-500 text-base-white',
  info: 'bg-gray-800 text-base-white',
};

/**
 * Toast simples e sem fila: mostra uma mensagem por cima do resto da tela,
 * com fade + slide de entrada, some sozinho depois de `duration` e então
 * chama `onDismiss`. Componente de apresentação puro — quem decide *quando*
 * mostrar (ex: ao remover uma loja dos favoritos) fica em quem o renderiza.
 *
 * Pra reiniciar a animação/timer em mensagens repetidas seguidas, quem usa
 * este componente deve trocar a `key` (ex: um contador incrementado a cada
 * disparo) — ver uso em `FavoritesContext.tsx`.
 */
export default function Toast({ message, variant = 'removed', onDismiss, duration = 2200 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;

    // Começa invisível/deslocado e sobe no frame seguinte, pra garantir que
    // a transição do CSS rode (mudar a classe no mesmo frame do mount não anima).
    const showFrame = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => setVisible(false), duration);
    const dismissTimer = setTimeout(onDismiss, duration + EXIT_TRANSITION_MS);

    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(hideTimer);
      clearTimeout(dismissTimer);
    };
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6 lg:bottom-8"
    >
      <div
        className={`rounded-full px-5 py-3 shadow-lg transition-all duration-300 ease-out ${VARIANT_CLASSES[variant]} ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <p className="text-center font-body text-[14px] font-semibold tracking-[0.7px]">{message}</p>
      </div>
    </div>
  );
}
