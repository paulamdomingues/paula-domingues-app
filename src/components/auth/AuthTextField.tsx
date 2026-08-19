import { useId, useState, type FocusEvent, type InputHTMLAttributes, type ReactNode } from 'react';

interface AuthTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder: string;
  icon: ReactNode;
  /** Ícone interativo à direita do campo (ex: alternar mostrar/ocultar senha). */
  rightIcon?: ReactNode;
  /** Handler de clique do `rightIcon`. Sem efeito se `rightIcon` não for passado. */
  onRightIconClick?: () => void;
}

export default function AuthTextField({
  label,
  placeholder,
  icon,
  rightIcon,
  onRightIconClick,
  id,
  value,
  defaultValue,
  onFocus,
  onBlur,
  ...inputProps
}: AuthTextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [isFocused, setIsFocused] = useState(false);

  // Label "flutuante": encolhe assim que o campo ganha foco (não espera o
  // usuário digitar) e continua encolhido enquanto houver valor preenchido,
  // mesmo depois do blur — é o comportamento confirmado no Figma (node 113-4343).
  const hasValue = Boolean(value ?? defaultValue);
  const isFloating = isFocused || hasValue;

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <div
      className={`flex h-[63px] w-full items-center gap-2 rounded-lg border bg-[#FCFCFC] px-4 py-2 transition-colors duration-150 ${
        isFloating ? 'border-main-dark-900' : 'border-gray-900'
      }`}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-main-dark-500">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <label
          htmlFor={fieldId}
          className={`font-body text-base-black transition-all duration-150 ${
            isFloating ? 'text-[12px] tracking-[0.36px]' : 'text-[16px] tracking-[0.8px]'
          }`}
        >
          {label}
        </label>
        <input
          id={fieldId}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`w-full border-0 bg-transparent p-0 font-body tracking-[0.7px] text-gray-900 placeholder:text-[#747474] focus:outline-none ${
            isFloating ? 'text-[16px]' : 'text-[14px]'
          }`}
          {...inputProps}
        />
      </div>
      {rightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          className="flex size-6 shrink-0 items-center justify-center text-main-dark-500"
        >
          {rightIcon}
        </button>
      )}
    </div>
  );
}
