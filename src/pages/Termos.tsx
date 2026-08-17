import { useNavigate } from 'react-router-dom';
import { PiArrowLeft } from 'react-icons/pi';
import Logo from '../components/Logo';

/**
 * Termos de Uso + Política de Privacidade (as duas partes do documento do
 * Figma, "Perfil - Termos"). Fica fora do fluxo protegido de propósito —
 * tanto o rodapé de Login/Criar Conta quanto o menu de Perfil apontam pra
 * cá — porque um usuário sem conta também precisa poder ler antes de se
 * cadastrar.
 *
 * Os campos entre colchetes (ex: [NOME_DO_APLICATIVO], [INSERIR_EMAIL_DE_SUPORTE])
 * vieram assim do texto original no Figma — são dados reais do negócio da
 * Amanda (CNPJ, e-mail de suporte, WhatsApp, data de vigência) que preciso
 * que ela preencha; não inventei nenhum desses valores.
 */
export default function Termos() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col items-center gap-8 bg-screen-bg px-6 py-10">
      <div className="flex w-full flex-col items-center gap-8">
        <Logo />
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-full items-center gap-2 font-body text-[16px] tracking-[0.8px] text-main-red-700"
        >
          <PiArrowLeft className="size-4" />
          Voltar
        </button>
      </div>

      <div className="flex w-full flex-col gap-4">
        <div className="w-full rounded-lg border border-accent-yellow/60 bg-accent-yellow/10 p-3">
          <p className="font-body text-[13px] leading-[1.4] tracking-[0.65px] text-gray-800">
            Os trechos entre colchetes (como [NOME_DO_APLICATIVO] ou [INSERIR_EMAIL_DE_SUPORTE]) são dados reais
            do seu negócio que ainda precisam ser preenchidos — CNPJ/CPF, e-mails, WhatsApp de suporte e a data de
            vigência. Assim que você me passar essas informações eu atualizo o texto.
          </p>
        </div>

        <h1 className="font-display font-bold text-[26px] leading-[1.15] tracking-[0.78px] text-base-black">
          TERMOS DE USO E POLÍTICA DE PRIVACIDADE
        </h1>
        <p className="font-body text-[14px] tracking-[0.7px] text-base-black">Última atualização: [DATA_ATUAL]</p>
        <p className="font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
          Bem-vindo(a) ao [NOME_DO_APLICATIVO]. Ao cadastrar-se e utilizar nossa plataforma, você concorda
          expressamente com os Termos de Uso e a Política de Privacidade descritos abaixo. Recomendamos a leitura
          atenta deste documento.
        </p>

        <section className="flex w-full flex-col gap-3">
          <h2 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">PARTE I – TERMOS DE USO</h2>

          <h3 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">1. Objeto do Aplicativo</h3>
          <p className="font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            O [NOME_DO_APLICATIVO] é uma plataforma digital que funciona exclusivamente como um catálogo
            informativo de curadoria de fornecedores e conteúdos direcionados ao mercado de moda.
          </p>
          <p className="font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            Atenção: O [NOME_DO_APLICATIVO] NÃO é uma loja virtual, NÃO comercializa produtos físicos, NÃO
            intermediamos pagamentos de mercadorias e NÃO realiza a entrega de pedidos.
          </p>

          <h3 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">
            2. Isenção Total de Responsabilidade Sobre Transações
          </h3>
          <ul className="list-disc space-y-2 pl-5 font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            <li>
              Contato Direto: A comunicação, negociação, compra e pagamento de produtos listados no aplicativo
              ocorrem exclusivamente fora da plataforma, por meio dos canais oficiais dos próprios fornecedores
              (como WhatsApp, Instagram, sites próprios ou atendimento presencial).
            </li>
            <li>
              Ausência de Garantia Comercial: A empresa [RAZÃO_SOCIAL_OU_NOME_DA_DONA] não se responsabiliza por:
              <ul className="list-disc space-y-1 pl-5 pt-1">
                <li>Qualidade, disponibilidade, defeitos ou divergências nos produtos adquiridos junto aos fornecedores;</li>
                <li>Atrasos na entrega, extravios ou problemas logísticos;</li>
                <li>Alterações de preços, prazos de envio ou condições de pagamento aplicadas pelos fornecedores;</li>
                <li>Eventuais prejuízos financeiros ou desacordos comerciais entre o usuário e a loja parceira/fornecedor.</li>
              </ul>
            </li>
            <li>
              Dever de Cautela do Usuário: O usuário reconhece que é de sua inteira responsabilidade conferir as
              informações da loja, CNPJ, dados bancários e reputação antes de efetuar qualquer pagamento direto a
              terceiros.
            </li>
          </ul>

          <h3 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">3. Planos, Assinaturas e Acesso</h3>
          <ul className="list-disc space-y-2 pl-5 font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            <li>Modelo de Assinatura: O acesso integral ao catálogo e conteúdos é concedido mediante assinatura (Trimestral ou Anual).</li>
            <li>
              Processamento de Pagamentos da Assinatura: Todo o processamento de pagamento da assinatura do
              aplicativo, cobrança recorrente, emissão de cobranças e gestão de cancelamento da assinatura são
              realizados por meio da plataforma parceira Kiwify. O aplicativo não armazena dados de cartão de
              crédito ou informações financeiras do usuário.
            </li>
            <li>
              Acesso Pessoal e Intransferível: A conta é de uso individual. É expressamente proibido o
              compartilhamento de logins, comercialização de acessos ou extração automatizada de dados (scraping)
              do catálogo, sob pena de bloqueio imediato sem direito a reembolso.
            </li>
          </ul>

          <h3 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">4. Propriedade Intelectual</h3>
          <p className="font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            Todo o conteúdo disponibilizado no aplicativo — incluindo marcas, textos, layout, ilustrações, ícones,
            vídeos e curadoria — é de propriedade exclusiva de [RAZÃO_SOCIAL_OU_NOME_DA_DONA]. É proibida a
            reprodução, cópia ou distribuição não autorizada do material.
          </p>
        </section>

        <section className="flex w-full flex-col gap-3">
          <h2 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">
            PARTE II – POLÍTICA DE PRIVACIDADE E DADOS
          </h2>

          <h3 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">5. Coleta e Armazenamento de Dados Pessoais</h3>
          <p className="font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            Coletamos apenas os dados essenciais para o funcionamento da sua conta no aplicativo:
          </p>
          <ul className="list-disc space-y-2 pl-5 font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            <li>Dados de Cadastro: Nome completo, e-mail e telefone/WhatsApp.</li>
            <li>
              Dados Sensíveis: O aplicativo NÃO coleta, solicita ou armazena dados pessoais sensíveis (como
              origem racial, convicções religiosas, dados de saúde, etc.) e nem dados de pagamento (cartões de
              crédito).
            </li>
          </ul>

          <h3 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">
            6. Uso de Tecnologias de Rastreamento (Cookies e Pixels)
          </h3>
          <ul className="list-disc space-y-2 pl-5 font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            <li>
              Captura para Anúncios: Utilizamos tecnologias de rastreamento (como Pixels da Meta/Facebook e tags
              do Google) em nossas páginas de vendas e fluxos de cadastro externos para mensuração de campanhas de
              marketing e captação de novos usuários (leads).
            </li>
            <li>
              Experiência Interna sem Anúncios: O ambiente interno do aplicativo NÃO exibe anúncios ou banners de
              terceiros, utilizando dados apenas para o correto funcionamento da sua sessão e preferências de
              navegação.
            </li>
          </ul>

          <h3 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">7. Compartilhamento de Dados</h3>
          <p className="font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            Seus dados de cadastro (nome e e-mail) não são vendidos a terceiros. Podem ser compartilhados
            estritamente com fornecedores de tecnologia essenciais para a operação do aplicativo (como servidores
            de hospedagem, plataformas de envio de e-mail e a própria Kiwify para validação de acesso ativo).
          </p>

          <h3 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">8. Seus Direitos (LGPD)</h3>
          <p className="font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            Você tem o direito de solicitar a confirmação, alteração ou exclusão dos seus dados cadastrais
            armazenados em nossos bancos de dados a qualquer momento, enviando uma solicitação para o nosso
            suporte.
          </p>
        </section>

        <section className="flex w-full flex-col gap-3">
          <h2 className="font-body font-bold text-[14px] tracking-[0.7px] text-base-black">
            PARTE III – CANAL DE ATENDIMENTO E SUPORTE
          </h2>
          <p className="font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            Para dúvidas sobre o aplicativo, problemas de acesso, solicitações de dados ou informações sobre o
            serviço, entre em contato através dos canais oficiais:
          </p>
          <ul className="list-disc space-y-2 pl-5 font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            <li>Responsável pelo App: [NOME_DA_EMPRESA_OU_DONA]</li>
            <li>CNPJ/CPF: [INSERIR_CNPJ_OU_CPF]</li>
            <li>E-mail de Suporte: [INSERIR_EMAIL_DE_SUPORTE]</li>
            <li>WhatsApp de Atendimento: [INSERIR_NUMERO_WHATSAPP]</li>
          </ul>
          <p className="font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
            Ao utilizar o [NOME_DO_APLICATIVO], você declara que leu, compreendeu e concorda com todos os termos
            acima.
          </p>
        </section>
      </div>
    </div>
  );
}
