import { XCircleIcon } from '../icons';
import { getBunnyEmbedUrl } from '../../lib/bunnyStream';

interface StoryPreviewModalProps {
  title: string;
  videoPath: string | null;
  onClose: () => void;
}

/**
 * Mini player (Figma: `mini-video player`, node 627:10176 — moldura
 * 400x711, formato retrato). Usa o player de embed da própria Bunny Stream
 * (iframe) em vez de um `<video>` cru: a Bunny Stream serve em HLS
 * adaptativo, e o embed já sabe montar a URL de streaming certa só a
 * partir do `videoId` — não precisamos descobrir o host da CDN da library.
 */
export default function StoryPreviewModal({ title, videoPath, onClose }: StoryPreviewModalProps) {
  const embedUrl = getBunnyEmbedUrl(videoPath);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/70 px-6">
      <div className="flex w-full max-w-[400px] flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-body text-[15px] font-bold tracking-[0.75px] text-base-white">{title}</p>
          <button type="button" aria-label="Fechar" onClick={onClose}>
            <XCircleIcon className="size-7 text-base-white" />
          </button>
        </div>
        <div className="flex aspect-[400/711] w-full items-center justify-center overflow-hidden rounded-2xl bg-main-dark-900">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              loading="lazy"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              className="size-full border-0"
            />
          ) : (
            <p className="max-w-[240px] text-center font-body text-[14px] text-gray-400">
              Vídeo ainda não disponível — a Bunny.net não está conectada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
