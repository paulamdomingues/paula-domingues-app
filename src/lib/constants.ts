/**
 * URLs reais confirmadas pela Amanda (22/08/2026) — usadas no rodapé de
 * Login/Criar Conta E na tela de Perfil ("Termos de Uso e Privacidade"),
 * que agora aponta pra fora do app em vez de uma tela interna (a tela
 * `/termos` foi removida).
 */
export const EXTERNAL_TERMS_URL = 'https://pauladomingues.com/termos-de-uso-app/';
export const EXTERNAL_PRIVACY_URL = 'https://pauladomingues.com/politica-de-privacidade/';

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
