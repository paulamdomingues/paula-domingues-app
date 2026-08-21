// Edge Function: proxy de upload de vídeo pra Bunny Stream.
//
// Por quê isso existe (em vez do front falar direto com a Bunny): a
// AccessKey da Bunny dá acesso total à library (criar, listar, apagar
// vídeo) — se ela fosse usada direto no navegador, qualquer pessoa que
// abrisse o DevTools conseguiria copiá-la. Por isso ela mora só aqui,
// como secret do servidor (`BUNNY_STREAM_API_KEY`/`BUNNY_LIBRARY_ID`,
// configurados em Project Settings → Edge Functions → Secrets — nunca no
// código nem no `.env` do front).
//
// Fluxo: recebe o arquivo de vídeo + título (multipart/form-data),
// confere se quem chamou é master_admin/convidado (mesma regra do
// `canUpload` em `AdminStories.tsx` e da RLS de insert em `stories`,
// migration 0003 já ajustada em 21/08/2026), cria o vídeo na Bunny e sobe
// os bytes. Devolve só o `videoId` (guid) — o front salva esse guid em
// `stories.video_path`; a URL de exibição é sempre montada a partir dele
// (`getBunnyEmbedUrl`), nunca guardamos URL completa.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BUNNY_API_KEY = Deno.env.get('BUNNY_STREAM_API_KEY');
const BUNNY_LIBRARY_ID = Deno.env.get('BUNNY_LIBRARY_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// 21/08/2026: removido o antigo 'editor_conteudo' (agora renomeado pra
// 'suporte') dessa lista — ele nunca deveria poder subir vídeo de Stories,
// só tinha ficado aqui por engano; o front (`AdminStories.tsx`) já não
// mostra esse botão pra esse nível, isso só fecha a mesma regra no servidor.
const ALLOWED_ACCESS_LEVELS = ['master_admin', 'convidado'];

/**
 * BUG corrigido em 21/08/2026: essa função nunca respondia à requisição
 * `OPTIONS` de preflight que o navegador manda antes de qualquer chamada
 * com o header `Authorization` (é o caso de toda chamada via
 * `supabase.functions.invoke`) — caía no `if (req.method !== 'POST')` e
 * devolvia 405 sem nenhum header de CORS. O navegador bloqueava a
 * requisição de verdade antes até de tentar mandar, e o
 * `supabase-js` reportava isso como "Failed to send a request to the Edge
 * Function" (confirmado nos logs: `OPTIONS | 405 | .../bunny-video-upload`
 * — ou seja, o vídeo nunca chegava a ser enviado). Mesma causa-raiz do
 * `invite-team-member`, corrigida lá também.
 */
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

  if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
    return jsonResponse(
      { error: 'Bunny.net ainda não configurada no servidor (faltam os secrets do projeto).' },
      500
    );
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Não autenticado.' }, 401);
  }

  const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '', {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Sessão inválida.' }, 401);
  }

  const { data: teamRow } = await supabase
    .from('team_members')
    .select('access_level')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (!teamRow || !ALLOWED_ACCESS_LEVELS.includes(teamRow.access_level)) {
    return jsonResponse({ error: 'Sua conta não tem permissão para subir stories.' }, 403);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonResponse({ error: 'Envio inválido — esperado multipart/form-data.' }, 400);
  }

  const file = formData.get('file');
  const title = formData.get('title');

  if (!(file instanceof File) || typeof title !== 'string' || !title.trim()) {
    return jsonResponse({ error: 'Arquivo de vídeo ou título ausente.' }, 400);
  }

  // 1) Cria o "registro" do vídeo na Bunny (ainda sem os bytes).
  const createRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, {
    method: 'POST',
    headers: {
      AccessKey: BUNNY_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: title.trim() }),
  });

  if (!createRes.ok) {
    const detail = await createRes.text();
    return jsonResponse({ error: `Falha ao criar o vídeo na Bunny: ${detail}` }, 502);
  }

  const created = (await createRes.json()) as { guid: string };
  const videoId = created.guid;

  // 2) Sobe os bytes do arquivo pro vídeo criado no passo 1.
  const videoBytes = await file.arrayBuffer();
  const uploadRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    method: 'PUT',
    headers: { AccessKey: BUNNY_API_KEY },
    body: videoBytes,
  });

  if (!uploadRes.ok) {
    const detail = await uploadRes.text();
    return jsonResponse({ error: `Falha ao enviar o arquivo de vídeo: ${detail}` }, 502);
  }

  return jsonResponse({ videoId, libraryId: BUNNY_LIBRARY_ID }, 200);
});
