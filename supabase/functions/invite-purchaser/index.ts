// Edge Function: gera o link de "defina sua senha" pra quem acabou de
// comprar na Hubla, pra ser entregue por WHATSAPP (não mais por email).
//
// Contexto (22/08/2026): o cenário do Make "Hubla → Supabase (allowed_users)"
// já grava a compra em `allowed_users` (email, plano, dados da Hubla,
// is_active = true) assim que a Hubla manda o evento `subscription.activated`
// — mas isso é só uma LINHA NO BANCO. Ninguém nunca criava a conta de login
// da pessoa nem mandava o link pra ela definir senha — ela só ganhava acesso
// de fato se, por conta própria, descobrisse o app e criasse uma conta pelo
// `/cadastro` com o MESMO email da compra (o match é só por email, ver
// `has_active_access()`). A Amanda apontou isso: "ele precisa receber aquele
// link pra definir a senha que ele quer, isso não vem da Hubla" — essa
// função é o que fecha esse fluxo.
//
// Mudança de 27/08/2026 (planejamento de metas de venda + risco de
// bloqueio no WhatsApp): o plano de e-mail do Hostinger (`atendimento@`)
// tem um teto de 100 mensagens a cada 24h (confirmado no próprio painel) —
// baixo demais pra um pico de lançamento pros 280k seguidores da Amanda.
// Em vez de mandar por e-mail (`resetPasswordForEmail`, que dispara o
// envio pelo SMTP e esbarra nesse teto), essa função agora só GERA o link
// via `admin.generateLink` — que não manda nada sozinho, só devolve a URL —
// e devolve esse link na resposta HTTP pro próprio Make pegar e repassar
// pro módulo de WhatsApp que a Amanda já tem no cenário (BotConversa),
// preservando a rotação de texto/horário que ela já configura por lá.
// Sem gargalo de e-mail nesse fluxo: `generateLink` é uma chamada de Admin
// API, não passa pelo mailer do Supabase nem pelo limite de "emails/hora"
// configurado em Authentication → Rate Limits.
//
// AÇÃO NECESSÁRIA NO MAKE (fora do código, painel do Make): no módulo HTTP
// que chama essa função, mapear o campo `actionLink` da resposta pro texto
// da mensagem de WhatsApp enviada em seguida — antes esse módulo só
// precisava confirmar `success`, agora ele carrega o link de verdade.
//
// O e-mail de "definir senha" NÃO foi removido do projeto — quem clicar em
// "esqueci minha senha" na tela de login continua recebendo por e-mail
// normalmente (`resetPasswordForEmail`, chamado ali, sem relação com esta
// função). Só o disparo AUTOMÁTICO pós-compra é que deixou de ser por
// e-mail.
//
// O que essa função faz, chamada pelo Make logo depois de gravar em
// `allowed_users`:
//   1. Cria a conta no Supabase Auth pra esse email (com uma senha
//      aleatória que ninguém nunca usa/vê — só existe pra satisfazer a API).
//      Já vem com `email_confirm: true` (pulamos o "confirme seu email" —
//      pagou de verdade na Hubla, não precisa confirmar de novo).
//   2. Gera o link de "definir senha" (`admin.generateLink`, tipo
//      `recovery` — mesmo destino de sempre, `/redefinir-senha`) e devolve
//      esse link no campo `actionLink` da resposta.
//
// Se a pessoa JÁ tinha conta (ex: criou o cadastro antes de comprar), o
// passo 1 falha com "already registered" — nesse caso não geramos link
// nenhum: ela já tem senha própria, só faltava a Hubla liberar o acesso
// (que o outro branch do Make já fez).
//
// Segurança: diferente de `invite-team-member` (chamada pelo NAVEGADOR de
// um master_admin logado), essa aqui é chamada só pelo Make — não existe
// sessão de usuário pra validar. Em vez disso, exige que quem chamou
// mande a própria `SUPABASE_SERVICE_ROLE_KEY` no header Authorization
// (a mesma chave que a conexão Supabase do Make já usa pra gravar em
// `allowed_users` — só quem tem essa chave consegue chamar essa função).
// O `actionLink` devolvido é sensível (loga a pessoa/define senha sem
// precisar da senha atual) — trafega só nessa resposta HTTP (Make →
// Supabase, autenticada pela service role key) e no módulo de WhatsApp em
// seguida; não fica gravado em nenhuma tabela.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// URL de produção do app cliente (`vercel.json`/`constants.ts`, confirmado
// com a Amanda em 21/08/2026) — pra onde o link do email de "definir senha"
// leva depois de clicado.
const APP_URL = 'https://app.pauladomingues.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Servidor sem a service role key configurada.' }, 500);
  }

  // Só aceita quem manda a service role key — é o mesmo segredo que a
  // conexão Supabase do Make já guarda, então só o cenário do Make (ou
  // alguém com acesso ao projeto) consegue chamar essa função.
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return jsonResponse({ error: 'Não autorizado.' }, 401);
  }

  let body: { email?: string; firstName?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const firstName = body.firstName?.trim();

  if (!email) {
    return jsonResponse({ error: 'Informe o email.' }, 400);
  }

  const adminClient = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    password: crypto.randomUUID(),
    user_metadata: firstName ? { first_name: firstName } : undefined,
  });

  if (createError) {
    const alreadyExists = createError.message?.toLowerCase().includes('already') ?? false;
    if (alreadyExists) {
      // Já tem conta — não manda nada, ela já sabe a própria senha.
      return jsonResponse({ success: true, skipped: 'already_registered' }, 200);
    }
    return jsonResponse({ error: `Não foi possível criar a conta: ${createError.message}` }, 502);
  }

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${APP_URL}/redefinir-senha` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    // A conta já foi criada nesse ponto — não desfazemos (mesma lógica do
    // `invite-team-member`): melhor reportar o erro e deixar a Amanda
    // decidir (a pessoa ainda consegue entrar via "esqueci minha senha" na
    // tela de login normalmente, ela já tem conta agora).
    return jsonResponse(
      { error: `Conta criada, mas falhou ao gerar o link de definir senha: ${linkError?.message ?? 'link ausente na resposta'}` },
      500
    );
  }

  return jsonResponse({ success: true, actionLink: linkData.properties.action_link }, 200);
});
