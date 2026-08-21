// Edge Function: apaga um vídeo da Bunny Stream de verdade.
//
// Por quê isso existe (em vez do front chamar a Bunny direto): mesma razão
// do `bunny-video-upload` — a AccessKey da Bunny dá acesso total à library
// (criar, listar, apagar vídeo); se fosse usada direto no navegador,
// qualquer pessoa no DevTools conseguiria copiá-la. Fica só aqui, como
// secret do servidor (`BUNNY_STREAM_API_KEY`/`BUNNY_LIBRARY_ID`).
//
// BUG corrigido em 21/08/2026: até aqui, excluir um story no painel admin
// (botão de lixeira em `AdminStories.tsx`) só apagava a linha da tabela
// `stories` no Supabase — o vídeo continuava para sempre na Bunny Stream,
// acumulando espaço e custo mesmo sem nunca mais aparecer em lugar nenhum
// do app (nem depois de expirar as 24h). Esta função fecha essa ponta: quem
// chama ela apaga o vídeo de verdade na Bunny. Usada tanto na exclusão
// manual quanto na limpeza automática de stories expirados (ver
// `cleanupExpiredStories` em `AdminStories.tsx`).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BUNNY_API_KEY = Deno.env.get('BUNNY_STREAM_API_KEY');
const BUNNY_LIBRARY_ID = Deno.env.get('BUNNY_LIBRARY_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Mesma regra de quem pode mexer em Stories usada no upload
// (`bunny-video-upload`) e no front (`AdminStories.tsx`, `canDelete`).
const ALLOWED_ACCESS_LEVELS = ['master_admin', 'convidado'];

// Headers de CORS desde o início (aprendemos essa lição com o bug do
// upload, 21/08/2026 mais cedo): toda chamada via `supabase.functions.invoke`
// manda um preflight `OPTIONS` por causa do header `Authorization`, e sem
// isso o navegador nunca chega a mandar a requisição de verdade.
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
    return jsonResponse({ error: 'Sua conta não tem permissão para excluir stories.' }, 403);
  }

  let body: { videoId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400);
  }

  const videoId = body.videoId;
  if (!videoId) {
    return jsonResponse({ error: 'videoId ausente.' }, 400);
  }

  const deleteRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    method: 'DELETE',
    headers: { AccessKey: BUNNY_API_KEY },
  });

  // 404 = o vídeo já não existe na Bunny (ex: excluído manualmente antes
  // pelo dashboard, ou a limpeza automática já rodou pra ele) — trata como
  // sucesso: o resultado desejado (vídeo não existir mais) já está garantido,
  // e isso deixa a função idempotente (pode chamar de novo sem erro).
  if (!deleteRes.ok && deleteRes.status !== 404) {
    const detail = await deleteRes.text();
    return jsonResponse({ error: `Falha ao excluir o vídeo na Bunny: ${detail}` }, 502);
  }

  return jsonResponse({ success: true }, 200);
});
