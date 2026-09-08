/**
 * URLs reais confirmadas pela Amanda (22/08/2026) — usadas no rodapé de
 * Login/Criar Conta E na tela de Perfil ("Termos de Uso e Privacidade"),
 * que agora aponta pra fora do app em vez de uma tela interna (a tela
 * `/termos` foi removida).
 */
export const EXTERNAL_TERMS_URL = 'https://pauladomingues.com/termos-de-uso-app/';
export const EXTERNAL_PRIVACY_URL = 'https://pauladomingues.com/politica-de-privacidade/';

/**
 * Links de WhatsApp usados no banner da Início (`WhatsappCommunityButton`) e
 * no Perfil ("Entrar no grupo") — grupo OFICIAL da comunidade, e "Falar com o
 * Suporte" nos Atalhos da Início. O número de suporte foi confirmado pela
 * Amanda (27/08/2026) — já vem com mensagem pré-preenchida pra abrir a
 * conversa direto no contexto certo (mensagem atualizada em 05/09/2026,
 * mesmo número; NÚMERO trocado em 07/09/2026 — instruções de mudanças
 * finais).
 *
 * 08/09/2026 (Amanda): `WHATSAPP_GROUP_URL` trocado pro link definitivo do
 * grupo oficial da comunidade (o anterior era um link de teste/rascunho).
 */
export const WHATSAPP_GROUP_URL =
  'https://chat.whatsapp.com/CQLLRun66Bk6w43EFOiKej?s=cl&p=i&mlu=4&ilr=4';
export const WHATSAPP_SUPPORT_URL =
  'https://wa.me/5511923749318?text=Ol%C3%A1%2C%20vim%20do%20app%20preciso%20de%20ajuda!';

/**
 * Link do botão "Portal Exclusivo" (bloco "Acesso Rápido" da Home) — a área
 * de membros paga na Hubla, com vídeos mais completos sobre os polos (Brás,
 * 25 de Março, Bom Retiro).
 *
 * 08/09/2026 (Amanda): trocado do placeholder (`areademembros.hubla.com`)
 * pro link real da área de membros — ver `PortalExclusivoModal.tsx`, que
 * também perdeu o aviso de "link provisório" que existia enquanto isso
 * ainda não estava pronto.
 */
export const HUBLA_PORTAL_URL = 'https://app.hub.la/m/g15h5QSeJY3H5szSTEoP';

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
