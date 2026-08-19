/**
 * Resumo (Dashboard) — node 666:10258 / 1140:9067 no Figma.
 *
 * De propósito, NÃO fabriquei números aqui. O Figma mostra 4 cards de
 * métrica ("novas assinantes", "lojas visíveis", "cliques em contato",
 * "stories ativos" — todos com variação "vs ontem"), um gráfico de novos
 * usuários e um "Top 5 Lojas", mas a regra de cálculo desses números
 * (tempo real via query agregada, ou uma tabela de snapshot diário?) ainda
 * é uma pergunta em aberto no plano (`painel-admin-plano.md`, item 4 — não
 * tem log de cliques em contato nem de buscas ainda, por exemplo).
 *
 * Preferi deixar isso como placeholder explícito a inventar números falsos
 * na tela — mesmo princípio do "Chegaram Recentemente" do app cliente
 * (19-20/08/2026): melhor mostrar que não é real do que fingir que é.
 */
export default function AdminDashboard() {
  return (
    <div className="flex w-full flex-col gap-2">
      <h1 className="font-display text-[32px] font-bold tracking-[0.96px] text-main-dark-900">Resumo</h1>
      <p className="max-w-[520px] font-body text-[14px] tracking-[0.7px] text-gray-600">
        Os cards de métrica (novas assinantes, lojas visíveis, cliques em contato, stories ativos), o
        gráfico de novos usuários e o "Top 5 Lojas" dependem de decidir como calcular esses números — ver
        o item 4 do plano. Assim que definirmos isso, essa tela entra de verdade. Por enquanto, o menu
        "Lojas" já está funcionando com dados reais do banco.
      </p>
    </div>
  );
}
