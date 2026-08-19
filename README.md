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
- ✅ **Versão desktop** (a partir de 1024px de largura, `lg:` do Tailwind): é o mesmo app, com telas que se adaptam pra tela grande — não é um app separado. Cabeçalho ganha o menu de navegação (`TopBar`), o menu inferior de mobile some, e cada tela recebeu o espaçamento/tamanho de fonte do Figma "App V1 - Desktop". Principais decisões:
  - Login/Criar Conta viram uma tela dividida ao meio (formulário à esquerda, painel de destaque à direita — `AuthShowcasePanel`); o link "Ainda não tem conta? Quero fazer parte" foi **removido** (não existe mais nem no mobile nem no desktop) porque a criação de conta é só via pagamento (Hubla → Make), não auto-cadastro.
  - Os links de "Termos de Uso" e "Política de Privacidade" no rodapé de Login/Criar Conta agora apontam pra uma **URL externa** (fora do app) em vez da tela interna — ver `src/lib/constants.ts`, ainda com URL placeholder aguardando o link real do seu site. A tela interna `/termos` continua existindo normalmente pra quem acessa pelo menu do Perfil.
  - "Ver mais lojas" (Lojas, Categoria, Busca) segue uma regra única: carrega 30 lojas de início, depois +20 a cada clique (`src/lib/useLoadMore.ts`).

## Imagens: Bunny.net + Supabase

- **Logo da marca**: não é mais um arquivo local — vem direto da CDN do Bunny.net (`https://paula-assets.b-cdn.net/logo-paula-app.png`), definida em `src/lib/bunnyStorage.ts` (`BUNNY_LOGO_URL`) e usada pelo componente `Logo`. Pra trocar a arte, é só subir um novo arquivo no Bunny com o mesmo nome — não precisa mexer em código.
- **Fotos de loja** (fachada e galeria): o Supabase (tabela `stores`, colunas `storefront_image_url` e `gallery_images`) guarda só o **nome/caminho** do arquivo, nunca a URL inteira. Toda exibição de imagem passa pelo `ImagePlaceholder` (`src/components/ImagePlaceholder.tsx`), que resolve esse caminho pra URL pública da CDN via `resolveBunnyImageUrl`/`resolveBunnyImageUrls` (`src/lib/bunnyStorage.ts`). Enquanto não houver imagem cadastrada (ou enquanto as telas ainda lerem de `mockData.ts`, que não tem fotos), aparece um placeholder neutro — sem depender de nenhuma imagem externa.
- **Upload em si**: ainda não implementado — vai passar por uma Supabase Edge Function (a chave de API do Bunny nunca deve ficar exposta no navegador). É o próximo passo, junto com o painel admin.
- **Ícones de interface** (sino, coração, envelope, cadeado, olho, seta, WhatsApp, ícones do menu inferior): usam a biblioteca `react-icons` (sets Phosphor e Font Awesome), então já funcionam prontos, sem depender de nenhum arquivo externo.
- **Responsividade**: a logo e as fotos de loja/categoria usam `clamp()`/`aspect-ratio` via Tailwind (em vez de tamanho fixo em pixels), então escalam suavemente entre mobile e telas maiores.

⚠️ **Achado importante ao configurar o Supabase**: o projeto real (`App Paul Domingues`, `iuqpbozkumebumjdmqfc`) tem uma estrutura de tabelas **diferente** da que está em `supabase/schema.sql` neste repositório — nomes de coluna diferentes (`category_id`, `polo_location`, `code_badge`, `cover_image_url`, etc.), sem tabela `profiles` nem `products`, e com uma tabela nova `allowed_users` (email, is_active, purchased_at — controle de acesso ligado à assinatura, alimentada pelo Hubla → Make).

✅ **RLS já aplicado** (`supabase/migrations/0001_team_members_and_rls.sql`, rodada em produção): criada a tabela `team_members` (níveis Master Admin, Suporte, Editor de Conteúdo, Convidado — ver comentários no arquivo da migração pra regra de cada um) e ligado o RLS nas 4 tabelas. Resumo: `categories`/`stores` — leitura liberada pra qualquer usuário logado, escrita/edição (inclui "congelar" via `stores.is_active`) só pra Master Admin e Editor de Conteúdo, exclusão definitiva só pra Master Admin. `favorites` — cada usuário só vê/mexe nos próprios. `allowed_users` — fechado por completo pra `anon`/`authenticated` (só a service_role do Make enxerga, de propósito).

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

## Correções e melhorias (18/08/2026)

Rodada de ajustes pedida pela Amanda em cima da versão mobile+desktop já existente (não é tela nova, é refinamento):

- **Inputs de autenticação** (Login, Criar Conta, Esqueci Senha): label flutuante (encolhe no foco), ícone à esquerda, e agora com toggle de mostrar/ocultar senha de verdade (`PiEye`/`PiEyeSlash`) direto no campo — o botão externo antigo foi removido.
- **Esqueci Senha e Pré-login** ganharam o mesmo tratamento de tela dividida do Login/Criar Conta no desktop (com placeholder de imagem institucional, pronto pra receber a foto real do Bunny.net depois).
- **Paleta de cores** (`tailwind.config.js`) atualizada com a rampa oficial do StyleGuide do Figma — `main-red`, `main-dark`, `gray`, `success` completos, e `error` (tons de laranja, é a cor usada pra ações destrutivas/de erro no app, ex: botão "Sair da Conta").
- **ID do Perfil**: agora é um número de 5 dígitos único de verdade (`id #00001` até `#99999`), gerado automaticamente no cadastro via uma tabela nova no Supabase (`public.user_short_ids`, migração `0002_user_short_ids.sql`, já aplicada em produção) — não é mais derivado do UUID da conta.
- **Categoria**: layout refeito com um filtro de bairro (Brás / 25 de Março / Bom Retiro / Outros — seleção exclusiva, combinável com a ordenação), campo interno `neighborhood` em cada loja no mock (nunca exibido pro usuário).
- **Toast de favoritos**: primeiro toast do projeto — aparece ao remover uma loja dos favoritos, em qualquer tela.
- **Player de stories**: nova funcionalidade — overlay de tela cheia com navegação por toque, aberto a partir do mini-player da Início (`src/components/StoryPlayerOverlay.tsx`). Estrutura de dados (`Story`) já prevista pra vídeos vindos do painel admin via Supabase/Bunny.
- **Ordenação "Mais populares"**: virou o padrão em Busca e Lojas — hoje simulada (mesma ordem do catálogo), até existir dado real de analytics (acessos/cliques/favoritos).
- Diversos ajustes pontuais: nav inferior (altura/espaçamento), página do fornecedor (fotos sem forçar quadrado), Busca/Lojas (alinhamento de grade, texto de "sem resultados" unificado).
- **Pendente da sua parte**: a troca dos ~30 ícones de interface do app pelos seus ícones customizados do Figma ainda não entrou nessa rodada (é uma tarefa separada, à parte, porque mexe em quase todo arquivo do projeto) — entra na próxima.

### Correção adicional: menu inferior não ficava fixo na tela (18/08/2026)

Você reportou (com prints comparando com um app concorrente) que o `BottomNav` só aparecia ao rolar até o fim da página, em vez de ficar sempre visível no mesmo ponto da tela durante a rolagem — principalmente um problema em telas com listas longas, como Lojas (30+ fornecedores).

- **Causa**: o menu usava `position: sticky`, mas por ser o último elemento da página (depois de todo o conteúdo do `<main>`), ele só "gruda" perto do fim do scroll — é um efeito colateral conhecido do `sticky` nesse tipo de estrutura, não um bug isolado de uma tela.
- **Correção**: troquei pra `position: fixed`, grudado direto na base da janela (viewport), sempre visível, independente de quanto o usuário rolou — sem alterar o visual (mantém o formato quadrado atual, **não** o formato arredondado do app concorrente que você mandou de exemplo, só o comportamento de posicionamento). Ajustei o espaçamento inferior do conteúdo das páginas (`src/App.tsx`) pra nada ficar escondido atrás do menu agora que ele não ocupa mais espaço no fluxo da página.
- **Arquivos**: `src/components/BottomNav.tsx`, `src/App.tsx`.
- Recomendo testar especialmente na tela **Lojas**, rolando a lista inteira, pra confirmar que o menu se comporta como esperado.

## Segunda leva de correções (19/08/2026)

Rodada baseada no doc "Instruções Mudanças App V2" (texto + 12 prints anotados). Continua sendo refinamento em cima do que já existe, não telas novas.

- **Carrossel de categorias (Início)**: sumiu a barrinha de rolagem nativa (mobile e desktop, rolagem continua funcionando); as setas do desktop ganharam fundo preenchido arredondado.
- **Favoritos**: agora existe toast tanto pra adicionar (verde/success) quanto pra remover (laranja/error) — antes só tinha o de remover. Os dois ficam um pouco menos tempo na tela.
- **Filtro de bairro (Categoria)**: os 4 botões (Brás/25 de Março/Bom Retiro/Outros) agora esticam pra bater exatamente com a margem do título e da grade de cards, em vez de ter largura fixa.
- **Grade de cards (Categoria)**: alinhada à esquerda (era centralizada) e título passa a ficar centralizado também no desktop.
- **Sino de notificações**: achei e corrigi dois bugs de verdade — na Início (mobile) o sino não tinha nenhum clique configurado (por isso "impossível clicar"), e a bolinha vermelha estava fixa em "sempre visível" no código, nunca refletindo se as notificações foram lidas. Criei um `NotificationsContext` (mesmo padrão do de favoritos) pra esse estado ser real e compartilhado entre a Início, o cabeçalho e a tela de Notificações.
- **Página do fornecedor**: as duas fotos do topo trocaram de posição — a foto "cheia" de cima (com as miniaturas, coração e código do fornecedor sobrepostos) agora é a que antes ficava embaixo como "destaque"; título/categoria também passaram a ficar alinhados à esquerda no mobile (antes só no desktop).
- **Stories (player de tela cheia)**: botão "Ver essa loja" desativado por enquanto (mesmo se um story tiver link cadastrado) — é só descomentar uma condição pra reativar quando você quiser. Corrigi também as barrinhas de progresso sumindo no desktop em telas mais baixas (o player forçava uma altura mínima de 1024px mesmo sem caber na janela).
- **Lojas (mobile)**: removido o rótulo "Ordem de exibição:" (só desktop mantém) e adicionado o risco/underline embaixo de "Filtrar", igual já tinha em "Mais populares".
- **Botão "Voltar" (todas as telas)**: achei a causa da área de clique gigante no desktop — um bug de CSS onde o botão "esticava" pra largura inteira do container mesmo com o texto à esquerda. Corrigido em todas as telas.
- **Inputs (login, criar conta, esqueci senha, trocar senha, busca)**: novo fundo (#FCFCFC), nova cor de placeholder (#747474), e o texto digitado cresce pra 16px ao focar o campo.
- **Pendente**: o ícone de coração customizado do card de loja (link do Figma que você mandou) ainda não entrou — o servidor de assets do Figma não está acessível deste ambiente pra baixar o SVG. Fica junto com a troca geral de ícones, quando resolvemos isso de uma vez só.
- **Correção de build**: a primeira versão desse zip quebrou o deploy na Vercel (`StoryPlayerOverlay.tsx`, erro de tipo no modo `strict` do TypeScript, no botão "Ver essa loja" que desativei). Já corrigido e reconferido — esse zip é o que você deve usar.

## Ajustes pontuais (19/08/2026, depois do V2)

- **Página do fornecedor**: a foto "cheia" do topo agora é 1:1 (era 4:5), continua ocupando 100% da largura.
- **Página do fornecedor — card de Endereço**: o botão "Copiar endereço" subiu pra linha do título "Endereço" (alinhado à direita dele), em vez de ficar embaixo do texto do endereço. Criei um prop novo (`headerAction`) no `InfoCard` pra isso — só o card de Endereço usa, os outros (Tamanhos, Horário, Envio...) continuam iguais.
- **Tipografia — conferência com o StyleGuide do Figma** (node 1122:8650): comparei toda fonte usada no projeto com a escala oficial (Sofia Sans Extra Condensed: 18/22/26/32/48px · M PLUS 2: 12/13/14/15/16/18/24px). Achei só 2 pontos fora da escala em todo o projeto — o resto já batia certinho:
  - `AuthShowcasePanel.tsx` (frase de destaque no painel do Login/Criar Conta, desktop): 28px → 26px.
  - `StoreDetail.tsx` (categoria da loja, mobile): 26px → 24px, agora igual ao desktop (antes tinha um tamanho no mobile e outro no desktop).
- **Ícones (Figma, node 1114:5610) — bloqueado por enquanto**: tentei baixar os ~50 ícones customizados que você linkou, mas confirmei que o servidor de assets do Figma está fora do alcance de rede deste ambiente (testei até domínios genéricos, não é algo específico de um ícone — é uma restrição do ambiente como um todo). Pra resolver: no Figma, seleciona todos os ícones do frame "all-icons" (ou cada subgrupo) e usa o **Export** do próprio Figma pra gerar um .zip com os SVGs de verdade — daí você anexa esse zip aqui na conversa e eu implemento todos de uma vez, sem depender de baixar nada pela internet.
- **Menus "Ordenar" e "Filtrar" vazando da tela (mobile, Lojas)**: cada um abria pro lado que já estava mais perto da borda (Ordenar perto da esquerda abria ainda mais pra esquerda, Filtrar perto da direita abria ainda mais pra direita) — troquei os dois pra abrirem pro lado de dentro/centro da tela. `SortDropdown` ganhou um prop novo (`align`, 'left'/'right') porque ele é usado em 3 lugares com o botão em posições diferentes (Lojas usa `align="left"`; Busca e Categoria continuam com o padrão). Também reforcei que nomes de categoria longos (futuros) só quebram em linha dentro da caixa do "Filtrar", nunca vazam pra fora.

## Ícones customizados (20/08/2026)

Você exportou os 59 SVGs do frame "all-icons" do Figma (node 1114:5610) direto pela pasta "Icons - Paula D" — resolveu de vez o bloqueio de rede que eu tinha marcado como pendente acima. Com os arquivos reais em mãos, troquei os ícones de interface (biblioteca `react-icons`) pelos seus, em todo o projeto:

- **`src/components/icons/index.tsx`** (novo arquivo): 36 componentes React, um por ícone usado hoje no app — cada um recebe as mesmas props de um `<svg>` normal e a cor é controlada por `className` (`text-*`), exatamente como já funcionava com `react-icons`. Não muda nada visualmente na forma de usar, só troca a fonte do desenho.
- Troquei o uso em ~20 arquivos (menu inferior, cabeçalhos, busca, favoritos, cards de loja, telas de login/criar conta/senha, perfil, notificações, página do fornecedor, stories, etc.) — sem alterar tamanho, cor ou posição de nenhum ícone, só a origem do desenho.
- **Menu inferior (Início/Lojas/Perfil)**: entre os 59 arquivos só veio um glifo por ícone — não veio uma versão "preenchida" separada pra esses três (só Favoritos tem as duas: contorno e preenchido). Então o ícone continua o mesmo nos estados ativo/inativo desses três, e o destaque de "aba selecionada" continua vindo do fundo vermelho atrás do ícone, como já era.
- **Dois ícones ficaram de fora da troca**, porque não têm equivalente entre os SVGs exportados: o de vídeo cortado (usado só quando um story ainda não tem vídeo cadastrado) e o de imagem genérica (placeholder de foto). Esses dois continuam vindo do `react-icons` normalmente — não afeta nada visível hoje.
- **Um ponto pra você conferir**: no card "Atacado" da página do fornecedor usei o ícone do saquinho de chá (`TeaBag`) e no card "Varejo" usei o do carrinho de compras (`ShoppingCartSimple`) — não tinha uma indicação explícita de qual ícone era pra qual card nos arquivos exportados, então fiz essa escolha por associação (atacado = compra em quantidade/a granel, varejo = compra individual no carrinho). Se a ideia era o contrário, é só avisar que eu inverto.
- **Ícones que vieram na exportação mas não entram no app agora**: os do futuro painel administrativo (ainda não construído) e alguns de ação genérica sem uso hoje (lixeira, editar, três pontinhos, upload, "X" avulso). Ficam guardados no arquivo pra quando forem precisos.

## Próximos passos

Todas as telas do Figma "App V1 - User" (versão mobile) já estão implementadas: Início, autenticação completa, Busca/Categorias, Loja/Lojas/Favoritos e Perfil completo (Dúvidas, Termos, Trocar Senha, confirmação de logout, Notificações).

O que ainda falta pra ir ao ar de verdade:

- ~~Resolver o RLS desabilitado no Supabase~~ — feito, ver seção "Imagens: Bunny.net + Supabase" acima.
- ~~Trocar os ícones de interface pelos ícones customizados da Amanda~~ — feito, ver seção "Ícones customizados (20/08/2026)" acima.
- Implementar o upload de imagem/vídeo de verdade (Edge Function do Supabase → Bunny.net) — hoje só a **leitura/exibição** está pronta (`resolveBunnyImageUrl`/`resolveBunnyVideoUrl`).
- Painel admin completo — plano detalhado já entregue em `painel-admin-plano.md`, aguardando confirmação de algumas perguntas em aberto antes de implementar.
- Rodar `npm install` e testar o app na sua máquina — nesta sessão não tive acesso à internet pra instalar pacotes nem rodar o app de verdade, só verifiquei a sintaxe de todos os arquivos.
- Preencher os campos entre colchetes na tela de Termos (`/termos`) com os dados reais do seu negócio (CNPJ/CPF, e-mail de suporte, WhatsApp, data de vigência).
- Trocar os dados fictícios em `src/data/mockData.ts` pelo catálogo real de lojas — atenção: a estrutura real do Supabase é diferente da de `supabase/schema.sql`, ver aviso acima.
- Popular a rampa de popularidade real (analytics) pra "Mais populares" deixar de ser simulada.
- Substituir o número de WhatsApp de suporte fictício (`src/lib/constants.ts`) pelo oficial.
- Esconder a barra de rolagem nativa do carrossel de categorias no desktop (Início) — hoje aparece a barrinha cinza do navegador embaixo dos círculos; dá pra ocultar visualmente sem perder a rolagem nem quebrar as setas. Amanda pediu pra anotar e revisar depois, sem mexer agora (19/08/2026).
- ~~Construir a versão desktop do Figma ("App V1 - Desktop")~~ — feito, ver seção "Status atual" acima. Falta só você me passar a URL real do site pra trocar o placeholder em `src/lib/constants.ts` (`EXTERNAL_TERMS_URL`/`EXTERNAL_PRIVACY_URL`).
