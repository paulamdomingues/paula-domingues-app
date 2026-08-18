import type { Category, Store, StoreDetails, Story } from '../types';

// Sem imageUrl de propósito: as fotos reais de categoria/loja serão
// cadastradas depois pelo painel admin. Enquanto isso, a UI mostra um
// placeholder no lugar (ver <ImagePlaceholder />).
//
// Capa de categoria (Amanda, 18/08/2026): quando você cadastrar a capa de
// cada categoria no bucket público "capas" do Supabase Storage, é só
// preencher o `imageUrl` abaixo com o nome do arquivo (ou a URL completa) —
// não precisa mexer em mais nada. Formato esperado da URL completa:
// https://iuqpbozkumebumjdmqfc.supabase.co/storage/v1/object/public/capas/<nome-do-arquivo>
// Ex: imageUrl: 'https://iuqpbozkumebumjdmqfc.supabase.co/storage/v1/object/public/capas/alfaiataria.png'
export const categories: Category[] = [
  { id: 'oportunidades', label: 'Oportunidades' },
  { id: 'alfaiataria', label: 'Alfaiataria' },
  { id: 't-shirts', label: 'T-Shirts' },
  { id: 'acessorios', label: 'Acessórios' },
  { id: 'moda-pinterest', label: 'Moda Pinterest' },
  { id: 'boutique', label: 'Boutique' },
  { id: 'jeans', label: 'Jeans' },
  { id: 'plus-size', label: 'Plus Size' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'vestidos', label: 'Vestidos' },
  { id: 'moda-praia', label: 'Moda Praia' },
  { id: 'traje-festa', label: 'Traje Festa' },
];

/** As 4 opções do filtro de localização na tela de Categoria (desktop e mobile). */
export const neighborhoods = ['Brás', '25 de Março', 'Bom Retiro', 'Outros'] as const;
export type Neighborhood = (typeof neighborhoods)[number];

export interface StoreWithCategory extends Store {
  categoryId: string;
  /**
   * Bairro/polo da loja — dado interno, preenchido pelo admin no cadastro,
   * NUNCA exibido pro usuário final. Serve só pro filtro de localização da
   * tela de Categoria (Amanda, 18/08/2026: "não ficará exposto pro usuário,
   * é mais um dado interno, e pra fazer esse filtro funcionar").
   */
  neighborhood: Neighborhood;
}

// Catálogo completo (usado pelas telas de Categoria e Busca). Para
// "Alfaiataria" usei os mesmos nomes/códigos do protótipo no Figma; para as
// demais categorias, nomes fictícios no mesmo estilo, só para preencher a
// grade — troque por dados reais quando o catálogo do painel admin existir.
export const stores: StoreWithCategory[] = [
  // Oportunidades
  { id: 'op-1', code: 'OP-0021', name: 'Outlet Vitrine Viva', categoryLabel: 'Oportunidades', categoryId: 'oportunidades', neighborhood: 'Brás' },
  { id: 'op-2', code: 'OP-0198', name: 'Saldão da Estação', categoryLabel: 'Oportunidades', categoryId: 'oportunidades', neighborhood: '25 de Março' },
  { id: 'op-3', code: 'OP-0355', name: 'Achados & Ofertas', categoryLabel: 'Oportunidades', categoryId: 'oportunidades', neighborhood: 'Bom Retiro' },

  // Alfaiataria (nomes/códigos vindos direto do Figma)
  {
    id: 'al-1',
    code: 'AL-0034',
    name: 'Studio Corte Nobre',
    categoryLabel: 'Alfaiataria',
    categoryId: 'alfaiataria',
    neighborhood: 'Brás',
    details: {
      address: 'Rua Miller, 284 - Brás, São Paulo - SP (Próximo à Feirinha da Concórdia)',
      sizesLine: 'P, M, G, GG ( Grade do 36 ao 44 )',
      plusSizeLine: 'Opções Plus Size: G1 ao G3',
      hours: [
        { label: 'Seg a Sex', value: '06:00 às 16:00' },
        { label: 'Sabado', value: '06:00 às 13:00' },
        { label: 'Domingo', value: 'Fechado' },
      ],
      shippingFrom: 'A partir de 6 peças',
      shippingMethods: 'Correio, transportadora, ônibus',
      wholesaleOnline: 'Online: A partir de 6 peças variadas ou R$300,00',
      wholesaleInPerson: 'presencial: sem minimo',
      retail: 'Sim, apenas presencialmente',
      tags: ['Alfaiataria', 'Plus Size', 'Mínimo 6 Peças', 'Atacado', 'Envia por correios'],
    },
  },
  { id: 'al-2', code: 'AL-1205', name: 'Madame Elegance', categoryLabel: 'Alfaiataria', categoryId: 'alfaiataria', neighborhood: 'Outros' },
  { id: 'al-3', code: 'AL-0089', name: 'Atelier Blazer & Co.', categoryLabel: 'Alfaiataria', categoryId: 'alfaiataria', neighborhood: 'Brás' },
  { id: 'al-4', code: 'AL-0412', name: 'Maison Linho & Ponto', categoryLabel: 'Alfaiataria', categoryId: 'alfaiataria', neighborhood: '25 de Março' },
  { id: 'al-5', code: 'AL-0730', name: 'Primor Alfaiataria', categoryLabel: 'Alfaiataria', categoryId: 'alfaiataria', neighborhood: 'Bom Retiro' },
  { id: 'al-6', code: 'AL-0155', name: 'Concept Blazer Brás', categoryLabel: 'Alfaiataria', categoryId: 'alfaiataria', neighborhood: 'Outros' },
  { id: 'al-7', code: 'AL-1503', name: 'Spazio do Blazer', categoryLabel: 'Alfaiataria', categoryId: 'alfaiataria', neighborhood: 'Brás' },
  { id: 'al-8', code: 'AL-1048', name: 'Via Tailored Feminina', categoryLabel: 'Alfaiataria', categoryId: 'alfaiataria', neighborhood: '25 de Março' },

  // T-Shirts
  { id: 'ts-1', code: 'TS-0027', name: 'Camisetaria Brás', categoryLabel: 'T-Shirts', categoryId: 't-shirts', neighborhood: 'Bom Retiro' },
  { id: 'ts-2', code: 'TS-0364', name: 'Basic Tee Studio', categoryLabel: 'T-Shirts', categoryId: 't-shirts', neighborhood: 'Outros' },
  { id: 'ts-3', code: 'TS-0512', name: 'Malharia Union', categoryLabel: 'T-Shirts', categoryId: 't-shirts', neighborhood: 'Brás' },

  // Acessórios
  { id: 'ac-1', code: 'AC-0744', name: 'Divina Prata & Bijoux', categoryLabel: 'Acessórios', categoryId: 'acessorios', neighborhood: '25 de Março' },
  { id: 'ac-2', code: 'AC-0091', name: 'Charme Acessórios', categoryLabel: 'Acessórios', categoryId: 'acessorios', neighborhood: 'Bom Retiro' },
  { id: 'ac-3', code: 'AC-0268', name: 'Bijoux da Bela', categoryLabel: 'Acessórios', categoryId: 'acessorios', neighborhood: 'Outros' },

  // Moda Pinterest
  { id: 'mp-1', code: 'MP-0630', name: 'Aesthetic Closet', categoryLabel: 'Moda Pinterest', categoryId: 'moda-pinterest', neighborhood: 'Brás' },
  { id: 'mp-2', code: 'MP-0177', name: 'Studio Trend Brás', categoryLabel: 'Moda Pinterest', categoryId: 'moda-pinterest', neighborhood: '25 de Março' },
  { id: 'mp-3', code: 'MP-0459', name: 'Look do Dia Ateliê', categoryLabel: 'Moda Pinterest', categoryId: 'moda-pinterest', neighborhood: 'Bom Retiro' },

  // Boutique
  { id: 'bt-1', code: 'BT-0088', name: 'Boutique Flor de Lis', categoryLabel: 'Boutique', categoryId: 'boutique', neighborhood: 'Outros' },
  { id: 'bt-2', code: 'BT-0245', name: 'Charme Boutique Brás', categoryLabel: 'Boutique', categoryId: 'boutique', neighborhood: 'Brás' },
  { id: 'bt-3', code: 'BT-0501', name: 'Ateliê Grão de Ouro', categoryLabel: 'Boutique', categoryId: 'boutique', neighborhood: '25 de Março' },

  // Jeans
  { id: 'jn-1', code: 'JN-0015', name: 'Denim House Brás', categoryLabel: 'Jeans', categoryId: 'jeans', neighborhood: 'Bom Retiro' },
  { id: 'jn-2', code: 'JN-0233', name: 'Jeanswear Union', categoryLabel: 'Jeans', categoryId: 'jeans', neighborhood: 'Outros' },
  { id: 'jn-3', code: 'JN-0480', name: 'Blue Denim Studio', categoryLabel: 'Jeans', categoryId: 'jeans', neighborhood: 'Brás' },

  // Plus Size
  { id: 'ps-1', code: 'PS-0891', name: 'Bella Curva Moda', categoryLabel: 'Plus Size', categoryId: 'plus-size', neighborhood: '25 de Março' },
  { id: 'ps-2', code: 'PS-0102', name: 'Curves & Co.', categoryLabel: 'Plus Size', categoryId: 'plus-size', neighborhood: 'Bom Retiro' },
  { id: 'ps-3', code: 'PS-0357', name: 'Amplitude Moda', categoryLabel: 'Plus Size', categoryId: 'plus-size', neighborhood: 'Outros' },

  // Fitness
  { id: 'ft-1', code: 'FT-0045', name: 'Move Fit Wear', categoryLabel: 'Fitness', categoryId: 'fitness', neighborhood: 'Brás' },
  { id: 'ft-2', code: 'FT-0290', name: 'Studio Ativa Fitness', categoryLabel: 'Fitness', categoryId: 'fitness', neighborhood: '25 de Março' },
  { id: 'ft-3', code: 'FT-0518', name: 'Confecção Performance', categoryLabel: 'Fitness', categoryId: 'fitness', neighborhood: 'Bom Retiro' },

  // Vestidos
  { id: 'vs-1', code: 'VS-0052', name: 'Ateliê Doce Vestido', categoryLabel: 'Vestidos', categoryId: 'vestidos', neighborhood: 'Outros' },
  { id: 'vs-2', code: 'VS-0186', name: 'Vestidos da Ana', categoryLabel: 'Vestidos', categoryId: 'vestidos', neighborhood: 'Brás' },
  { id: 'vs-3', code: 'VS-0409', name: 'Studio Flor Vestidos', categoryLabel: 'Vestidos', categoryId: 'vestidos', neighborhood: '25 de Março' },

  // Moda Praia
  { id: 'pr-1', code: 'PR-0071', name: 'Bikini Brás', categoryLabel: 'Moda Praia', categoryId: 'moda-praia', neighborhood: 'Bom Retiro' },
  { id: 'pr-2', code: 'PR-0284', name: 'Sol & Mar Confecções', categoryLabel: 'Moda Praia', categoryId: 'moda-praia', neighborhood: 'Outros' },
  { id: 'pr-3', code: 'PR-0466', name: 'Costa Moda Praia', categoryLabel: 'Moda Praia', categoryId: 'moda-praia', neighborhood: 'Brás' },

  // Traje Festa
  { id: 'tf-1', code: 'TF-0955', name: 'Imperial Gala', categoryLabel: 'Traje Festa', categoryId: 'traje-festa', neighborhood: '25 de Março' },
  { id: 'tf-2', code: 'TF-0128', name: 'Ateliê Noite Encantada', categoryLabel: 'Traje Festa', categoryId: 'traje-festa', neighborhood: 'Bom Retiro' },
  { id: 'tf-3', code: 'TF-0347', name: 'Glamour Festa Brás', categoryLabel: 'Traje Festa', categoryId: 'traje-festa', neighborhood: 'Outros' },
];

// "Chegaram Recentemente" na Home: 8 lojas, mobile e desktop (Amanda,
// 18/08/2026: o Figma desktop mostra 12 só como mock/placeholder repetido —
// "como se tratam de dados fictícios ainda [...] mantenha só os 8 que você
// tem nos dois, mas respeitando a organização imposta"). Esses cards vão
// ser adicionados/editados/excluídos pelo painel admin depois, com
// fotos/info vindas do Supabase — o layout (alinhado no topo à esquerda,
// flex-wrap) já funciona com qualquer quantidade, então não depende de ser
// exatamente 8 ou 12.
export const recentStores: Store[] = [
  stores.find((s) => s.code === 'AL-0034')!,
  stores.find((s) => s.code === 'PS-0891')!,
  stores.find((s) => s.code === 'FT-0045')!,
  stores.find((s) => s.code === 'AC-0744')!,
  stores.find((s) => s.code === 'VS-0052')!,
  stores.find((s) => s.code === 'MP-0630')!,
  stores.find((s) => s.code === 'JN-0015')!,
  stores.find((s) => s.code === 'TF-0955')!,
];

/**
 * Para lojas que ainda não têm os detalhes reais cadastrados (todo o
 * catálogo, exceto o exemplo "Studio Corte Nobre" vindo do Figma), a
 * página da loja mostra esse conteúdo genérico em vez de campos vazios —
 * é só um texto de espera, sem inventar endereço/telefone de verdade.
 */
export function getStoreDetails(store: Store): StoreDetails {
  if (store.details) return store.details;
  return {
    address: 'Endereço ainda não cadastrado pela loja.',
    sizesLine: 'Consulte a loja para a tabela de tamanhos.',
    hours: [{ label: 'Horário', value: 'A confirmar com a loja' }],
    shippingFrom: 'A confirmar',
    shippingMethods: 'Consulte a loja para opções de envio',
    wholesaleOnline: 'Consulte a loja',
    wholesaleInPerson: 'Consulte a loja',
    retail: 'Consulte a loja',
    tags: [store.categoryLabel],
  };
}

// "populares" é a ordenação padrão em Busca e Lojas (Amanda, 18/08/2026:
// com dado real, vai ser baseado em fornecedores mais acessados/clicados/
// favoritados via analytics — ainda não temos esse dado, então por enquanto
// `sortStores` simula mantendo a ordem original do catálogo, igual
// "recentes". Trocar a lógica em `src/lib/sortStores.ts` quando o dado de
// popularidade existir de verdade).
export const sortOptions = [
  { id: 'populares', label: 'Mais populares' },
  { id: 'recentes', label: 'Mais recentes' },
  { id: 'antigos', label: 'Mais antigos' },
  { id: 'az', label: 'Ordem: A-Z' },
  { id: 'za', label: 'Ordem: Z-A' },
] as const;

export type SortOptionId = (typeof sortOptions)[number]['id'];

// Stories exibidos no player de tela cheia aberto ao clicar no mini-player
// da Home (ver `StoryPlayerOverlay`). `videoUrl: null` de propósito: os
// vídeos reais serão cadastrados depois pelo painel admin (mesmo padrão de
// `imageUrl` nas lojas/categorias acima) — enquanto isso a UI mostra um
// estado neutro no lugar do player em vez de quebrar. `linkUrl`/`linkLabel`
// também ficam vazios por enquanto; quando o admin cadastrar um link pra um
// story específico, o player mostra o botão de call-to-action sobre o vídeo.
export const stories: Story[] = [
  { id: 'story-1', videoUrl: null, linkUrl: null, linkLabel: null },
  { id: 'story-2', videoUrl: null, linkUrl: null, linkLabel: null },
  { id: 'story-3', videoUrl: null, linkUrl: 'https://wa.me/5511999999999', linkLabel: 'Ver essa loja' },
  { id: 'story-4', videoUrl: null, linkUrl: null, linkLabel: null },
  { id: 'story-5', videoUrl: null, linkUrl: null, linkLabel: null },
];
