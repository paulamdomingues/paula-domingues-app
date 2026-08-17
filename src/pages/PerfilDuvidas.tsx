import ScreenHeader from '../components/ScreenHeader';

const faqs = [
  {
    question: 'Como faço para comprar as peças dos fornecedores?',
    answer:
      'O aplicativo é um catálogo exclusivo de curadoria. Para comprar, basta clicar no fornecedor desejado para acessar os contatos diretos (WhatsApp, Instagram ou catálogo da loja) e negociar diretamente com eles.',
  },
  {
    question: 'O aplicativo cobra comissão sobre as minhas compras no Brás?',
    answer:
      'Não! Toda a negociação e pagamento são feitos direto com a loja parceira, sem nenhuma comissão ou taxa intermediária do aplicativo. Sua assinatura dá acesso ilimitado às informações e contatos do catálogo.',
  },
  {
    question: 'Os fornecedores do catálogo enviam para todo o Brasil?',
    answer:
      'A maioria dos fornecedores listados envia por correios, transportadoras ou ônibus de excursão. No card de cada loja, você encontra as informações de envio e o pedido mínimo exigido por elas.',
  },
  {
    question: 'Onde gerencio minha assinatura ou dados de pagamento?',
    answer:
      'O processamento e gerenciamento da sua assinatura (trimestral ou anual) é realizado com total segurança pela plataforma Kiwify. Você pode gerenciar seu plano acessando o link da Kiwify disponível na aba Perfil > Meu Plano.',
  },
  {
    question: 'Com que frequência novos fornecedores e conteúdos são adicionados?',
    answer:
      'Nosso catálogo e a aba de Stories são atualizados semanalmente com novos achados, lojas verificadas e conteúdos estratégicos para o seu negócio!',
  },
];

export default function PerfilDuvidas() {
  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8 lg:px-[156px] lg:py-10">
      <ScreenHeader title="Dúvidas Frequentes" />

      <div className="flex w-full flex-col gap-6 lg:mx-auto lg:max-w-[1128px]">
        {faqs.map((item, index) => (
          <div key={item.question} className="flex w-full flex-col gap-1">
            <p className="font-display font-bold text-[22px] leading-[1.2] tracking-[0.66px] text-base-black">
              ❓ {index + 1}. {item.question}
            </p>
            <p className="font-body text-[16px] leading-[1.35] tracking-[0.8px] text-base-black">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
