interface ComingSoonProps {
  title: string;
}

/**
 * Placeholder para telas que ainda não foram implementadas a partir do Figma.
 * Assim que você me passar o link da tela correspondente, eu substituo este
 * componente pela implementação real.
 */
export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="font-display font-bold text-[26px] text-main-dark-900">{title}</h1>
      <p className="font-body text-[14px] text-gray-800">
        Esta tela ainda será implementada a partir do Figma.
      </p>
    </div>
  );
}
