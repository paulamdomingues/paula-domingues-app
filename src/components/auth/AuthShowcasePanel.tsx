/**
 * Painel da direita nas telas de Login/Criar Conta no desktop (só aparece
 * em `lg:` pra cima — no mobile essas telas continuam de coluna única). O
 * Figma usa uma foto de vitrine de moda ali; como ainda não temos uma foto
 * de verdade licenciada pra usar (e a política do projeto é nunca cravar
 * uma URL de imagem "crua" do Figma, que expira em ~7 dias), uso por
 * enquanto um painel sólido com a mesma frase de destaque — dá pra trocar
 * por uma foto real do Bunny.net depois, sem mexer no resto da tela.
 */
export default function AuthShowcasePanel() {
  return (
    <div className="relative hidden h-full overflow-hidden bg-gradient-to-br from-main-dark-900 via-main-red-900 to-main-red-700 lg:block lg:w-1/2">
      <div className="absolute inset-x-8 top-[73px] rounded-lg bg-main-dark-900/90 px-8 py-6">
        <p className="font-display text-[28px] font-bold leading-[1.2] tracking-[0.84px] text-base-white">
          A inteligência de compras que o seu negócio precisa.
        </p>
      </div>
    </div>
  );
}
