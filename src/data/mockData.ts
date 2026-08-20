import type { Story } from '../types';

// Categorias, lojas, favoritos, ordenação e bairros já vêm de dados reais
// do Supabase (ver `src/lib/catalog.ts`, `src/lib/neighborhoods.ts`,
// `src/lib/sortOptions.ts`) desde 21/08/2026 — este arquivo ficou só com
// `stories`, que continua mock de propósito: o player de stories
// (`StoryPlayerOverlay`) ainda não sabe tocar vídeo do Bunny Stream de
// verdade (guarda só um `videoId`, que precisa de embed via iframe, não de
// um `<video src>` direto) — ver comentário em `StoryPlayerOverlay.tsx`.
// Migrar pra dado real da tabela `stories` só faz sentido depois de
// corrigir esse player, senão o app mostraria vídeo quebrado assim que a
// Amanda cadastrasse o primeiro story de verdade.
export const stories: Story[] = [
  { id: 'story-1', videoUrl: null, linkUrl: null, linkLabel: null },
  { id: 'story-2', videoUrl: null, linkUrl: null, linkLabel: null },
  { id: 'story-3', videoUrl: null, linkUrl: 'https://wa.me/5511999999999', linkLabel: 'Ver essa loja' },
  { id: 'story-4', videoUrl: null, linkUrl: null, linkLabel: null },
  { id: 'story-5', videoUrl: null, linkUrl: null, linkLabel: null },
];
