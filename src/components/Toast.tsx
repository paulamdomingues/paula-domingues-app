import { useEffect, useState } from 'react';

interface ToastProps {
  /** Texto exibido no toast. `null`/`undefined` faz o componente não renderizar nada. */
  message?: string | null;
  /** Chamado depois que a animação de saída termina, pra quem estiver controlando o estado limpar `message`. */
  onDismiss: () => void;
  /** Tempo em ms que o toast fica visível antes de começar a desaparecer. */
  duration?: number;
}

const EXIT_TRANSITION_MS = 300;

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
export default function Toast({ message, onDismiss, duration = 3000 }: ToastProps) {
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
        className={`rounded-full bg-error-400 px-5 py-3 shadow-lg transition-all duration-300 ease-out ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <p className="text-center font-body text-[14px] font-semibold tracking-[0.7px] text-error-900">
          {message}
        </p>
      </div>
    </div>
  );
}
