import { PiMagnifyingGlass } from 'react-icons/pi';
import type { InputHTMLAttributes } from 'react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function SearchInput({ className = '', ...inputProps }: SearchInputProps) {
  return (
    <label
      className={`flex w-full items-center gap-2 rounded-lg border-b border-[#413e3e] bg-white px-4 py-2 ${className}`}
    >
      <PiMagnifyingGlass className="size-6 shrink-0 text-[#413e3e]" />
      <input
        type="search"
        placeholder="Buscar por loja, categoria ou código..."
        className="w-full border-0 bg-transparent p-0 font-body text-[14px] tracking-[0.7px] text-base-black placeholder:text-base-black/70 focus:outline-none"
        {...inputProps}
      />
    </label>
  );
}
