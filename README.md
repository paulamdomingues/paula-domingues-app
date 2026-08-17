# Paula Domingues — App

App de catálogo de moda (lojas parceiras, categorias, favoritos), gerado a partir do design no Figma ("App V1 - User") usando React + Vite + TypeScript + Tailwind CSS, com Supabase como backend (auth, banco de dados).

## Status atual

- ✅ Tela **Início** implementada (cabeçalho, destaque/stories, botão de comunidade no WhatsApp, categorias e "Chegaram Recentemente").
- ✅ Fluxo completo de **autenticação**: Pre-Login, Login, Criar Conta, Esqueci Senha, E-mail enviado — já ligados ao Supabase Auth de verdade (`src/context/AuthContext.tsx`). Rotas internas do app são protegidas: sem sessão, o usuário cai em `/entrar`.
- ✅ **Busca e Categorias**: página de categoria (`/categoria/:categoryId`, com ordenação e atalho para trocar de categoria) e Busca (`/busca`, com estado vazio/resultados/sem-resultados) — os pop-ups de Filtro e Ordem de Exibição do Figma viraram componentes reutilizáveis (`CategoryFilterSheet`, `SortDropdown`).
- ✅ **Página da Loja** (`/loja/:storeId`, V2-PAG-FORNECEDOR): carrossel de fotos (placeholder), coração de favoritar, código da loja, botões de contato (Instagram/WhatsApp), tags, foto de destaque e os cards de informação (Endereço com "copiar endereço", Tamanhos, Horário, Envio, Atacado, Varejo). A loja de exemplo "Studio Corte Nobre" (AL-0034) já usa o texto real do Figma; as demais lojas do catálogo mostram um conteúdo genérico até serem cadastradas de verdade (`getStoreDetails` em `src/data/mockData.ts`). Todo `StoreCard` (Início, Busca, Categoria, Lojas) agora navega para essa página ao ser tocado.
- ✅ **Lojas** (`/lojas`): catálogo completo com Filtrar/Ordem de exibição e "Ver mais lojas" (paginação simples no cliente).
- ✅ **Favoritos**: `FavoritesContext` guarda o coraçãozinho marcado em qualquer tela (Início, Busca, Categoria, Lojas, Loja) — por enquanto só em memória, ver nota no próprio arquivo sobre ligar ao Supabase depois. A tela `/favoritos` lista as lojas favoritadas em cards horizontais (`FavoriteListCard`), com estado vazio quando não há nenhuma.
- ✅ **Perfil completo** (`/perfil`): nome/e-mail vêm da sessão do Supabase, com os menus Conta (Alterar Senha, Meus Favoritos), Informações e Suporte (Entrar no grupo, Falar com o Suporte via WhatsApp, Dúvidas Frequentes) e Configurações (Meu Plano — desabilitado por enquanto, Termos de Uso e Privacidade, Sair da Conta). "Sair da Conta" abre um pop-up de confirmação (`LogoutConfirmModal`) antes de encerrar a sessão de verdade.
  - `/perfil/duvidas`: as 5 perguntas frequentes do Figma.
  - `/perfil/trocar-senha`: troca a senha de verdade no Supabase Auth (reautentica com a senha atual antes de trocar, ver `updatePassword` em `AuthContext.tsx`).
  - `/termos` e `/privacidade`: o texto de Termos de Uso + Política de Privacidade do Figma. Ficou **fora** do fluxo protegido de propósito (o rodapé de Login/Criar Conta também aponta pra cá) — assim dá pra ler antes mesmo de criar conta. Os campos entre colchetes (`[NOME_DO_APLICATIVO]`, `[INSERIR_CNPJ_OU_CPF]`, `[INSERIR_EMAIL_DE_SUPORTE]`, etc.) são dados reais do seu negócio que ainda faltam preencher — não inventei nenhum.
  - `/notificacoes`: lista de notificações ("Novo parceiro no app!" para as lojas recentes) com "Marcar todas como lidas".
- ✅ Estrutura de rotas e menu inferior (Início, Busca, Lojas, Favoritos, Meu Perfil) — **todas as ~25 telas do Figma "App V1 - User" (mobile) estão implementadas.**
- ✅ Schema SQL inicial do Supabase (`supabase/schema.sql`): perfis, categorias, lojas, produtos, favoritos, com RLS configurado. O trigger `handle_new_user` já cria a linha em `profiles` a partir do `first_name` enviado no cadastro.

## Imagens: Bunny.net + Supabase

- **Logo da marca**: não é mais um arquivo local — vem direto da CDN do Bunny.net (`https://paula-assets.b-cdn.net/logo-paula-app.png`), definida em `src/lib/bunnyStorage.ts` (`BUNNY_LOGO_URL`) e usada pelo componente `Logo`. Pra trocar a arte, é só subir um novo arquivo no Bunny com o mesmo nome — não precisa mexer em código.
- **Fotos de loja** (fachada e galeria): o Supabase (tabela `stores`, colunas `storefront_image_url` e `gallery_images`) guarda só o **nome/caminho** do arquivo, nunca a URL inteira. Toda exibição de imagem passa pelo `ImagePlaceholder` (`src/components/ImagePlaceholder.tsx`), que resolve esse caminho pra URL pública da CDN via `resolveBunnyImageUrl`/`resolveBunnyImageUrls` (`src/lib/bunnyStorage.ts`). Enquanto não houver imagem cadastrada (ou enquanto as telas ainda lerem de `mockData.ts`, que não tem fotos), aparece um placeholder neutro — sem depender de nenhuma imagem externa.
- **Upload em si**: ainda não implementado — vai passar por uma Supabase Edge Function (a chave de API do Bunny nunca deve ficar exposta no navegador). É o próximo passo, junto com o painel admin.
- **Ícones de interface** (sino, coração, envelope, cadeado, olho, seta, WhatsApp, ícones do menu inferior): usam a biblioteca `react-icons` (sets Phosphor e Font Awesome), então já funcionam prontos, sem depender de nenhum arquivo externo.
- **Responsividade**: a logo e as fotos de loja/categoria usam `clamp()`/`aspect-ratio` via Tailwind (em vez de tamanho fixo em pixels), então escalam suavemente entre mobile e telas maiores.

⚠️ **Achado importante ao configurar o Supabase**: o projeto real (`App Paul Domingues`, `iuqpbozkumebumjdmqfc`) tem uma estrutura de tabelas **diferente** da que está em `supabase/schema.sql` neste repositório — nomes de coluna diferentes (`category_id`, `polo_location`, `code_badge`, `cover_image_url`, etc.), sem tabela `profiles` nem `products`, e com uma tabela nova `allowed_users` (email, is_active, purchased_at — parece controle de acesso ligado à assinatura). **RLS (Row Level Security) está desabilitado nas 4 tabelas** (`categories`, `stores`, `favorites`, `allowed_users`) — qualquer pessoa com a chave pública do projeto consegue ler e **escrever** em todas elas agora. Não apliquei nenhuma correção sozinho porque isso pode travar o acesso do app se as políticas certas não forem criadas junto — mas é importante resolver antes de ir pra produção. Posso cuidar disso quando você quiser.

## Rodando localmente

Pré-requisitos: Node.js 18+ instalado.

```bash
npm install
cp .env.example .env   # depois preencha com as chaves do seu projeto Supabase
npm run dev
```

O app abre em `http://localhost:5173`.

> Nota: este projeto foi montado em um ambiente sem acesso à internet para instalar
> pacotes (registry.npmjs.org bloqueado), então `npm install` ainda não foi executado
> nem testado nesta sessão. Rode os comandos acima na sua máquina para validar
> visualmente. A sintaxe de todos os arquivos `.ts`/`.tsx` foi checada com o
> compilador TypeScript disponível no ambiente e não há erros de sintaxe.

## Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor do projeto, rode o conteúdo de `supabase/schema.sql`.
3. Em **Project Settings → API**, copie a `Project URL` e a `anon public key` para o seu `.env`.
4. Em **Authentication → Email**, confirme se a confirmação por e-mail está habilitada (é o padrão) — depois de "Criar Conta", o Supabase manda um e-mail de confirmação antes de liberar o login.
5. (Opcional) Popule as tabelas `categories` e `stores` com dados reais — por enquanto o app usa dados fictícios em `src/data/mockData.ts` (sem imagens, ver seção acima).

## Estrutura do projeto

```
src/
  components/         Componentes reutilizáveis (Header, TopBar, ScreenHeader, CategoryGrid, StoreCard, FavoriteListCard, LogoutConfirmModal, BottomNav, ImagePlaceholder, Logo, ...)
  components/auth/    Peças do formulário de autenticação (AuthTextField, AuthPrimaryButton, TermsFooter)
  components/search/  SearchInput, SortDropdown, CategoryFilterSheet (usados em Busca, Categoria e Lojas)
  context/            AuthContext (sessão Supabase, inclui updatePassword) e FavoritesContext (favoritos em memória)
  pages/               Uma página por rota — todas as telas do Figma estão implementadas (Home, Busca, CategoryScreen, Lojas, Favoritos, StoreDetail, Perfil, PerfilDuvidas, PerfilTrocarSenha, Notificacoes, Termos)
  pages/auth/          PreLogin, Login, SignUp, ForgotPassword, EmailSent
  data/                Dados mockados (sem imagens) — categorias, catálogo completo de lojas e detalhes da página da loja (getStoreDetails)
  lib/                 Cliente do Supabase, integração com o Bunny.net (bunnyStorage.ts) e utilitário de ordenação (sortStores)
  types/               Tipos TypeScript compartilhados
supabase/
  schema.sql        Schema do banco de dados (rodar no SQL Editor do Supabase) — ver aviso acima sobre a diferença com o projeto real
```

## Próximos passos

Todas as telas do Figma "App V1 - User" (versão mobile) já estão implementadas: Início, autenticação completa, Busca/Categorias, Loja/Lojas/Favoritos e Perfil completo (Dúvidas, Termos, Trocar Senha, confirmação de logout, Notificações).

O que ainda falta pra ir ao ar de verdade:

- Resolver o RLS desabilitado no Supabase (ver aviso na seção "Imagens: Bunny.net + Supabase" acima) antes de ir pra produção.
- Implementar o upload de imagem de verdade (Edge Function do Supabase → Bunny.net) — hoje só a **leitura/exibição** está pronta (`resolveBunnyImageUrl`).
- Painel admin completo — plano detalhado já entregue em `painel-admin-plano.md`, aguardando confirmação de algumas perguntas em aberto antes de implementar.
- Rodar `npm install` e testar o app na sua máquina — nesta sessão não tive acesso à internet pra instalar pacotes nem rodar o app de verdade, só verifiquei a sintaxe de todos os arquivos.
- Preencher os campos entre colchetes na tela de Termos (`/termos`) com os dados reais do seu negócio (CNPJ/CPF, e-mail de suporte, WhatsApp, data de vigência).
- Trocar os dados fictícios em `src/data/mockData.ts` pelo catálogo real de lojas — atenção: a estrutura real do Supabase é diferente da de `supabase/schema.sql`, ver aviso acima.
- Se quiser, dá pra construir a versão desktop do Figma ("App V1 - Desktop") depois — é só pedir.
