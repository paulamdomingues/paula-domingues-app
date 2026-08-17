import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface AuthTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder: string;
  icon: ReactNode;
}

export default function AuthTextField({ label, placeholder, icon, id, ...inputProps }: AuthTextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="flex h-[63px] w-full items-center gap-2 rounded-lg border border-gray-900 bg-base-white px-4 py-2">
      <span className="flex size-6 shrink-0 items-center justify-center text-gray-900">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <label htmlFor={fieldId} className="font-body text-[16px] tracking-[0.8px] text-gray-900">
          {label}
        </label>
        <input
          id={fieldId}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent p-0 font-body text-[14px] tracking-[0.7px] text-gray-900 placeholder:text-gray-200 focus:outline-none"
          {...inputProps}
        />
      </div>
    </div>
  );
}
