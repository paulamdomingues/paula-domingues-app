import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PiCaretDown } from 'react-icons/pi';

export interface AdminSelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  icon?: ReactNode;
  /** Classes do botão "fechado" — mesmo formato dos `<select>` nativos que
   * esse componente substitui (altura, borda, fundo, fonte). */
  triggerClassName?: string;
  disabled?: boolean;
}

/**
 * Dropdown de verdade construído por nós (22/08/2026, pedido da Amanda em
 * "Mudanças Gerais": "podemos criar um componente pra estilizar do nosso
 * jeito?") — substitui os `<select>` nativos espalhados pelo painel admin.
 *
 * Dois problemas que o `<select>` nativo do navegador não deixava resolver
 * só com classe do Tailwind:
 * 1) o padding à esquerda do texto ficava inconsistente entre
 *    navegadores/SO (a "caixa fechada" respeita o CSS, mas a listinha aberta
 *    é desenhada pelo sistema operacional, fora do nosso controle);
 * 2) em "Usuários", o dropdown de planos abria mais largo que a caixa
 *    fechada (o navegador dimensiona a lista aberta pelo texto da opção
 *    mais longa, ignorando a largura do elemento).
 *
 * Como isso aqui é um `<div>`/`<button>`/`<ul>` normal (não um `<select>`),
 * o CSS que a gente escreve é o CSS que aparece — sem esses dois problemas.
 */
export default function AdminSelect({
  value,
  onChange,
  options,
  icon,
  triggerClassName,
  disabled,
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={
          triggerClassName ??
          'flex h-10 w-full items-center gap-2 rounded-lg border border-gray-300 bg-base-white pl-3 pr-2 font-body text-[14px] text-gray-800 disabled:opacity-60'
        }
      >
        {icon}
        <span className="flex-1 truncate text-left">{selected?.label ?? ''}</span>
        <PiCaretDown className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%_+_4px)] z-20 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-base-white py-1 shadow-lg"
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left font-body text-[14px] hover:bg-gray-50 ${
                  option.value === value ? 'font-bold text-main-red-700' : 'text-gray-800'
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
