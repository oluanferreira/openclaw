/* eslint-disable i18next/no-literal-string */
import Link from "next/link";

import { getTranslation } from "@workspace/i18n/server";

export const TermsOfService = async () => {
  const { i18n } = await getTranslation({ ns: "common" });
  const locale = i18n.language;
  return (
    <article className="prose prose-neutral dark:prose-invert mx-auto max-w-4xl px-6 py-12">
      {locale === "pt" ? (
        <TermsPT />
      ) : locale === "es" ? (
        <TermsES />
      ) : (
        <TermsEN />
      )}
    </article>
  );
};

const TermsEN = () => (
  <>
    <h1>Terms of Service</h1>
    <p className="text-muted-foreground text-sm">Last updated: March 7, 2026</p>

    <h2>1. Acceptance of Terms</h2>
    <p>
      By accessing or using ClaWin1Click (&quot;Service&quot;), operated by LPJ
      SERVICES LLC (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), you
      agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do
      not agree to these Terms, do not use the Service.
    </p>

    <h2>2. Description of Service</h2>
    <p>
      ClaWin1Click provides one-click deployment and management of AI-powered
      containers (OpenClaw instances) on cloud infrastructure. The Service
      includes container provisioning, monitoring, configuration management, and
      related features accessible through our web dashboard.
    </p>

    <h2>3. Account and Authentication</h2>
    <p>
      To use the Service, you must authenticate via Google or GitHub OAuth. You
      are responsible for maintaining the security of your account and all
      activities that occur under it. You must be at least 18 years old to use
      the Service.
    </p>

    <h2>4. Subscription and Payment</h2>
    <p>
      The Service operates on a subscription basis processed through Stripe.
      Prices are displayed in BRL (Brazilian Real) for users in Brazil, and USD
      (US Dollars) for all other regions. By subscribing, you authorize
      recurring charges to your payment method. All prices are subject to change
      with 30 days prior notice.
    </p>

    <h2>5. Cancellation Policy</h2>
    <p>
      You may cancel your subscription at any time through your dashboard or the
      Stripe customer portal. Upon cancellation:
    </p>
    <ul>
      <li>
        Your service continues until the end of the current billing period.
      </li>
      <li>
        After the billing period ends, a 3-day grace period applies for failed
        payments.
      </li>
      <li>
        After the grace period, your container is permanently destroyed and all
        associated data is deleted.
      </li>
    </ul>

    <h2>6. Acceptable Use</h2>
    <p>You agree NOT to use the Service to:</p>
    <ul>
      <li>Host, distribute, or generate illegal content</li>
      <li>
        Perform cryptocurrency mining or resource-intensive operations unrelated
        to the Service
      </li>
      <li>Send spam, phishing, or unsolicited communications</li>
      <li>
        Attempt to circumvent security measures or access other users&apos; data
      </li>
      <li>Resell the Service without prior written authorization</li>
      <li>Violate any applicable laws or regulations</li>
    </ul>
    <p>
      Violation of these terms may result in immediate termination of your
      account without refund.
    </p>

    <h2>7. API Keys</h2>
    <p>
      The Service requires you to provide third-party API keys (e.g., OpenAI,
      Anthropic, Google AI) to power your AI instance. These keys are encrypted
      using AES-256-GCM and stored securely. You are solely responsible for:
    </p>
    <ul>
      <li>The security and validity of your API keys</li>
      <li>
        Any charges incurred by third-party providers through usage of your keys
      </li>
      <li>
        Compliance with the terms of service of the respective API providers
      </li>
    </ul>

    <h2>8. Intellectual Property</h2>
    <p>
      The Service, including its design, code, branding, and documentation, is
      the intellectual property of LPJ SERVICES LLC. OpenClaw is open-source
      software under its own license. Your data and configurations remain your
      property.
    </p>

    <h2>9. Service Availability</h2>
    <p>
      We strive to provide reliable service but do not guarantee any specific
      uptime percentage. The Service is provided on a &quot;best-effort&quot;
      basis. We may perform maintenance, updates, or experience outages that
      temporarily affect availability. We will endeavor to notify users of
      planned maintenance in advance.
    </p>

    <h2>10. Limitation of Liability</h2>
    <p>
      TO THE MAXIMUM EXTENT PERMITTED BY LAW, LPJ SERVICES LLC SHALL NOT BE
      LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
      DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR
      GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
    </p>
    <p>
      Our total liability for any claim arising from or related to the Service
      shall not exceed the amount paid by you in the 12 months preceding the
      claim.
    </p>

    <h2>11. Indemnification</h2>
    <p>
      You agree to indemnify and hold harmless LPJ SERVICES LLC, its officers,
      directors, and employees from any claims, losses, or damages arising from
      your use of the Service, violation of these Terms, or infringement of any
      third-party rights.
    </p>

    <h2>12. Privacy</h2>
    <p>
      Your use of the Service is also governed by our{" "}
      <Link href="/en/privacy">Privacy Policy</Link>, which describes how we
      collect, use, and protect your personal information.
    </p>

    <h2>13. Age Restriction</h2>
    <p>
      The Service is intended for users who are at least 18 years old. By using
      the Service, you represent and warrant that you are at least 18 years of
      age.
    </p>

    <h2>14. Governing Law</h2>
    <p>
      These Terms shall be governed by and construed in accordance with the laws
      of the State of Florida, United States, without regard to its conflict of
      law provisions. Any disputes arising under these Terms shall be resolved
      in the courts of the State of Florida.
    </p>

    <h2>15. Changes to Terms</h2>
    <p>
      We reserve the right to modify these Terms at any time. Material changes
      will be communicated with at least 30 days prior notice via email or
      through the Service. Continued use of the Service after changes take
      effect constitutes acceptance of the new Terms.
    </p>

    <h2>16. Contact</h2>
    <p>
      For questions about these Terms, contact us at:{" "}
      <a href="mailto:lpjservicesllc@gmail.com">lpjservicesllc@gmail.com</a>
    </p>
    <p>
      LPJ SERVICES LLC
      <br />
      United States
    </p>
  </>
);

const TermsPT = () => (
  <>
    <h1>Termos de Uso</h1>
    <p className="text-muted-foreground text-sm">
      Última atualização: 7 de março de 2026
    </p>

    <h2>1. Aceitação dos Termos</h2>
    <p>
      Ao acessar ou utilizar o ClaWin1Click (&quot;Serviço&quot;), operado pela
      LPJ SERVICES LLC (&quot;Empresa&quot;, &quot;nós&quot;), você concorda em
      ficar vinculado a estes Termos de Uso (&quot;Termos&quot;). Se você não
      concordar com estes Termos, não utilize o Serviço.
    </p>

    <h2>2. Descrição do Serviço</h2>
    <p>
      O ClaWin1Click oferece deploy e gerenciamento com um clique de containers
      de IA (instâncias OpenClaw) em infraestrutura em nuvem. O Serviço inclui
      provisionamento de containers, monitoramento, gerenciamento de
      configurações e funcionalidades relacionadas acessíveis pelo nosso painel
      web.
    </p>

    <h2>3. Conta e Autenticação</h2>
    <p>
      Para utilizar o Serviço, você deve se autenticar via Google ou GitHub
      OAuth. Você é responsável por manter a segurança da sua conta e por todas
      as atividades realizadas nela. Você deve ter pelo menos 18 anos para
      utilizar o Serviço.
    </p>

    <h2>4. Assinatura e Pagamento</h2>
    <p>
      O Serviço opera em modelo de assinatura processado pelo Stripe. Os preços
      são exibidos em BRL (Real Brasileiro) para usuários no Brasil e USD
      (Dólares Americanos) para todas as demais regiões. Ao assinar, você
      autoriza cobranças recorrentes no seu método de pagamento. Todos os preços
      estão sujeitos a alteração com aviso prévio de 30 dias.
    </p>

    <h2>5. Política de Cancelamento</h2>
    <p>
      Você pode cancelar sua assinatura a qualquer momento pelo painel ou pelo
      portal do cliente Stripe. Ao cancelar:
    </p>
    <ul>
      <li>Seu serviço continua até o fim do período de cobrança atual.</li>
      <li>
        Após o fim do período de cobrança, um período de carência de 3 dias se
        aplica para pagamentos com falha.
      </li>
      <li>
        Após o período de carência, seu container é permanentemente destruído e
        todos os dados associados são excluídos.
      </li>
    </ul>

    <h2>6. Uso Aceitável</h2>
    <p>Você concorda em NÃO utilizar o Serviço para:</p>
    <ul>
      <li>Hospedar, distribuir ou gerar conteúdo ilegal</li>
      <li>
        Realizar mineração de criptomoedas ou operações intensivas não
        relacionadas ao Serviço
      </li>
      <li>Enviar spam, phishing ou comunicações não solicitadas</li>
      <li>
        Tentar contornar medidas de segurança ou acessar dados de outros
        usuários
      </li>
      <li>Revender o Serviço sem autorização prévia por escrito</li>
      <li>Violar quaisquer leis ou regulamentos aplicáveis</li>
    </ul>
    <p>
      A violação destes termos pode resultar no encerramento imediato da sua
      conta sem reembolso.
    </p>

    <h2>7. Chaves de API</h2>
    <p>
      O Serviço requer que você forneça chaves de API de terceiros (ex.: OpenAI,
      Anthropic, Google AI) para alimentar sua instância de IA. Essas chaves são
      criptografadas usando AES-256-GCM e armazenadas de forma segura. Você é o
      único responsável por:
    </p>
    <ul>
      <li>A segurança e validade das suas chaves de API</li>
      <li>
        Quaisquer cobranças de provedores terceiros geradas pelo uso das suas
        chaves
      </li>
      <li>
        Conformidade com os termos de serviço dos respectivos provedores de API
      </li>
    </ul>

    <h2>8. Propriedade Intelectual</h2>
    <p>
      O Serviço, incluindo seu design, código, marca e documentação, é
      propriedade intelectual da LPJ SERVICES LLC. O OpenClaw é software de
      código aberto sob sua própria licença. Seus dados e configurações
      permanecem sua propriedade.
    </p>

    <h2>9. Disponibilidade do Serviço</h2>
    <p>
      Nos esforçamos para oferecer um serviço confiável, mas não garantimos
      nenhum percentual específico de uptime. O Serviço é fornecido em base de
      &quot;melhor esforço&quot;. Podemos realizar manutenções, atualizações ou
      experimentar interrupções que afetem temporariamente a disponibilidade.
      Nos empenharemos em notificar os usuários sobre manutenções planejadas com
      antecedência.
    </p>

    <h2>10. Limitação de Responsabilidade</h2>
    <p>
      NA MÁXIMA EXTENSÃO PERMITIDA POR LEI, A LPJ SERVICES LLC NÃO SERÁ
      RESPONSÁVEL POR QUAISQUER DANOS INDIRETOS, INCIDENTAIS, ESPECIAIS,
      CONSEQUENCIAIS OU PUNITIVOS, INCLUINDO, MAS NÃO SE LIMITANDO A, PERDA DE
      LUCROS, DADOS, USO OU REPUTAÇÃO, DECORRENTES DO SEU USO DO SERVIÇO.
    </p>
    <p>
      Nossa responsabilidade total por qualquer reclamação decorrente de ou
      relacionada ao Serviço não excederá o valor pago por você nos 12 meses
      anteriores à reclamação.
    </p>

    <h2>11. Indenização</h2>
    <p>
      Você concorda em indenizar e isentar a LPJ SERVICES LLC, seus diretores,
      executivos e funcionários de quaisquer reclamações, perdas ou danos
      decorrentes do seu uso do Serviço, violação destes Termos ou infração de
      direitos de terceiros.
    </p>

    <h2>12. Privacidade</h2>
    <p>
      Seu uso do Serviço também é regido pela nossa{" "}
      <Link href="/pt/privacy">Política de Privacidade</Link>, que descreve como
      coletamos, usamos e protegemos suas informações pessoais.
    </p>

    <h2>13. Restrição de Idade</h2>
    <p>
      O Serviço é destinado a usuários com pelo menos 18 anos de idade. Ao
      utilizar o Serviço, você declara e garante que possui pelo menos 18 anos.
    </p>

    <h2>14. Lei Aplicável</h2>
    <p>
      Estes Termos serão regidos e interpretados de acordo com as leis do Estado
      da Flórida, Estados Unidos, sem consideração a seus conflitos de
      disposições legais. Quaisquer disputas decorrentes destes Termos serão
      resolvidas nos tribunais do Estado da Flórida. Para usuários brasileiros,
      os direitos previstos no Código de Defesa do Consumidor (Lei 8.078/1990) e
      na LGPD (Lei 13.709/2018) permanecem aplicáveis.
    </p>

    <h2>15. Alterações nos Termos</h2>
    <p>
      Reservamo-nos o direito de modificar estes Termos a qualquer momento.
      Alterações materiais serão comunicadas com pelo menos 30 dias de
      antecedência por e-mail ou pelo Serviço. O uso continuado do Serviço após
      as alterações entrarem em vigor constitui aceitação dos novos Termos.
    </p>

    <h2>16. Contato</h2>
    <p>
      Para dúvidas sobre estes Termos, entre em contato conosco:{" "}
      <a href="mailto:lpjservicesllc@gmail.com">lpjservicesllc@gmail.com</a>
    </p>
    <p>
      LPJ SERVICES LLC
      <br />
      Estados Unidos
    </p>
  </>
);

const TermsES = () => (
  <>
    <h1>Términos de Servicio</h1>
    <p className="text-muted-foreground text-sm">
      Última actualización: 7 de marzo de 2026
    </p>

    <h2>1. Aceptación de los Términos</h2>
    <p>
      Al acceder o utilizar ClaWin1Click (&quot;Servicio&quot;), operado por LPJ
      SERVICES LLC (&quot;Empresa&quot;, &quot;nosotros&quot;), aceptas quedar
      vinculado por estos Términos de Servicio (&quot;Términos&quot;). Si no
      estás de acuerdo con estos Términos, no utilices el Servicio.
    </p>

    <h2>2. Descripción del Servicio</h2>
    <p>
      ClaWin1Click ofrece despliegue y gestión con un clic de contenedores de IA
      (instancias OpenClaw) en infraestructura en la nube. El Servicio incluye
      aprovisionamiento de contenedores, monitoreo, gestión de configuraciones y
      funcionalidades relacionadas accesibles a través de nuestro panel web.
    </p>

    <h2>3. Cuenta y Autenticación</h2>
    <p>
      Para utilizar el Servicio, debes autenticarte mediante Google o GitHub
      OAuth. Eres responsable de mantener la seguridad de tu cuenta y de todas
      las actividades que ocurran en ella. Debes tener al menos 18 años para
      utilizar el Servicio.
    </p>

    <h2>4. Suscripción y Pago</h2>
    <p>
      El Servicio opera mediante suscripción procesada a través de Stripe. Los
      precios se muestran en BRL (Real Brasileño) para usuarios en Brasil y USD
      (Dólares Estadounidenses) para todas las demás regiones. Al suscribirte,
      autorizas cargos recurrentes en tu método de pago. Todos los precios están
      sujetos a cambios con 30 días de aviso previo.
    </p>

    <h2>5. Política de Cancelación</h2>
    <p>
      Puedes cancelar tu suscripción en cualquier momento desde tu panel o el
      portal de cliente de Stripe. Al cancelar:
    </p>
    <ul>
      <li>
        Tu servicio continúa hasta el final del período de facturación actual.
      </li>
      <li>
        Después del período de facturación, se aplica un período de gracia de 3
        días para pagos fallidos.
      </li>
      <li>
        Después del período de gracia, tu contenedor se destruye permanentemente
        y todos los datos asociados se eliminan.
      </li>
    </ul>

    <h2>6. Uso Aceptable</h2>
    <p>Aceptas NO utilizar el Servicio para:</p>
    <ul>
      <li>Alojar, distribuir o generar contenido ilegal</li>
      <li>
        Realizar minería de criptomonedas u operaciones intensivas no
        relacionadas con el Servicio
      </li>
      <li>Enviar spam, phishing o comunicaciones no solicitadas</li>
      <li>
        Intentar eludir medidas de seguridad o acceder a datos de otros usuarios
      </li>
      <li>Revender el Servicio sin autorización previa por escrito</li>
      <li>Violar cualquier ley o regulación aplicable</li>
    </ul>
    <p>
      La violación de estos términos puede resultar en la terminación inmediata
      de tu cuenta sin reembolso.
    </p>

    <h2>7. Claves de API</h2>
    <p>
      El Servicio requiere que proporciones claves de API de terceros (ej.:
      OpenAI, Anthropic, Google AI) para alimentar tu instancia de IA. Estas
      claves se cifran con AES-256-GCM y se almacenan de forma segura. Eres el
      único responsable de:
    </p>
    <ul>
      <li>La seguridad y validez de tus claves de API</li>
      <li>
        Cualquier cargo de proveedores terceros generado por el uso de tus
        claves
      </li>
      <li>
        El cumplimiento de los términos de servicio de los respectivos
        proveedores de API
      </li>
    </ul>

    <h2>8. Propiedad Intelectual</h2>
    <p>
      El Servicio, incluyendo su diseño, código, marca y documentación, es
      propiedad intelectual de LPJ SERVICES LLC. OpenClaw es software de código
      abierto bajo su propia licencia. Tus datos y configuraciones siguen siendo
      tu propiedad.
    </p>

    <h2>9. Disponibilidad del Servicio</h2>
    <p>
      Nos esforzamos por ofrecer un servicio confiable, pero no garantizamos
      ningún porcentaje específico de disponibilidad. El Servicio se proporciona
      en base de &quot;mejor esfuerzo&quot;. Podemos realizar mantenimientos,
      actualizaciones o experimentar interrupciones que afecten temporalmente la
      disponibilidad. Nos esforzaremos en notificar a los usuarios sobre
      mantenimientos planificados con anticipación.
    </p>

    <h2>10. Limitación de Responsabilidad</h2>
    <p>
      EN LA MÁXIMA EXTENSIÓN PERMITIDA POR LA LEY, LPJ SERVICES LLC NO SERÁ
      RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES,
      CONSECUENCIALES O PUNITIVOS, INCLUYENDO, PERO NO LIMITÁNDOSE A, PÉRDIDA DE
      GANANCIAS, DATOS, USO O REPUTACIÓN, DERIVADOS DEL USO DEL SERVICIO.
    </p>
    <p>
      Nuestra responsabilidad total por cualquier reclamación derivada de o
      relacionada con el Servicio no excederá el monto pagado por ti en los 12
      meses anteriores a la reclamación.
    </p>

    <h2>11. Indemnización</h2>
    <p>
      Aceptas indemnizar y mantener indemne a LPJ SERVICES LLC, sus directores,
      ejecutivos y empleados de cualquier reclamación, pérdida o daño derivado
      de tu uso del Servicio, violación de estos Términos o infracción de
      derechos de terceros.
    </p>

    <h2>12. Privacidad</h2>
    <p>
      Tu uso del Servicio también se rige por nuestra{" "}
      <Link href="/es/privacy">Política de Privacidad</Link>, que describe cómo
      recopilamos, usamos y protegemos tu información personal.
    </p>

    <h2>13. Restricción de Edad</h2>
    <p>
      El Servicio está destinado a usuarios de al menos 18 años de edad. Al
      utilizar el Servicio, declaras y garantizas que tienes al menos 18 años.
    </p>

    <h2>14. Ley Aplicable</h2>
    <p>
      Estos Términos se regirán e interpretarán de acuerdo con las leyes del
      Estado de Florida, Estados Unidos, sin considerar sus disposiciones sobre
      conflictos de leyes. Cualquier disputa derivada de estos Términos será
      resuelta en los tribunales del Estado de Florida.
    </p>

    <h2>15. Cambios en los Términos</h2>
    <p>
      Nos reservamos el derecho de modificar estos Términos en cualquier
      momento. Los cambios significativos se comunicarán con al menos 30 días de
      anticipación por correo electrónico o a través del Servicio. El uso
      continuado del Servicio después de que los cambios entren en vigor
      constituye aceptación de los nuevos Términos.
    </p>

    <h2>16. Contacto</h2>
    <p>
      Para preguntas sobre estos Términos, contáctanos en:{" "}
      <a href="mailto:lpjservicesllc@gmail.com">lpjservicesllc@gmail.com</a>
    </p>
    <p>
      LPJ SERVICES LLC
      <br />
      Estados Unidos
    </p>
  </>
);
