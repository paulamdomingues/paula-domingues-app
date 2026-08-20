import { useRef, useState, type ChangeEvent } from 'react';
import { PiUploadSimple } from 'react-icons/pi';
import { XCircleIcon } from '../icons';
import { supabase } from '../../lib/supabaseClient';

interface CadastrarStoryModalProps {
  onCancel: () => void;
  /** Devolve o `videoId` (guid da Bunny) já com o vídeo enviado — o pai cria a linha em `stories`. */
  onSaved: (result: { title: string; videoId: string }) => void;
}

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime']; // MP4, MOV

/**
 * "Cadastrar Story" (Figma: `modal - cadastrar story`, node 1160:10842 —
 * a mesma referência visual que montei direto no Figma antes de começar a
 * codar o painel). Só 2 campos de verdade: Título* (confirmado com a
 * Amanda — "na modal prefiro titulo a nome") e "Cadastrado em", que é só
 * informativo (data/hora atual, não é um input).
 *
 * O envio do arquivo chama a Edge Function `bunny-video-upload`, que cria o
 * vídeo na Bunny Stream e sobe os bytes — a AccessKey da Bunny nunca passa
 * pelo navegador. O componente pai (`AdminStories`) só recebe de volta o
 * `videoId` já pronto e cria a linha em `stories`.
 */
export default function CadastrarStoryModal({ onCancel, onSaved }: CadastrarStoryModalProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const now = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Formato não aceito — envie um arquivo MOV ou MP4.');
      return;
    }
    setError(null);
    setFile(selected);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Informe o título do story.');
      return;
    }
    if (!file) {
      setError('Selecione o vídeo do story.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setError('Sessão expirada — faça login de novo.');
        return;
      }

      const body = new FormData();
      body.append('title', title.trim());
      body.append('file', file);

      const { data, error: fnError } = await supabase.functions.invoke<{
        videoId?: string;
        error?: string;
      }>('bunny-video-upload', { body });

      if (fnError || !data?.videoId) {
        setError(data?.error || fnError?.message || 'Não foi possível enviar o vídeo. Tente novamente.');
        return;
      }

      onSaved({ title: title.trim(), videoId: data.videoId });
    } catch {
      setError('Não foi possível enviar o vídeo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/40 px-6">
      <div className="flex w-full max-w-[407px] flex-col gap-6 rounded-2xl bg-base-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] font-bold tracking-[0.6px] text-main-dark-900">Cadastrar Story</h2>
          <button type="button" aria-label="Fechar" onClick={onCancel}>
            <XCircleIcon className="size-6 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">envie o vídeo do story (MOV ou MP4)</p>
          <input ref={inputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-[184px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center"
          >
            {file ? (
              <>
                <PiUploadSimple className="size-[30px] text-main-red-600" />
                <span className="max-w-[300px] truncate font-body text-[14px] text-gray-700">{file.name}</span>
                <span className="font-body text-[12px] text-gray-400">Toque pra trocar o vídeo</span>
              </>
            ) : (
              <>
                <PiUploadSimple className="size-[30px] text-gray-400" />
                <span className="font-body text-[14px] text-gray-600">Selecione o vídeo</span>
              </>
            )}
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">Título*</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do story"
            className="flex h-[50px] w-full items-center rounded-lg border border-gray-200 px-4 font-body text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </label>

        <p className="font-body text-[12px] tracking-[0.6px] text-gray-400">
          Uso interno apenas — não aparece para o usuário do app.
        </p>

        <div className="flex flex-col gap-1.5">
          <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">Cadastrado em</span>
          <div className="flex h-[50px] items-center rounded-lg border border-gray-100 bg-gray-50 px-4">
            <span className="font-body text-[14px] text-gray-500">{now} (automático)</span>
          </div>
        </div>

        {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-[50px] flex-1 items-center justify-center rounded-lg border-[1.5px] border-gray-200 font-body text-[15px] font-bold tracking-[0.75px] text-gray-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex h-[50px] flex-1 items-center justify-center rounded-lg bg-main-red-600 font-body text-[15px] font-bold tracking-[0.75px] text-base-white transition-opacity disabled:opacity-60"
          >
            {saving ? 'Enviando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
