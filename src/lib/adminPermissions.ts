import type { AccessLevel } from '../context/AuthContext';

/**
 * Fonte única da regra de níveis de acesso do painel admin (Amanda,
 * 20/08/2026 — substitui os 4 perfis "livre pra tudo/curadoria/atendimento/
 * só stories" que já existiam por checagens soltas em cada tela).
 *
 * Usado pelos menus (`AdminSidebar`/`AdminMobileNav`, pra deixar a aba com
 * aparência DESABILITADA — opacidade + sem clique — quando o nível não tem
 * NENHUM acesso àquela seção; a aba continua visível, só não navega, ver
 * ajuste 20/08/2026 depois que a Amanda achou o menu "esquisito" escondendo
 * aba) e pelo guard de rota em `AdminLayout` (defesa extra: se alguém
 * acessar a URL de uma seção proibida direto, é redirecionado, não só
 * barrado visualmente).
 *
 * 21/08/2026: os nomes `editor`/`suporte` aqui já são os valores reais do
 * banco (renomeado — antes eram `suporte`/`editor_conteudo` com rótulo
 * invertido na tela; ver `AccessLevel` em `AuthContext.tsx`).
 *
 * Cada tela continua controlando ela mesma o que é "criar/editar/excluir"
 * dentro da seção (ex: `canDelete` em `AdminLojas.tsx`) — aqui só decide se
 * a seção inteira é visível pra aquele nível.
 */
export type AdminSection =
  | 'resumo'
  | 'stories'
  | 'lojas'
  | 'usuarios'
  | 'categorias'
  | 'relatorios'
  | 'configuracoes';

const SECTION_PATHS: Record<AdminSection, string> = {
  resumo: '/admin',
  stories: '/admin/stories',
  lojas: '/admin/lojas',
  usuarios: '/admin/usuarios',
  categorias: '/admin/categorias',
  relatorios: '/admin/relatorios',
  configuracoes: '/admin/configuracoes',
};

// Ordem de preferência pra decidir onde mandar alguém que não pode ver
// "/admin" (Resumo) — ex: Editor cai direto em Lojas ao logar.
const SECTION_ORDER: AdminSection[] = [
  'resumo',
  'stories',
  'lojas',
  'usuarios',
  'categorias',
  'relatorios',
  'configuracoes',
];

const SECTION_VIEWERS: Record<AdminSection, AccessLevel[]> = {
  // Resumo/Relatórios: só quem acompanha o negócio como um todo (`editor`,
  // rótulo "Editor de Conteúdo" no painel).
  resumo: ['master_admin', 'editor'],
  relatorios: ['master_admin', 'editor'],
  // Lojas/Categorias: `editor` tem CRUD completo; `suporte` cria/edita mas
  // não exclui — ver `canDelete` em cada tela.
  lojas: ['master_admin', 'editor', 'suporte'],
  categorias: ['master_admin', 'editor', 'suporte'],
  // Usuários (allowed_users): `editor` tem CRUD completo. `suporte` só
  // VISUALIZA — sem criar/editar/excluir — pedido da Amanda 20/08/2026; a
  // página já cuida disso sozinha porque `canManage` em
  // `AdminUsuarios.tsx`/`UsuarioModal.tsx` nunca incluiu `suporte`, só
  // precisou liberar a aba aqui.
  usuarios: ['master_admin', 'editor', 'suporte'],
  // Stories: função exclusiva do Convidado, fora o Master Admin — nem
  // `editor` nem `suporte` têm acesso.
  stories: ['master_admin', 'convidado'],
  // Configurações fica visível pra TODO mundo — é onde qualquer membro edita
  // o próprio nome/whatsapp ("Meu Perfil"), mesmo quem não gerencia a
  // equipe. A seção "Equipe" dentro da tela continua travada por
  // `canManageTeam` (só master_admin), ver `AdminConfiguracoes.tsx`.
  configuracoes: ['master_admin', 'editor', 'suporte', 'convidado'],
};

export function canViewSection(accessLevel: AccessLevel | null, section: AdminSection): boolean {
  if (!accessLevel) return false;
  return SECTION_VIEWERS[section].includes(accessLevel);
}

/** Seção correspondente a um pathname de `/admin/*` (usado pelo guard de rota). */
export function sectionForPath(pathname: string): AdminSection | null {
  // Ordem importa: caminhos mais específicos antes do fallback "/admin".
  if (pathname.startsWith('/admin/stories')) return 'stories';
  if (pathname.startsWith('/admin/lojas')) return 'lojas';
  if (pathname.startsWith('/admin/usuarios')) return 'usuarios';
  if (pathname.startsWith('/admin/categorias')) return 'categorias';
  if (pathname.startsWith('/admin/relatorios')) return 'relatorios';
  if (pathname.startsWith('/admin/configuracoes')) return 'configuracoes';
  if (pathname === '/admin') return 'resumo';
  return null;
}

/** Primeira seção (na ordem do menu) que esse nível consegue ver — pra onde
 * mandar quem não pode ver o Resumo ao entrar em `/admin`, ou quem tenta
 * acessar uma seção proibida direto pela URL. `configuracoes` é sempre
 * acessível, então isso nunca fica sem destino. */
export function firstAccessibleSectionPath(accessLevel: AccessLevel | null): string {
  const first = SECTION_ORDER.find((section) => canViewSection(accessLevel, section));
  return SECTION_PATHS[first ?? 'configuracoes'];
}

export const ADMIN_SECTION_PATHS = SECTION_PATHS;
