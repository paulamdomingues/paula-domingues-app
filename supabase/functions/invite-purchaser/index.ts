// Edge Function: manda o link de "defina sua senha" pra quem acabou de
// comprar na Hubla.
//
// Contexto (22/08/2026): o cenário do Make "Hubla → Supabase (allowed_users)"
// já grava a compra em `allowed_users` (email, plano, dados da Hubla,
// is_active = true) assim que a Hubla manda o evento `subscription.activated`
// — mas isso é só uma LINHA NO BANCO. Ninguém nunca criava a conta de login
// da pessoa nem mandava um email — ela só ganhava acesso de fato se, por
// conta própria, descobrisse o app e criasse uma conta pelo `/cadastro` com
// o MESMO email da compra (o match é só por email, ver `has_active_access()`).
// A Amanda apontou isso: "ele precisa receber aquele link pra definir a
// senha que ele quer, isso não vem da Hubla" — certo, e essa função é o que
// falta pra fechar esse fluxo.
//
// O que ela faz, chamada pelo Make logo depois de gravar em `allowed_users`:
//   1. Cria a conta no Supabase Auth pra esse email (com uma senha
//      aleatória que ninguém nunca usa/vê — só existe pra satisfazer a API).
//      Já vem com `email_confirm: true` (pulamos o "confirme seu email" —
//      pagou de verdade na Hubla, não precisa confirmar de novo).
//   2. Manda o email de "definir senha" de verdade — reaproveitando o
//      mesmo fluxo de "esqueci minha senha" (`resetPasswordForEmail`, MESMO
//      template "Reset password" que a Amanda já personalizou), que leva
//      pra `/redefinir-senha` (a mesma tela que o app já usa).
//
// Se a pessoa JÁ tinha conta (ex: criou o cadastro antes de comprar), o
// passo 1 falha com "already registered" — nesse caso não mandamos nada:
// ela já tem senha própria, só faltava a Hubla liberar o acesso (que o
// outro branch do Make já fez).
//
// Segurança: diferente de `invite-team-member` (chamada pelo NAVEGADOR de
// um master_admin logado), essa aqui é chamada só pelo Make — não existe
// sessão de usuário pra validar. Em vez disso, exige que quem chamou
// mande a própria `SUPABASE_SERVICE_ROLE_KEY` no header Authorization
// (a mesma chave que a conexão Supabase do Make já usa pra gravar em
// `allowed_users` — só quem tem essa chave consegue chamar essa função).
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

  const { error: recoverError } = await adminClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/redefinir-senha`,
  });

  if (recoverError) {
    // A conta já foi criada nesse ponto — não desfazemos (mesma lógica do
    // `invite-team-member`): melhor reportar o erro do email e deixar a
    // Amanda decidir (a pessoa ainda consegue entrar via "esqueci minha
    // senha" na tela de login normalmente, ela já tem conta agora).
    return jsonResponse(
      { error: `Conta criada, mas falhou ao mandar o email de definir senha: ${recoverError.message}` },
      500
    );
  }

  return jsonResponse({ success: true }, 200);
});
