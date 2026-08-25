import { BUNNY_AUTH_SHOWCASE_URL } from '../../lib/bunnyStorage';

/**
 * Painel da direita nas telas de Login/Criar Conta no desktop (só aparece
 * em `lg:` pra cima — no mobile essas telas continuam de coluna única).
 *
 * 25/08/2026 (Figma): entrou a foto de vitrine de moda de verdade no lugar
 * do gradiente placeholder que existia aqui desde que não tínhamos uma foto
 * licenciada pra usar. Essa foto é a "limpa" (sem escurecimento pré-tratado,
 * diferente das duas do Pré-Login) — o tom vermelho por cima (15% de
 * opacidade) e o próprio painel a 80% continuam sendo aplicados aqui via
 * CSS, exatamente como no Figma.
 */
export default function AuthShowcasePanel() {
  return (
    <div className="relative hidden h-full overflow-hidden bg-main-dark-900 lg:block lg:w-1/2">
      <div className="absolute inset-0 opacity-80">
        <img src={BUNNY_AUTH_SHOWCASE_URL} alt="" aria-hidden="true" className="size-full object-cover" />
        <div className="absolute inset-0 bg-main-red-600/15" />
      </div>
      <div className="absolute inset-x-8 top-[73px] rounded-lg bg-main-dark-900/90 px-8 py-6">
        <p className="font-display text-[26px] font-bold leading-[1.2] tracking-[0.78px] text-base-white">
          A inteligência de compras que o seu negócio precisa.
        </p>
      </div>
    </div>
  );
}
