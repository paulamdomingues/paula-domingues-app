// Edge Function: convite de novo membro de equipe (painel admin).
//
// Por quê isso existe (em vez do front chamar `supabase.auth.admin.*`
// direto): criar um usuário no Supabase Auth exige a service_role key —
// essa chave ignora TODO o RLS do projeto, então nunca pode rodar no
// navegador. Aqui ela mora só como o secret automático `SUPABASE_SERVICE_ROLE_KEY`
// que toda Edge Function já recebe (não precisa configurar nada extra no
// dashboard, diferente da Bunny).
//
// Fluxo: confere se quem chamou é master_admin (mesma regra da RLS de
// insert em `team_members`, migration 0001), convida o email via
// `auth.admin.inviteUserByEmail` (isso cria a conta no Auth e manda um
// email com link pra essa pessoa escolher a própria senha — ninguém aqui
// nunca vê/define a senha dela) e, com o `user.id` devolvido, insere a
// linha em `public.team_members` (nome, whatsapp, email, nível de acesso).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const ACCESS_LEVELS = ['master_admin', 'suporte', 'editor_conteudo', 'convidado'];

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Servidor sem a service role key configurada.' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Não autenticado.' }, 401);
  }

  // Client "de quem chamou" — só pra confirmar que é master_admin.
  const callerClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '', {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Sessão inválida.' }, 401);
  }

  const { data: callerRow } = await callerClient
    .from('team_members')
    .select('access_level')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (!callerRow || callerRow.access_level !== 'master_admin') {
    return jsonResponse({ error: 'Só master_admin pode adicionar membros à equipe.' }, 403);
  }

  let body: { fullName?: string; whatsapp?: string; email?: string; accessLevel?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400);
  }

  const fullName = body.fullName?.trim();
  const whatsapp = body.whatsapp?.trim() || null;
  const email = body.email?.trim().toLowerCase();
  const accessLevel = body.accessLevel;

  if (!fullName || !email || !accessLevel || !ACCESS_LEVELS.includes(accessLevel)) {
    return jsonResponse({ error: 'Preencha nome, email e nível de acesso.' }, 400);
  }

  // Client "administrativo" — service_role, ignora RLS. Só existe aqui
  // dentro da função, nunca chega ao navegador.
  const adminClient = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { first_name: fullName.split(' ')[0] },
  });

  if (inviteError || !invited.user) {
    const alreadyExists = inviteError?.message?.toLowerCase().includes('already') ?? false;
    return jsonResponse(
      {
        error: alreadyExists
          ? 'Já existe uma conta cadastrada com esse email.'
          : `Não foi possível convidar: ${inviteError?.message ?? 'erro desconhecido.'}`,
      },
      alreadyExists ? 409 : 502
    );
  }

  const { error: insertError } = await adminClient.from('team_members').insert({
    user_id: invited.user.id,
    full_name: fullName,
    whatsapp,
    email,
    access_level: accessLevel,
  });

  if (insertError) {
    // A conta no Auth já foi criada — não desfazemos automaticamente pra
    // não apagar silenciosamente um convite que a pessoa já pode ter
    // recebido por email; melhor reportar o erro e deixar o master_admin
    // decidir (ex: tentar de novo com outro email, se foi duplicidade).
    return jsonResponse({ error: `Convite enviado, mas falhou ao salvar na equipe: ${insertError.message}` }, 500);
  }

  return jsonResponse({ success: true }, 200);
});
