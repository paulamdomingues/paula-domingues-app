// Edge Function: webhook direto da Hubla -> tabela `allowed_users`.
//
// Por que isso existe (em vez de continuar só pelo Make): depois de uma
// investigação longa (20/08/2026), confirmamos que as chamadas da Make pra
// Supabase usando a "Secret key" nova (sb_secret_...) chegavam com 200 OK
// mas gravavam ZERO linhas (corpo da resposta = "[]"), sem nenhum erro de
// RLS — testamos manualmente no banco que o service_role sozinho grava sem
// problema nenhum, e que anon/authenticated dão erro explícito de RLS (não
// um 200 silencioso). Ou seja, o problema é específico de como esse projeto
// resolve a Secret key nova pra papel de banco (algo de infraestrutura da
// própria Supabase/Make, não do desenho da automação). Pra não continuar
// gastando tempo (e operações do Make, que são limitadas no plano Free da
// Amanda) tentando contornar isso, decidimos ir direto: Hubla chama essa
// função aqui, que já usa a `SUPABASE_SERVICE_ROLE_KEY` (secret automático
// de toda Edge Function, é a chave antiga em formato JWT — a mesma que já
// funciona hoje em `invite-team-member` e `bunny-video-upload`), sem passar
// pelo Make. O Make e o cenário "Hubla → Supabase" continuam existindo como
// registro/backup, mas ficam pausados.
//
// Eventos tratados (ver docs da Hubla, lidas em 20/08/2026):
// - subscription.activated: primeira liberação de acesso. Define plano
//   (billingCycleMonths 3 = trimestral, 12 = anual) e grava os dados da
//   cobrança embutidos em `event.subscription.lastInvoice`.
// - invoice.payment_succeeded: renovação. A assinatura já está `active` e
//   NÃO dispara `subscription.activated` de novo nas renovações — só esse
//   evento avisa que uma nova cobrança foi paga. Atualiza só os dados da
//   cobrança, sem mexer no campo `plan`.
// - subscription.deactivated: créditos da assinatura acabaram -> corta
//   acesso (is_active = false).
// - invoice.refunded / refund_request.accepted: reembolso -> corta acesso.
// Qualquer outro `type` é só confirmado (200) e ignorado, sem gravar nada.
//
// Autenticação: a Hubla manda o token no header `x-hubla-token` (comparação
// simples de string, não é HMAC). O valor esperado fica no secret
// `HUBLA_WEBHOOK_TOKEN` (configurar com `supabase secrets set
// HUBLA_WEBHOOK_TOKEN=...` assim que a Amanda pegar o token real no painel
// da Hubla). ENQUANTO esse secret não estiver configurado, a função aceita
// qualquer chamada (pra não travar os testes manuais agora) — isso PRECISA
// ser apertado antes de ligar o webhook de verdade na Hubla.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const HUBLA_WEBHOOK_TOKEN = Deno.env.get('HUBLA_WEBHOOK_TOKEN');

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function planFromBillingCycle(billingCycleMonths: unknown): string | null {
  if (billingCycleMonths === 3) return 'trimestral';
  if (billingCycleMonths === 12) return 'anual';
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return jsonResponse({ error: 'Servidor sem a service role key configurada.' }, 500);
  }

  // TODO(Amanda): assim que tiver o token real da Hubla, rode
  // `supabase secrets set HUBLA_WEBHOOK_TOKEN=<token>` — a partir daí essa
  // checagem passa a ser obrigatória de verdade.
  if (HUBLA_WEBHOOK_TOKEN) {
    const receivedToken = req.headers.get('x-hubla-token');
    if (receivedToken !== HUBLA_WEBHOOK_TOKEN) {
      return jsonResponse({ error: 'Token inválido.' }, 401);
    }
  }

  let payload: { type?: string; event?: Record<string, any> };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400);
  }

  const type = payload.type;
  const event = payload.event ?? {};

  if (!type) {
    return jsonResponse({ error: 'Campo "type" ausente.' }, 400);
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let row: Record<string, unknown> | null = null;

  if (type === 'subscription.activated') {
    const user = event.user ?? {};
    const subscription = event.subscription ?? {};
    const lastInvoice = subscription.lastInvoice ?? {};
    const email = user.email;
    if (!email) return jsonResponse({ error: 'event.user.email ausente.' }, 400);

    row = {
      email,
      full_name: [user.firstName, user.lastName].filter(Boolean).map((s: string) => s.trim()).join(' ') || null,
      whatsapp: user.phone ?? null,
      plan: planFromBillingCycle(subscription.billingCycleMonths),
      hubla_transaction_id: lastInvoice.id ?? null,
      hubla_payment_method: lastInvoice.paymentMethod ?? null,
      hubla_amount_cents: lastInvoice.amount?.totalCents ?? null,
      purchased_at: lastInvoice.saleDate ?? null,
      is_active: true,
    };
  } else if (type === 'invoice.payment_succeeded') {
    const invoice = event.invoice ?? {};
    const email = invoice.payer?.email;
    if (!email) return jsonResponse({ error: 'event.invoice.payer.email ausente.' }, 400);

    // Renovação: não mexe no `plan`, só atualiza os dados da cobrança.
    row = {
      email,
      hubla_transaction_id: invoice.id ?? null,
      hubla_payment_method: invoice.paymentMethod ?? null,
      hubla_amount_cents: invoice.amount?.totalCents ?? null,
      purchased_at: invoice.saleDate ?? null,
      is_active: true,
    };
  } else if (type === 'subscription.deactivated') {
    const email = event.user?.email;
    if (!email) return jsonResponse({ error: 'event.user.email ausente.' }, 400);

    row = { email, is_active: false };
  } else if (type === 'invoice.refunded' || type === 'refund_request.accepted') {
    const email = event.invoice?.payer?.email || event.user?.email;
    if (!email) return jsonResponse({ error: 'Email do pagador ausente no payload.' }, 400);

    row = { email, is_active: false };
  } else {
    // Evento que não gerenciamos (ex: subscription.created antes do
    // pagamento) — confirma recebimento sem gravar nada.
    return jsonResponse({ received: true, ignored: type }, 200);
  }

  const { error } = await adminClient.from('allowed_users').upsert(row, { onConflict: 'email' });

  if (error) {
    return jsonResponse({ error: `Falha ao gravar em allowed_users: ${error.message}` }, 500);
  }

  return jsonResponse({ success: true, type }, 200);
});
