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
 * Suporte"). O número de suporte foi confirmado pela Amanda (27/08/2026) —
 * já vem com mensagem pré-preenchida pra abrir a conversa direto no contexto
 * certo (mensagem atualizada em 05/09/2026, mesmo número).
 */
export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/C8k4KPFSafZ4bE36wYkOyG';
export const WHATSAPP_SUPPORT_URL =
  'https://wa.me/5511934001020?text=Ol%C3%A1%2C%20vim%20do%20app%20preciso%20de%20ajuda!';

/**
 * 05/09/2026 (Amanda): link do botão "Portal Exclusivo" (bloco "Acesso
 * Rápido" da Home) — a área de membros paga na Hubla, com vídeos mais
 * completos sobre os polos (Brás, 25 de Março, Bom Retiro). Amanda pediu
 * explicitamente pra deixar um PLACEHOLDER por enquanto ("depois vamos
 * trocar tbm") — troca por esse link real assim que ela confirmar.
 */
export const HUBLA_PORTAL_URL = 'https://areademembros.hubla.com';

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
