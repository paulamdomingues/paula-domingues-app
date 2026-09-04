import { BUNNY_AUTH_SHOWCASE_URL } from '../../lib/bunnyStorage';

/**
 * Painel de foto nas telas de Login/Criar Conta no desktop (só aparece em
 * `lg:` pra cima — no mobile essas telas continuam de coluna única). Fica no
 * lado ESQUERDO — `AuthShowcasePanel` vem ANTES do formulário na ordem do
 * JSX de `Login.tsx`/`SignUp.tsx` (04/09/2026, pedido da Amanda: inverter
 * lados — imagem à esquerda, campos à direita).
 *
 * 25/08/2026 (Figma): entrou a foto de vitrine de moda de verdade no lugar
 * do gradiente placeholder que existia aqui desde que não tínhamos uma foto
 * licenciada pra usar.
 *
 * 04/09/2026 (Amanda): removidos o tom vermelho por cima da foto e a legenda
 * "A inteligência de compras que o seu negócio precisa." — sobravam do
 * design anterior, ela marcou os dois num print pra sair. O painel a 80% de
 * opacidade continua igual.
 */
export default function AuthShowcasePanel() {
  return (
    <div className="relative hidden self-stretch overflow-hidden bg-main-dark-900 lg:block lg:w-1/2">
      <div className="absolute inset-0 opacity-80">
        <img src={BUNNY_AUTH_SHOWCASE_URL} alt="" aria-hidden="true" className="size-full object-cover" />
      </div>
    </div>
  );
}