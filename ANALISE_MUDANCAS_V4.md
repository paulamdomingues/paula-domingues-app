# Análise da lista de mudanças (V4)

Li o arquivo inteiro (texto + as 10 imagens anexadas) e fui no código conferir, item por item, o que já existe, o que dá pra implementar direto, e onde tem algum ponto que precisa de uma decisão sua antes de eu mexer em qualquer coisa. **Nada foi alterado ainda** — isso é só o mapeamento, como você pediu.

Legenda:
- ✅ **Pode implementar como descrito** — já confirmei no código, é só fazer.
- 🐞 **Bug encontrado, causa confirmada** — sei exatamente o que está errado e como corrigir.
- ⚠️ **Precisa de uma decisão sua** — tem mais de um caminho possível, ou vi uma informação conflitante.
- ❓ **Pergunta / preciso de algo de você** — não é código, ou depende de um dado que só você tem.
- 🔧 **Maior do que parece** — dá pra fazer, mas é bom você saber que não é um ajuste rápido.

---

## VERSÃO USUÁRIO

### Login e Criar Conta

**Termos de Uso e Política de Privacidade no site** ❓
Isso é uma página no **site** (fora do app), pra depois linkar de dentro do app. Não é algo que eu mexo neste projeto — mas já preparei o terreno: o app já tem duas constantes prontas (`EXTERNAL_TERMS_URL` e `EXTERNAL_PRIVACY_URL` em `constants.ts`) só esperando a URL de verdade assim que essas páginas existirem no site.

**Email de confirmação em inglês** ❓
Dá, sim, pra mudar — mas isso não é no código, é uma configuração do Supabase (Authentication → Email Templates, no dashboard). É rápido de fazer, posso te mostrar onde quando você quiser.

**Campo de WhatsApp na tela de criar conta** ✅ (com uma decisão pendente)
Conferi `SignUp.tsx`: hoje só existe Nome, Email e Senha — não tem campo de WhatsApp nenhum. Dá pra adicionar tranquilamente. ⚠️ Só uma decisão: onde esse WhatsApp deve ser salvo? Hoje o WhatsApp "oficial" da usuária vive na tabela `allowed_users`, que é preenchida pelo webhook da Hubla (o pagamento), não pelo cadastro. Posso salvar o WhatsApp do cadastro junto com o usuário do Supabase Auth (metadata) e depois decidir se ele **substitui** ou só **complementa** o que a Hubla manda — me diz qual preferência.

**"Cria conta, confirma email, mas não acessa a tela com conteúdo"** ⚠️
Aqui pode ser duas coisas bem diferentes, e preciso que você confirme qual é:
1. A pessoa confirma o email, mas como ela **ainda não pagou**, cai na tela de "aguardando liberação" — isso é o comportamento **esperado** hoje (sem compra = sem acesso ao conteúdo).
2. OU a pessoa confirma o email e cai em algo quebrado/branco/erro de verdade.
Se for a opção 1, não teria nada pra "corrigir" aqui — é sobre isso, ou é outra coisa?

**"Quem tem login certo vê a tela de aguardando pagamento por 1–2 segundos, mesmo com refresh"** 🐞 **[bug real, confirmado]**
Achei a causa exata — e é a mesma causa do bug de login do painel admin (ver seção Login do admin abaixo). Resumindo: existe uma corrida entre três verificações que rodam meio separadas (sessão, nível de acesso, acesso pago) — e por uma fração de segundo, logo que a sessão chega, as outras duas ainda estão com um valor "velho" (de antes de saber quem é o usuário), o que faz o app concluir por engano que a pessoa não tem acesso e mandar ela pra tela errada, até se corrigir sozinho no instante seguinte. Uma correção no `AuthContext.tsx` resolve os dois relatos (esse aqui e o do login do admin) de uma vez.

**"Automação pra mandar link de compra pra quem só criou conta"** 🔧
Essa é uma funcionalidade nova de verdade, não um ajuste — precisa de uma rotina que identifique "criou conta mas nunca apareceu em `allowed_users`" e dispare um email/mensagem com o link de compra. Também quero entender melhor o "não estou conseguindo mudar manualmente no Supa" — pode ser que o registro da pessoa em `allowed_users` simplesmente não existe ainda (ele só é criado pela Hubla), então "editar" não funciona, tem que **criar** a linha. Posso confirmar isso com você quando formos mexer.

**Login único (sair do dispositivo 1 ao logar no 2)** 🔧
Também é funcionalidade nova, de porte médio/grande — o Supabase não faz isso sozinho. Dá pra construir usando a própria API de sessões do Supabase Auth (derrubar as sessões antigas quando uma nova é criada), mas é um pedaço de trabalho combinado (backend + lógica de login), não um toggle.

### Início

- ✅ Stories somem após 24h / toast sem stories — já ok, nada a fazer.
- **Link do grupo de WhatsApp** ❓ Isso já parece estar implementado (`Home.tsx` já usa `WHATSAPP_GROUP_URL`) — você ainda está vendo ele faltando em algum lugar específico, ou é só confirmar que está funcionando?
- **"Chegaram recentemente" fiel aos dados** ✅ Conferido: já busca sempre as 8 lojas mais recentes de verdade (por data de criação) — vai continuar correto conforme mais lojas forem cadastradas, nada a mudar.

### Busca

- ✅ Atualiza com 1 caractere / ordenação por ordem de exibição — já ok.
- **Tags entram na busca?** 🐞 **Não entram hoje** — a busca só compara nome, categoria e código da loja. Boa notícia: as tags já estão carregadas nos mesmos dados, é só incluir na comparação. Simples.
- **"Carregar mais lojas" funciona com mais dados?** ✅ Sim, conferido — a paginação é feita corretamente sobre a lista real, vai continuar funcionando conforme o catálogo crescer.

### Lojas

- ✅ Contador fiel com filtros / categoria leva pra página da categoria / ordem de exibição — já ok.
- **"Não seria melhor o filtro de categoria virar um segmento dentro da própria tela de Lojas?"** ⚠️ **Essa é uma decisão sua, não um bug.** Hoje, escolher uma categoria realmente *navega* pra uma página separada (`/categoria/:id`) — é assim que a página de categoria consegue also oferecer o filtro por localização (bairro/polo), que só existe lá. Se a categoria virar um segmento dentro de "Lojas", ou perdemos a combinação categoria + localização, ou temos que reconstruir esse filtro de localização dentro da tela de Lojas também. Quer que eu mantenha como está, ou parta pra essa reestruturação (sabendo que dá mais trabalho pra preservar os dois filtros juntos)?

### Página de Categoria

- ✅ Sub-filtro por localização / ordenar exibição — já ok.
- **"Usuário precisa voltar pra filtrar por outra categoria"** 🐞 Confirmado — hoje não existe nenhum seletor de categoria dentro da própria página de categoria, só dá pra trocar voltando pra "Lojas" e escolhendo de novo. **Isso está ligado à decisão acima**: se você decidir por um segmento único na tela de Lojas, esse problema tende a desaparecer sozinho.

### Página de Favoritos

- **Ordem dos favoritos (mais recentes no topo)** 🐞 Confirmado — hoje a lista de favoritos **não segue nem ordem de quando foi favoritado nem ordem de cadastro**: ela é simplesmente a lista geral de lojas em ordem alfabética, filtrada pros favoritos. A tabela já guarda a data de quando cada favorito foi adicionado (não precisa mudar banco), então dá pra ordenar do jeito que você quer (mais recente sempre no topo). Pode implementar como descrito.

### Página Meu Perfil

- **Alterar senha** ✅ Simples de fazer: hoje os 3 campos são mascarados normalmente (nenhum botão de mostrar/ocultar nessa tela). Trocar pra sempre visível, só nessa tela, é uma mudança pequena e isolada — não afeta senha em nenhuma outra tela do app. Sobre "melhorar os textos" — se você já tiver algo em mente me manda, senão posso sugerir uma versão quando formos mexer.
- **Meus favoritos** — ok, nada a fazer.
- **Entrar no grupo / Falar com suporte** ✅❓ Os dois links já existem no código (`Perfil.tsx` já usa as constantes de WhatsApp). Só que o número do "Falar com Suporte" (`5511912345678`) bate exatamente com o padrão de número de exemplo usado em outros lugares do app (tipo "Ex: 11 91234-5678") — ou seja, **tudo indica que é um número fictício, nunca trocado pelo real**. Pode me confirmar o WhatsApp de verdade da Paula pra eu trocar?
- **Dúvidas (FAQ)** ⚠️ Reli as 5 perguntas atuais. Achei uma inconsistência que vale sua atenção: a pergunta 4 (sobre gerenciar assinatura) e a própria tela de Termos citam **"Kiwify"** como a plataforma de pagamento — mas o banco de dados e a integração real (webhook, colunas `hubla_*`) são da **Hubla**. Parece que o texto ficou de uma versão anterior e nunca foi atualizado. Quer que eu troque "Kiwify" por "Hubla" nesses textos, ou tem algum motivo pra manter Kiwify (por exemplo, se o link que a cliente acessa pra gerenciar o plano de fato é hospedado num domínio Kiwify)?
- **Meu Plano — mostrar o que a pessoa realmente tem** 🔧 Hoje é 100% texto fixo ("Meu Plano - Trimestral"), sempre a mesma frase pra todo mundo, sem nenhuma conexão com o plano real. O dado existe no banco (`allowed_users.plan`) e já é usado no painel admin — mas hoje, por segurança (RLS), uma cliente comum não consegue ler essa informação da própria conta. Preciso criar uma function no banco parecida com a que já existe pra "tem acesso pago" (`has_active_access`), só que devolvendo o plano. É uma mudança de banco + tela, não só de texto, mas é totalmente viável.
- **Termos e Privacidade — virar link externo, remover tela interna** ✅ Já tem tudo preparado pra isso (as constantes de URL e até o componente já suportam link externo, é só trocar a tela de Termos por um link e apagar a página interna). Só depende da URL real do item 1 lá em cima.

### Página de Notificações

- ✅ Acessível de qualquer tela — ok.
- **Como está configurado o envio hoje?** ❓ Não é em tempo real nem por checagem periódica — hoje é uma busca única, feita quando a tela abre, das 8 lojas mais recentes, com um rótulo de "há Xd" **falso** (calculado por posição na lista, não pela data real) e um "lido/não lido" que só existe na memória do app (some ao recarregar ou trocar de aparelho — não é salvo em lugar nenhum).
- **Adicionar "novo fornecedor" e "novo stories" com contador real (hoje, ontem, 2d...)** ⚠️ Depende do que você quer: (a) só melhorar o que já existe — mostrar lojas novas E stories novas, com o tempo calculado de verdade — isso dá pra fazer com o que já existe no banco, é rápido; (b) se você também quer que o "lido" fique salvo de verdade (sobreviva a recarregar a página ou trocar de aparelho) ou que vire realmente instantâneo/"tempo real", aí precisa de uma tabela nova no banco — mais trabalho. Qual dos dois você quer agora?

### Página de Fornecedor (tela da loja no app cliente)

- ✅ Sobreposição de rótulo/botões (favoritos, tags, WhatsApp, Instagram) — já corrigido.
- **Regra dos botões Instagram/WhatsApp (mostrar só o que a loja preencheu; "somente presencial" se não tiver nenhum)** ✅ Confirmei que essa regra ainda não existe (os botões aparecem sempre, incondicionalmente). Dá pra implementar exatamente como você descreveu.
- **Imagem no mobile "colar no canto da tela"** ⚠️ O código já tem uma técnica pra imagem ocupar a tela toda de ponta a ponta no mobile. Pode ser que ainda sobre uma folga em algum aparelho/tela específica, ou pode ser que seu print aponte pra outro elemento. Você pode me confirmar se esse problema ainda aparece na versão mais atual (ou mandar um print novo) pra eu comparar com o que já existe?
- **Tags alinhadas "top center"** 🐞 Confirmado — hoje elas ficam alinhadas à esquerda, não centralizadas. Ajuste simples.
- **Foto da fachada duplicada como "peça em destaque"** 🐞 **Causa raiz encontrada** — no código que monta os dados da loja, a "peça em destaque" (aquela foto mais abaixo, ao lado das infos) usa **a mesma foto da fachada sempre que ela existe**, só cai numa foto da galeria quando a fachada não foi preenchida — só que a fachada quase sempre é preenchida, por isso a duplicação. É uma linha de prioridade errada, fácil de trocar (usar a galeria primeiro, a fachada só como último recurso).
- **Foto da fachada em 1:1 (hoje 4:3)** ⚠️ Preciso confirmar uma coisa: no código, o espaço onde a fachada aparece já parece estar configurado como quadrado (1:1). Você está falando do **enquadramento na tela** (que já pode estar OK) ou de dar pra **cliente cortar/ajustar a foto no momento do upload**, pra ela não ficar espremida/cortada estranho quando forçada num quadrado? São coisas bem diferentes de implementar.
- **Galeria: máscara 1:1, ancorada no topo-centro** ✅ Ajuste de estilo, deve ser simples — vou confirmar o valor exato quando for mexer.
- **Clicar numa foto da galeria pra trocar de lugar com a principal** ✅🔧 Você mesma já avisou que pode precisar de mudança estrutural — confirmo: precisa, sim. Hoje as 4 fotos (1 principal + 3 miniaturas) são fixas, não trocam de posição. Pra fazer o "clique e troca" funcionar, a tela precisa passar a controlar qual foto está em destaque a cada momento (um estado local). É viável e fica contido nessa única tela — não mexe em banco de dados nem em outras partes do app.

---

## VERSÃO ADMINISTRATIVO

### Login

- **Espaçamento entre "Lembrar deste dispositivo" e "Esqueceu sua senha"** ✅ Confirmado — hoje ficam lado a lado, coladas. Mover "Esqueceu sua senha" pra baixo do botão Entrar, com 48px de espaço, é uma mudança simples de layout.
- **"Login não tá segurando, preciso entrar de novo toda vez"** 🐞 **Causa raiz confirmada — é o MESMO bug** do "vê a tela de aguardando pagamento por 1-2seg" lá no app cliente. Não é a sessão expirando de verdade (o Supabase já guarda a sessão normalmente) — é a mesma corrida entre as verificações que, por uma fração de segundo, manda você de volta pra tela de login mesmo com a sessão válida, e a URL muda antes de se corrigir. Vale dizer: o checkbox "Lembrar deste dispositivo" hoje **não faz nada** — existe na tela, mas nunca é usado em lugar nenhum do código. Uma correção no `AuthContext.tsx` resolve isso.
- **Capslock não reconhece o email** ⚠️ Não achei uma causa 100% certa no código (não há nada que compare o email de forma sensível a maiúsculas de propósito). O mais provável é diferença entre maiúsculas/minúsculas na hora de comparar com o que está salvo. Uma correção segura e de baixo risco, independente da causa exata: sempre converter o email pra minúsculo antes de enviar pro Supabase, nas telas de login e cadastro. Posso aplicar isso e a gente testa se resolve.

### Resumo

- Cards, contador vs. ontem — ok.
- **"Últimos usuários cadastrados" mostra o ID em vez do short_id** 🐞 Confirmado (já tinha achado isso antes) — é o ID interno do banco, não o código de 5 dígitos que vocês já usam em todo o resto do painel. Ajuste pontual e contido.
- Resto ok.

### Stories

- "Tudo ok, não mudar nada" — combinado, não vou tocar em nada aqui.

### Lojas (admin)

1. **Labels dos cards → só "Total"** ✅ Mudança de texto simples.
2. **Filtros "Status" e "Categorias" (sem "todos/todas")** ✅ Já sei exatamente onde estão (inclusive o de categoria fui eu que implementei essa semana) — troca simples.
3. **Mostrar o nome da categoria por extenso ao lado do código, 14px, fonte M PLUS 2** ✅ O dado já está disponível (inclusive o código do filtro de categoria que implementei já busca isso) — só falta exibir na linha da loja. Contido.
   - **Placeholder da tag "use vírgulas pra separar as tags"** ✅ Texto simples.
   - **Upload de até 4 fotos de uma vez (galeria/disponibilidade)** ✅ Hoje só aceita uma imagem por vez — dá pra permitir selecionar várias de uma vez, limitando a 4. Mudança contida no formulário de loja.
   - Foto de fachada continua sendo só uma — combinado, sem mudança aí.

### Usuários (admin)

1. **Labels dos cards → "Total" / "Trimestral" / "Anual"** ✅ Já localizei as 3 linhas exatas — troca simples.
2. **Fonte 14px (M PLUS 2) no plano e na data de cadastro dos cards de usuário** ✅ Confirmado: no card mobile o selo do plano está em 13px e a data em 11px — os dois precisam ir pra 14px (a versão desktop já está correta). Ajuste pontual.
3. **Centralizar a fileira de cards como um todo** ✅ Confirmado — hoje ela estica de ponta a ponta na tela, sem nenhum limite de largura. Fácil de corrigir.
4. **Dropdown "todos os planos" abre mais largo do que devia** 🔧 Aqui o achado foi diferente do que eu esperava: isso **não é um CSS simples de ajustar** — é um comportamento do próprio menu nativo do navegador (o Chrome, por exemplo, ignora o estilo do CSS pra largura da lista aberta, só o "caixa fechada" respeita). Pra resolver de verdade, preciso trocar esse `<select>` nativo por um menu customizado (constrói do zero, tipo os menus que a gente já viu em outros apps) — é um componente pequeno, mas é construção, não é ajuste de classe. Quer que eu faça essa troca, ou prefere só encurtar o texto das opções como um remendo mais rápido (menos garantido)?

### Configurações

- **Placeholders da modal de novo membro** ✅ Já localizei os 3 textos exatos (nome, WhatsApp, email) — troca simples.
- **~80px de padding embaixo, card não colado na borda** ✅ Contido, fácil.
- **"Esse acesso/autorização chega por onde? Email? Sob que domínio? Dá pra ajustar?"** ❓ **Respondendo:** o convite é enviado pelo próprio Supabase (função de convite da autenticação), não por um email customizado nosso — ou seja, hoje ele sai do domínio padrão/compartilhado do Supabase, não de um endereço tipo `@pauladomingues.com.br`. **Isso dá pra ajustar, sim, mas é configuração no painel do Supabase (não no código)** — precisa configurar um "SMTP customizado" lá (usando um provedor de email tipo Resend/SendGrid, com um domínio verificado). Quando você quiser, posso te ajudar a configurar isso — só depende de você (ou eu, se preferir) criar uma conta num desses provedores.

### Mudanças Gerais

- **Padding à esquerda em todos os dropdowns (~8px mínimo)** 🔧 Não existe um componente único de dropdown reaproveitado — são 8 seletores espalhados em 6 arquivos diferentes, cada um escrito na mão. A maioria até já tem um padding definido no código, mas o menu nativo do navegador ignora esse padding em quase todos eles (só um dos 8 já está configurado do jeito que realmente funciona visualmente). Ou seja: dá pra resolver, mas é um ajuste que precisa ser replicado nos 6 arquivos, não uma correção central única.

### Modificações específicas — versão desktop do admin

- **Espaço mal aproveitado nas laterais / conteúdo vazando à direita (principalmente em Relatórios)** 🐞 Causa concreta encontrada: a tela de Relatórios tem uma coluna de largura fixa (420px) ao lado de uma coluna flexível, sem uma trava que deixa a coluna flexível encolher direito — em telas de notebook mais estreitas, isso empurra a página inteira pra além da largura da tela, gerando aquela barra de rolagem horizontal. Ajuste de CSS contido, sem mexer em dado nenhum.
- **Aba Relatórios — filtro de data (hoje, ontem, 7 dias, 30 dias, mês específico com os últimos 6 meses)** 🔧 **Esse é o maior item de toda a lista, e quero deixar isso bem claro antes de entrarmos nele.** Hoje **não existe nenhum filtro de data de verdade** por trás dos Relatórios — todos os números são calculados sempre sobre o histórico completo (desde o início), e o "mês" que aparece na tela hoje é só um texto decorativo, sem nenhuma lógica por trás. Pra fazer esse filtro funcionar de verdade eu preciso: (1) ensinar a camada de dados a buscar só o período escolhido, (2) refazer o cálculo de praticamente todos os cartões de métrica pra respeitar esse período em vez do "sempre tudo", (3) construir do zero a lógica de "escolher um mês específico dos últimos 6", e (4) ter cuidado porque essa mesma camada de dados também alimenta a tela de Resumo — preciso garantir que o Resumo continue mostrando o que sempre mostrou (visão geral, não filtrada) mesmo depois dessa mudança. Não é impossível nem tem pegadinha, mas é bom entrar sabendo que é o item mais trabalhoso da lista toda, não um ajuste rápido de tela.
- **Sidebar não acompanha o tamanho do conteúdo** 🐞 Causa confirmada: a barra lateral tem uma altura travada em "uma tela de altura" (100vh) — quando o conteúdo principal (como em Relatórios) fica mais alto que isso, ele rola normalmente, mas a barra lateral fica curta, "descolada" do restante da página, exatamente como no seu print. Correção contida — trocar pra ela acompanhar a altura real do conteúdo (possivelmente fixando ela na tela enquanto só o conteúdo rola, que já parece ser a intenção original do layout).

---

## Resumo rápido do que preciso de você antes de começar

1. Qual comportamento você quer pro filtro de categoria em "Lojas" — manter como está (navega pra página própria) ou virar segmento único na mesma tela (perdendo ou reconstruindo o combo com localização)?
2. WhatsApp no cadastro: salvar só como metadata do usuário, ou também tentar casar/mesclar com o que a Hubla manda depois?
3. "Não acessa a tela com conteúdo" após confirmar email — é o comportamento esperado (sem pagamento = tela de espera) ou algo realmente quebrado?
4. Número de WhatsApp real do "Falar com Suporte" (o atual parece fictício).
5. FAQ: trocar "Kiwify" por "Hubla" nos textos, ou existe um motivo pra manter Kiwify?
6. Foto da fachada 1:1 — é sobre o enquadramento na tela (já parece OK) ou sobre dar uma ferramenta de corte no upload?
7. Notificações "novo fornecedor/novo stories" — só melhorar o feed atual (rápido) ou também tornar o "lido" permanente / tempo real (precisa de tabela nova)?
8. Dropdown "todos os planos" muito largo — reconstruir como componente customizado (mais robusto) ou só encurtar o texto (mais rápido, remendo)?
9. Relatórios com filtro de data — confirma que topa esse ser tratado como o item maior da lista (não uma tela rápida)?

Fora essas 9 perguntas, o resto já está mapeado e pronto pra começar assim que você der o sinal.
