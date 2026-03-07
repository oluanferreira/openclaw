/* eslint-disable i18next/no-literal-string */
import { getTranslation } from "@workspace/i18n/server";

export const PrivacyPolicy = async () => {
  const { i18n } = await getTranslation({ ns: "common" });
  const locale = i18n.language;
  const isPt = locale === "pt";

  return (
    <article className="prose prose-neutral dark:prose-invert mx-auto max-w-4xl px-6 py-12">
      {isPt ? <PrivacyPT /> : <PrivacyEN />}
    </article>
  );
};

const PrivacyEN = () => (
  <>
    <h1>Privacy Policy</h1>
    <p className="text-muted-foreground text-sm">
      Last updated: March 7, 2026
    </p>

    <h2>1. Data Controller</h2>
    <p>
      The data controller for your personal information is:
    </p>
    <p>
      <strong>LPJ SERVICES LLC</strong>
      <br />
      United States
      <br />
      Email:{" "}
      <a href="mailto:lpjservicesllc@gmail.com">lpjservicesllc@gmail.com</a>
    </p>

    <h2>2. Data We Collect</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Source</th>
          <th>Encrypted</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Name, email, avatar</td>
          <td>Google/GitHub OAuth</td>
          <td>No</td>
        </tr>
        <tr>
          <td>IP address, User-Agent</td>
          <td>Session (automatic)</td>
          <td>No</td>
        </tr>
        <tr>
          <td>Stripe Customer/Subscription ID</td>
          <td>Stripe webhooks</td>
          <td>No</td>
        </tr>
        <tr>
          <td>API keys (OpenAI, Anthropic, Google AI)</td>
          <td>User input</td>
          <td>Yes (AES-256-GCM)</td>
        </tr>
        <tr>
          <td>Support tickets and attachments</td>
          <td>User input</td>
          <td>No</td>
        </tr>
        <tr>
          <td>Error and performance data</td>
          <td>Sentry SDK</td>
          <td>No</td>
        </tr>
        <tr>
          <td>Cookies (session, locale, consent)</td>
          <td>Automatic</td>
          <td>No</td>
        </tr>
      </tbody>
    </table>

    <h2>3. Legal Basis for Processing</h2>
    <p>We process your data based on the following legal grounds:</p>
    <ul>
      <li>
        <strong>Consent:</strong> Cookie preferences, marketing communications
      </li>
      <li>
        <strong>Contract performance:</strong> Account creation, service
        delivery, billing
      </li>
      <li>
        <strong>Legitimate interest:</strong> Service improvement, security,
        fraud prevention
      </li>
      <li>
        <strong>Legal obligation:</strong> Billing records retention, regulatory
        compliance
      </li>
    </ul>

    <h2>4. Purpose of Processing</h2>
    <ul>
      <li>Provide and maintain the Service</li>
      <li>Process payments and manage subscriptions</li>
      <li>Provide customer support</li>
      <li>Monitor and improve service performance</li>
      <li>Detect and prevent fraud and abuse</li>
      <li>Comply with legal obligations</li>
    </ul>

    <h2>5. Sub-processors</h2>
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Purpose</th>
          <th>Country</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Stripe</td>
          <td>Payment processing</td>
          <td>US</td>
        </tr>
        <tr>
          <td>Sentry</td>
          <td>Error tracking &amp; session replay</td>
          <td>US</td>
        </tr>
        <tr>
          <td>Google OAuth</td>
          <td>Authentication</td>
          <td>US</td>
        </tr>
        <tr>
          <td>GitHub OAuth</td>
          <td>Authentication</td>
          <td>US</td>
        </tr>
        <tr>
          <td>Hostinger</td>
          <td>VPS hosting</td>
          <td>LT/US</td>
        </tr>
        <tr>
          <td>OpenAI / Anthropic / Google AI</td>
          <td>AI processing (via user&apos;s keys)</td>
          <td>US</td>
        </tr>
      </tbody>
    </table>

    <h2>6. International Data Transfer</h2>
    <p>
      Your data may be transferred to and processed in the United States. We
      ensure appropriate safeguards are in place, including Standard Contractual
      Clauses (SCCs) where applicable, to protect your data in accordance with
      applicable data protection laws.
    </p>

    <h2>7. Data Retention</h2>
    <ul>
      <li>
        <strong>Account data:</strong> Retained while your account is active,
        plus 6 months after deletion
      </li>
      <li>
        <strong>Billing records:</strong> Retained for 7 years (legal
        requirement)
      </li>
      <li>
        <strong>Server logs:</strong> Retained for 6 months
      </li>
      <li>
        <strong>Support tickets:</strong> Retained while your account is active,
        deleted with account
      </li>
    </ul>

    <h2>8. Security</h2>
    <p>We implement the following security measures:</p>
    <ul>
      <li>API keys encrypted with AES-256-GCM</li>
      <li>TLS encryption for all data in transit</li>
      <li>Read-only filesystem on containers</li>
      <li>Session-based authentication with secure cookies</li>
      <li>Rate limiting on API endpoints</li>
      <li>Regular security updates and monitoring</li>
    </ul>

    <h2>9. Cookies</h2>
    <p>We use the following cookies:</p>
    <ul>
      <li>
        <strong>Session cookie</strong> (necessary): Maintains your
        authenticated session
      </li>
      <li>
        <strong>Locale cookie</strong> (necessary): Stores your language
        preference
      </li>
      <li>
        <strong>Cookie consent</strong> (necessary): Stores your cookie
        preferences
      </li>
      <li>
        <strong>Sentry</strong> (analytics): Error tracking and performance
        monitoring
      </li>
    </ul>

    <h2>10. Your Rights</h2>
    <p>
      Under applicable data protection laws (including LGPD for Brazilian
      users), you have the right to:
    </p>
    <ul>
      <li>
        <strong>Access:</strong> Request a copy of your personal data
      </li>
      <li>
        <strong>Correction:</strong> Request correction of inaccurate data
      </li>
      <li>
        <strong>Deletion:</strong> Request deletion of your data (available
        through Account settings)
      </li>
      <li>
        <strong>Portability:</strong> Request your data in a structured format
      </li>
      <li>
        <strong>Objection:</strong> Object to processing based on legitimate
        interest
      </li>
      <li>
        <strong>Withdraw consent:</strong> Withdraw consent at any time
      </li>
    </ul>
    <p>
      To exercise your rights, contact us at{" "}
      <a href="mailto:lpjservicesllc@gmail.com">lpjservicesllc@gmail.com</a>.
      You may also delete your account entirely through the Account section of
      your dashboard.
    </p>

    <h2>11. Children</h2>
    <p>
      The Service is not intended for individuals under 18 years of age. We do
      not knowingly collect data from children. If we become aware that a child
      has provided us with personal information, we will take steps to delete
      it.
    </p>

    <h2>12. Changes to This Policy</h2>
    <p>
      We may update this Privacy Policy from time to time. Material changes will
      be communicated with at least 30 days prior notice via email or through
      the Service. The &quot;Last updated&quot; date at the top will be revised
      accordingly.
    </p>

    <h2>13. Contact and Complaints</h2>
    <p>
      For questions or complaints about this Privacy Policy, contact us at:{" "}
      <a href="mailto:lpjservicesllc@gmail.com">lpjservicesllc@gmail.com</a>
    </p>
    <p>
      Brazilian users may also file complaints with the National Data Protection
      Authority (ANPD) at{" "}
      <a
        href="https://www.gov.br/anpd"
        target="_blank"
        rel="noopener noreferrer"
      >
        www.gov.br/anpd
      </a>
      .
    </p>
  </>
);

const PrivacyPT = () => (
  <>
    <h1>Política de Privacidade</h1>
    <p className="text-muted-foreground text-sm">
      Última atualização: 7 de março de 2026
    </p>

    <h2>1. Controlador dos Dados</h2>
    <p>
      O controlador dos seus dados pessoais é:
    </p>
    <p>
      <strong>LPJ SERVICES LLC</strong>
      <br />
      Estados Unidos
      <br />
      Email:{" "}
      <a href="mailto:lpjservicesllc@gmail.com">lpjservicesllc@gmail.com</a>
    </p>

    <h2>2. Dados Coletados</h2>
    <table>
      <thead>
        <tr>
          <th>Dado</th>
          <th>Fonte</th>
          <th>Criptografado</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Nome, email, avatar</td>
          <td>Google/GitHub OAuth</td>
          <td>Não</td>
        </tr>
        <tr>
          <td>Endereço IP, User-Agent</td>
          <td>Sessão (automático)</td>
          <td>Não</td>
        </tr>
        <tr>
          <td>Stripe Customer/Subscription ID</td>
          <td>Webhooks Stripe</td>
          <td>Não</td>
        </tr>
        <tr>
          <td>Chaves de API (OpenAI, Anthropic, Google AI)</td>
          <td>Input do usuário</td>
          <td>Sim (AES-256-GCM)</td>
        </tr>
        <tr>
          <td>Tickets de suporte e anexos</td>
          <td>Input do usuário</td>
          <td>Não</td>
        </tr>
        <tr>
          <td>Dados de erro e performance</td>
          <td>Sentry SDK</td>
          <td>Não</td>
        </tr>
        <tr>
          <td>Cookies (sessão, locale, consentimento)</td>
          <td>Automático</td>
          <td>Não</td>
        </tr>
      </tbody>
    </table>

    <h2>3. Base Legal para Processamento</h2>
    <p>Processamos seus dados com base nas seguintes bases legais (LGPD):</p>
    <ul>
      <li>
        <strong>Consentimento:</strong> Preferências de cookies, comunicações de
        marketing
      </li>
      <li>
        <strong>Execução contratual:</strong> Criação de conta, prestação do
        serviço, cobrança
      </li>
      <li>
        <strong>Interesse legítimo:</strong> Melhoria do serviço, segurança,
        prevenção de fraude
      </li>
      <li>
        <strong>Obrigação legal:</strong> Retenção de registros de cobrança,
        conformidade regulatória
      </li>
    </ul>

    <h2>4. Finalidade do Processamento</h2>
    <ul>
      <li>Fornecer e manter o Serviço</li>
      <li>Processar pagamentos e gerenciar assinaturas</li>
      <li>Oferecer suporte ao cliente</li>
      <li>Monitorar e melhorar a performance do serviço</li>
      <li>Detectar e prevenir fraude e abuso</li>
      <li>Cumprir obrigações legais</li>
    </ul>

    <h2>5. Sub-processadores</h2>
    <table>
      <thead>
        <tr>
          <th>Serviço</th>
          <th>Finalidade</th>
          <th>País</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Stripe</td>
          <td>Processamento de pagamentos</td>
          <td>EUA</td>
        </tr>
        <tr>
          <td>Sentry</td>
          <td>Rastreamento de erros e session replay</td>
          <td>EUA</td>
        </tr>
        <tr>
          <td>Google OAuth</td>
          <td>Autenticação</td>
          <td>EUA</td>
        </tr>
        <tr>
          <td>GitHub OAuth</td>
          <td>Autenticação</td>
          <td>EUA</td>
        </tr>
        <tr>
          <td>Hostinger</td>
          <td>Hospedagem VPS</td>
          <td>LT/EUA</td>
        </tr>
        <tr>
          <td>OpenAI / Anthropic / Google AI</td>
          <td>Processamento de IA (via chaves do usuário)</td>
          <td>EUA</td>
        </tr>
      </tbody>
    </table>

    <h2>6. Transferência Internacional de Dados</h2>
    <p>
      Seus dados podem ser transferidos e processados nos Estados Unidos.
      Garantimos salvaguardas adequadas, incluindo Cláusulas Contratuais Padrão
      (SCCs) quando aplicável, para proteger seus dados em conformidade com as
      leis de proteção de dados aplicáveis, incluindo a LGPD.
    </p>

    <h2>7. Retenção de Dados</h2>
    <ul>
      <li>
        <strong>Dados da conta:</strong> Mantidos enquanto sua conta estiver
        ativa, mais 6 meses após exclusão
      </li>
      <li>
        <strong>Registros de cobrança:</strong> Mantidos por 7 anos (exigência
        legal)
      </li>
      <li>
        <strong>Logs do servidor:</strong> Mantidos por 6 meses
      </li>
      <li>
        <strong>Tickets de suporte:</strong> Mantidos enquanto sua conta estiver
        ativa, excluídos com a conta
      </li>
    </ul>

    <h2>8. Segurança</h2>
    <p>Implementamos as seguintes medidas de segurança:</p>
    <ul>
      <li>Chaves de API criptografadas com AES-256-GCM</li>
      <li>Criptografia TLS para todos os dados em trânsito</li>
      <li>Filesystem somente leitura nos containers</li>
      <li>Autenticação baseada em sessão com cookies seguros</li>
      <li>Rate limiting nos endpoints da API</li>
      <li>Atualizações de segurança e monitoramento regulares</li>
    </ul>

    <h2>9. Cookies</h2>
    <p>Utilizamos os seguintes cookies:</p>
    <ul>
      <li>
        <strong>Cookie de sessão</strong> (necessário): Mantém sua sessão
        autenticada
      </li>
      <li>
        <strong>Cookie de locale</strong> (necessário): Armazena sua preferência
        de idioma
      </li>
      <li>
        <strong>Consentimento de cookies</strong> (necessário): Armazena suas
        preferências de cookies
      </li>
      <li>
        <strong>Sentry</strong> (analytics): Rastreamento de erros e
        monitoramento de performance
      </li>
    </ul>

    <h2>10. Direitos do Titular</h2>
    <p>
      Sob a LGPD (Lei Geral de Proteção de Dados, Lei 13.709/2018), você tem
      direito a:
    </p>
    <ul>
      <li>
        <strong>Acesso:</strong> Solicitar uma cópia dos seus dados pessoais
      </li>
      <li>
        <strong>Correção:</strong> Solicitar correção de dados incorretos
      </li>
      <li>
        <strong>Exclusão:</strong> Solicitar exclusão dos seus dados (disponível
        nas configurações da Conta)
      </li>
      <li>
        <strong>Portabilidade:</strong> Solicitar seus dados em formato
        estruturado
      </li>
      <li>
        <strong>Oposição:</strong> Opor-se ao processamento baseado em
        interesse legítimo
      </li>
      <li>
        <strong>Revogação do consentimento:</strong> Revogar consentimento a
        qualquer momento
      </li>
    </ul>
    <p>
      Para exercer seus direitos, entre em contato pelo e-mail{" "}
      <a href="mailto:lpjservicesllc@gmail.com">lpjservicesllc@gmail.com</a>.
      Você também pode excluir sua conta inteiramente pela seção Conta do seu
      painel.
    </p>

    <h2>11. Crianças</h2>
    <p>
      O Serviço não é destinado a menores de 18 anos. Não coletamos dados de
      crianças intencionalmente. Se tomarmos conhecimento de que uma criança nos
      forneceu dados pessoais, tomaremos providências para excluí-los.
    </p>

    <h2>12. Alterações nesta Política</h2>
    <p>
      Podemos atualizar esta Política de Privacidade periodicamente. Alterações
      materiais serão comunicadas com pelo menos 30 dias de antecedência por
      e-mail ou pelo Serviço. A data de &quot;Última atualização&quot; no topo
      será revisada conforme necessário.
    </p>

    <h2>13. Contato e Reclamações</h2>
    <p>
      Para dúvidas ou reclamações sobre esta Política de Privacidade, entre em
      contato pelo e-mail:{" "}
      <a href="mailto:lpjservicesllc@gmail.com">lpjservicesllc@gmail.com</a>
    </p>
    <p>
      Usuários brasileiros também podem registrar reclamações junto à Autoridade
      Nacional de Proteção de Dados (ANPD) em{" "}
      <a
        href="https://www.gov.br/anpd"
        target="_blank"
        rel="noopener noreferrer"
      >
        www.gov.br/anpd
      </a>
      .
    </p>
  </>
);
