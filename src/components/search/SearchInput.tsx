import { useState, type FocusEvent, type InputHTMLAttributes } from 'react';
import { PiMagnifyingGlass } from 'react-icons/pi';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function SearchInput({ className = '', onFocus, onBlur, ...inputProps }: SearchInputProps) {
  // Mesmo comportamento do `AuthTextField`: o texto digitado cresce pra
  // 16px ao focar o campo (evita o zoom automático do Safari/iOS em campos
  // com fonte menor que 16px, além de bater com o resto dos inputs do app —
  // Amanda, 19/08/2026).
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <label
      className={`flex w-full items-center gap-2 rounded-lg border-b border-[#413e3e] bg-[#FCFCFC] px-4 py-2 ${className}`}
    >
      <PiMagnifyingGlass className="size-6 shrink-0 text-[#413e3e]" />
      <input
        type="search"
        placeholder="Buscar por loja, categoria ou código..."
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full border-0 bg-transparent p-0 font-body tracking-[0.7px] text-base-black placeholder:text-[#747474] focus:outline-none ${
          isFocused ? 'text-[16px]' : 'text-[14px]'
        }`}
        {...inputProps}
      />
    </label>
  );
}
