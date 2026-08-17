import { Link } from 'react-router-dom';

interface TermsFooterProps {
  prefix: string;
}

export default function TermsFooter({ prefix }: TermsFooterProps) {
  return (
    <p className="w-full text-center font-body text-[12px] leading-[1.35] tracking-[0.36px] text-gray-900">
      {prefix}
      <br />
      <Link to="/termos" className="text-main-red-700">
        Termos de uso
      </Link>{' '}
      e{' '}
      <Link to="/privacidade" className="text-main-red-700">
        Política de privacidade
      </Link>
    </p>
  );
}
