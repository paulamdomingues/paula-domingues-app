/**
 * TODO: a Amanda confirmou que os Termos de uso e Política de privacidade
 * do rodapé de Login/Criar Conta devem apontar pra um site EXTERNO (fora do
 * app), diferente da tela /termos interna (que continua existindo só para
 * quem acessa via Perfil > Termos de Uso e Privacidade, já logado). Falta
 * só a URL real do site — troque os dois valores abaixo assim que tiver.
 */
export const EXTERNAL_TERMS_URL = 'https://SEU-SITE-AQUI.com.br/termos';
export const EXTERNAL_PRIVACY_URL = 'https://SEU-SITE-AQUI.com.br/privacidade';

/**
 * Links de WhatsApp usados no Perfil ("Entrar no grupo" / "Falar com o
 * Suporte"). A Amanda confirmou (18/08/2026) que o número de suporte ainda
 * é fictício/provisório — trocar assim que tiver o número oficial.
 */
export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/C8k4KPFSafZ4bE36wYkOyG';
export const WHATSAPP_SUPPORT_URL = 'https://wa.me/5511912345678';

/**
 * `true` quando o app está rodando em `admin.pauladomingues.com` (decisão
 * confirmada com a Amanda em 21/08/2026: painel admin em subdomínio próprio,
 * separado de `app.pauladomingues.com`). Usado só pra redirecionar a raiz
 * `/` direto pra `/admin` nesse domínio — todas as rotas `/admin/*` também
 * funcionam normalmente em `app.pauladomingues.com/admin` (é o mesmo build/
 * deploy, o domínio novo é só uma configuração de DNS apontada pro mesmo
 * projeto, ainda não é uma coisa que existe até a Amanda configurar o DNS).
 */
export function isAdminHost(): boolean {
  return window.location.hostname.startsWith('admin.');
}
