import type { ButtonHTMLAttributes } from 'react';

interface AuthPrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function AuthPrimaryButton({
  children,
  loading,
  disabled,
  ...buttonProps
}: AuthPrimaryButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="flex h-[50px] w-full items-center justify-center rounded-lg bg-main-red-600 p-2 font-display font-bold text-[26px] tracking-[0.78px] text-base-white transition-opacity disabled:opacity-60"
      {...buttonProps}
    >
      {loading ? 'Aguarde...' : children}
    </button>
  );
}
