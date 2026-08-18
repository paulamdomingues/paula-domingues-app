import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';

export default function PreLogin() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden px-6 py-16">
      {/*
        Fundo institucional em foto, cobrindo a tela toda (mobile e desktop) —
        diferente do painel 50/50 de Login/SignUp. A Amanda ainda não mandou o
        link da foto real, então por enquanto usamos um gradiente sólido com
        os mesmos tokens do AuthShowcasePanel (não hotlinkar asset do Figma,
        expira em ~7 dias). Quando a foto do Bunny.net estiver pronta, basta
        trocar esta div por um <img>/`background-image` cobrindo o mesmo
        espaço, sem mexer no resto da tela.
      */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-main-dark-900 via-main-red-900 to-main-red-700" />

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-4 rounded-lg bg-main-dark-900/70 px-8 py-6">
          <Logo className="h-auto w-[clamp(180px,45vw,280px)]" />
          <p className="text-center font-body text-[16px] tracking-[0.8px] text-base-white">
            O catálogo de moda para o seu negócio vender mais.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-4 lg:pb-[180px]">
        <Link
          to="/login"
          className="flex h-[50px] w-full items-center justify-center rounded-lg bg-main-red-800 p-2 font-display font-bold text-[26px] tracking-[0.78px] text-base-white lg:w-[408px]"
        >
          Acessar Conta
        </Link>
        <p className="text-center font-body text-[12px] tracking-[0.36px] text-base-white">
          Primeira vez aqui?{' '}
          <Link to="/criar-conta" className="text-base-white underline">
            Criar Conta
          </Link>
        </p>
      </div>
    </div>
  );
}
