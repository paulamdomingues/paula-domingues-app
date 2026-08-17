import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';

export default function PreLogin() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-between bg-screen-bg px-6 py-16">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Logo className="h-auto w-[clamp(180px,45vw,280px)]" />
        <p className="text-center font-body text-[16px] tracking-[0.8px] text-gray-500">
          O catálogo de moda para o seu negócio vender mais.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <Link
          to="/login"
          className="flex h-[50px] w-full items-center justify-center rounded-lg bg-main-red-800 p-2 font-display font-bold text-[26px] tracking-[0.78px] text-base-white"
        >
          Acessar Conta
        </Link>
        <p className="text-center font-body text-[12px] tracking-[0.36px] text-gray-900">
          Primeira vez aqui?{' '}
          <Link to="/criar-conta" className="text-main-red-800 underline">
            Criar Conta
          </Link>
        </p>
      </div>
    </div>
  );
}
