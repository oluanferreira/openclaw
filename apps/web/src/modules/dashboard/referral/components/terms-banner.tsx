/* eslint-disable i18next/no-literal-string */
"use client";

import { useState } from "react";

import { useTranslation } from "@workspace/i18n";
import { Button } from "@workspace/ui-web/button";
import { Card, CardContent, CardFooter } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";

interface TermsBannerProps {
  onAccept: () => void;
  isPending: boolean;
}

// ─── Terms Content (EN) ──────────────────────────────────────

function TermsEN() {
  return (
    <>
      <h1>Referral Program Terms</h1>
      <p className="text-muted-foreground text-sm">
        Last updated: March 10, 2026
      </p>

      <h2>1. Program Overview</h2>
      <p>
        The ClaWin1Click Referral Program (&quot;Program&quot;) allows active
        subscribers (&quot;Referrers&quot;) to earn recurring commissions by
        referring new paying customers to the Service. By participating, you
        agree to these terms.
      </p>

      <h2>2. Eligibility</h2>
      <p>To participate you must:</p>
      <ul>
        <li>Have an active ClaWin1Click subscription in good standing</li>
        <li>Provide a valid BEP20 (BNB Smart Chain) wallet address</li>
        <li>Accept these Referral Program Terms</li>
        <li>Be at least 18 years old</li>
      </ul>

      <h2>3. Commission Structure</h2>
      <p>
        The Program uses a 3-tier commission model based on the referred
        customer&apos;s subscription payments:
      </p>
      <ul>
        <li>
          <strong>Tier 1 (Direct referral):</strong> 20% of the payment amount
        </li>
        <li>
          <strong>Tier 2 (Referral&apos;s referral):</strong> 8% of the payment
          amount
        </li>
        <li>
          <strong>Tier 3 (Third level):</strong> 2% of the payment amount
        </li>
      </ul>
      <p>
        Total maximum commission per payment across all tiers: 30%. Commissions
        are calculated on the gross subscription payment amount before any fees
        or taxes.
      </p>

      <h2>4. Recurring Commissions</h2>
      <p>
        Commissions are <strong>recurring</strong> — you earn on every monthly
        payment made by your referred customers for as long as their
        subscription remains active. If a referred customer cancels and later
        resubscribes, the referral link is not restored.
      </p>

      <h2>5. Payouts</h2>
      <ul>
        <li>
          Payouts are made in <strong>USDT (BEP20)</strong> to your registered
          wallet address
        </li>
        <li>
          Minimum withdrawal amount: <strong>$10 USDT</strong>
        </li>
        <li>
          Payouts are processed on the <strong>10th of each month</strong> for
          the previous month&apos;s commissions
        </li>
        <li>
          Commissions below the minimum threshold are carried over to the next
          month
        </li>
        <li>
          You are responsible for providing a correct and active wallet address
        </li>
      </ul>

      <h2>6. Multi-Currency</h2>
      <p>
        Commissions are tracked in the original payment currency and converted
        to USD equivalent for reporting. Payout amounts are calculated in USDT
        based on the USD equivalent at the time of the original payment.
      </p>

      <h2>7. Referral Tracking</h2>
      <p>
        Referrals are tracked via your unique referral link. A 30-day
        first-click attribution cookie is used. The referral is credited when
        the referred user completes their first payment.
      </p>

      <h2>8. Prohibited Practices</h2>
      <p>
        The following are strictly prohibited and will result in immediate
        suspension:
      </p>
      <ul>
        <li>
          <strong>Self-referral:</strong> Referring yourself or your own
          accounts
        </li>
        <li>
          <strong>Circular chains:</strong> Creating reciprocal referral
          arrangements (A refers B, B refers A)
        </li>
        <li>
          <strong>Spam:</strong> Mass unsolicited messaging or misleading
          advertising
        </li>
        <li>
          <strong>Fraud:</strong> Fake accounts, manipulated signups, or any
          deceptive practices
        </li>
        <li>
          <strong>Brand misuse:</strong> Misrepresenting yourself as
          ClaWin1Click staff or partner
        </li>
      </ul>

      <h2>9. Dispute Handling</h2>
      <p>
        If a referred customer disputes a charge (chargeback), the associated
        commission is voided. If the dispute is resolved in our favor, the
        commission is restored. Repeated disputes from a referrer&apos;s
        referrals may trigger a review of the referrer&apos;s account.
      </p>

      <h2>10. Suspension and Termination</h2>
      <p>
        We reserve the right to suspend or terminate your participation in the
        Program at any time for violation of these terms or suspected fraud.
        Upon termination, pending commissions below the payout threshold are
        forfeited. Earned and processed payouts are not affected.
      </p>

      <h2>11. Tax Responsibility</h2>
      <p>
        You are solely responsible for reporting and paying any taxes due on
        commissions earned through the Program. ClaWin1Click does not withhold
        taxes and does not provide tax advice. We recommend consulting a tax
        professional regarding your obligations.
      </p>

      <h2>12. Social Media Disclosure</h2>
      <p>
        When promoting the Service on social media, you must clearly disclose
        your referral relationship (e.g., using #ad or #referral). This is
        required by advertising regulations in most jurisdictions.
      </p>

      <h2>13. Modifications</h2>
      <p>
        We may modify these terms at any time. Material changes will be
        communicated via email or dashboard notification. Continued
        participation after changes constitutes acceptance of the modified
        terms.
      </p>

      <h2>14. Limitation of Liability</h2>
      <p>
        ClaWin1Click is not liable for delayed or failed payouts due to
        blockchain network issues, incorrect wallet addresses provided by you,
        or force majeure events. Our maximum liability is limited to the unpaid
        commission balance in your account.
      </p>

      <h2>15. Governing Law</h2>
      <p>
        These terms are governed by the laws of the State of Florida, USA, where
        LPJ SERVICES LLC is incorporated. Any disputes shall be resolved through
        binding arbitration.
      </p>
    </>
  );
}

// ─── Terms Content (PT) ──────────────────────────────────────

function TermsPT() {
  return (
    <>
      <h1>Termos do Programa de Indicação</h1>
      <p className="text-muted-foreground text-sm">
        Última atualização: 10 de março de 2026
      </p>

      <h2>1. Visão Geral</h2>
      <p>
        O Programa de Indicação ClaWin1Click (&quot;Programa&quot;) permite que
        assinantes ativos (&quot;Indicadores&quot;) ganhem comissões recorrentes
        ao indicar novos clientes pagantes para o Serviço. Ao participar, você
        concorda com estes termos.
      </p>

      <h2>2. Elegibilidade</h2>
      <p>Para participar você deve:</p>
      <ul>
        <li>Ter uma assinatura ClaWin1Click ativa e em dia</li>
        <li>Fornecer um endereço de carteira BEP20 (BNB Smart Chain) válido</li>
        <li>Aceitar estes Termos do Programa de Indicação</li>
        <li>Ter pelo menos 18 anos de idade</li>
      </ul>

      <h2>3. Estrutura de Comissões</h2>
      <p>
        O Programa utiliza um modelo de comissão em 3 níveis baseado nos
        pagamentos de assinatura do cliente indicado:
      </p>
      <ul>
        <li>
          <strong>Nível 1 (Indicação direta):</strong> 20% do valor do pagamento
        </li>
        <li>
          <strong>Nível 2 (Indicação do indicado):</strong> 8% do valor do
          pagamento
        </li>
        <li>
          <strong>Nível 3 (Terceiro nível):</strong> 2% do valor do pagamento
        </li>
      </ul>
      <p>
        Comissão máxima total por pagamento em todos os níveis: 30%. As
        comissões são calculadas sobre o valor bruto do pagamento da assinatura,
        antes de taxas ou impostos.
      </p>

      <h2>4. Comissões Recorrentes</h2>
      <p>
        As comissões são <strong>recorrentes</strong> — você ganha em cada
        pagamento mensal feito pelos seus indicados enquanto a assinatura deles
        estiver ativa. Se um indicado cancelar e depois reativar, o vínculo de
        indicação não é restaurado.
      </p>

      <h2>5. Pagamentos</h2>
      <ul>
        <li>
          Pagamentos são feitos em <strong>USDT (BEP20)</strong> na carteira
          cadastrada
        </li>
        <li>
          Valor mínimo para saque: <strong>$10 USDT</strong>
        </li>
        <li>
          Pagamentos são processados no <strong>dia 10 de cada mês</strong>{" "}
          referente às comissões do mês anterior
        </li>
        <li>Comissões abaixo do mínimo são acumuladas para o próximo mês</li>
        <li>
          Você é responsável por fornecer um endereço de carteira correto e
          ativo
        </li>
      </ul>

      <h2>6. Multi-Moeda</h2>
      <p>
        As comissões são rastreadas na moeda original do pagamento e convertidas
        para equivalente em USD para relatórios. Os valores de pagamento são
        calculados em USDT com base no equivalente em USD no momento do
        pagamento original.
      </p>

      <h2>7. Rastreamento de Indicações</h2>
      <p>
        As indicações são rastreadas via seu link exclusivo. Um cookie de
        atribuição first-click de 30 dias é utilizado. A indicação é creditada
        quando o usuário indicado completa seu primeiro pagamento.
      </p>

      <h2>8. Práticas Proibidas</h2>
      <p>
        As seguintes práticas são estritamente proibidas e resultarão em
        suspensão imediata:
      </p>
      <ul>
        <li>
          <strong>Auto-indicação:</strong> Indicar a si mesmo ou suas próprias
          contas
        </li>
        <li>
          <strong>Cadeias circulares:</strong> Criar arranjos de indicação
          recíprocos (A indica B, B indica A)
        </li>
        <li>
          <strong>Spam:</strong> Mensagens em massa não solicitadas ou
          publicidade enganosa
        </li>
        <li>
          <strong>Fraude:</strong> Contas falsas, cadastros manipulados ou
          práticas enganosas
        </li>
        <li>
          <strong>Uso indevido da marca:</strong> Se apresentar como funcionário
          ou parceiro ClaWin1Click
        </li>
      </ul>

      <h2>9. Disputas de Cobrança</h2>
      <p>
        Se um cliente indicado contestar uma cobrança (chargeback), a comissão
        associada é anulada. Se a disputa for resolvida a nosso favor, a
        comissão é restaurada. Disputas repetidas dos indicados de um indicador
        podem acionar uma revisão da conta.
      </p>

      <h2>10. Suspensão e Encerramento</h2>
      <p>
        Reservamo-nos o direito de suspender ou encerrar sua participação no
        Programa a qualquer momento por violação destes termos ou suspeita de
        fraude. Após o encerramento, comissões pendentes abaixo do limite de
        saque são perdidas. Pagamentos já processados não são afetados.
      </p>

      <h2>11. Responsabilidade Fiscal</h2>
      <p>
        Você é exclusivamente responsável por declarar e pagar quaisquer
        impostos devidos sobre comissões ganhas no Programa. A ClaWin1Click não
        retém impostos e não fornece consultoria fiscal. Recomendamos consultar
        um profissional tributário sobre suas obrigações.
      </p>

      <h2>12. Divulgação em Redes Sociais</h2>
      <p>
        Ao promover o Serviço em redes sociais, você deve divulgar claramente
        seu vínculo de indicação (ex: usando #publi ou #indicação). Isso é
        exigido pelas regulamentações de publicidade (CONAR) na maioria das
        jurisdições.
      </p>

      <h2>13. Modificações</h2>
      <p>
        Podemos modificar estes termos a qualquer momento. Alterações
        significativas serão comunicadas por e-mail ou notificação no dashboard.
        A participação continuada após as alterações constitui aceitação dos
        termos modificados.
      </p>

      <h2>14. Limitação de Responsabilidade</h2>
      <p>
        A ClaWin1Click não é responsável por pagamentos atrasados ou falhos
        devido a problemas na rede blockchain, endereços de carteira incorretos
        fornecidos por você, ou eventos de força maior. Nossa responsabilidade
        máxima é limitada ao saldo de comissões não pagas em sua conta.
      </p>

      <h2>15. Lei Aplicável</h2>
      <p>
        Estes termos são regidos pelas leis do Estado da Flórida, EUA, onde a
        LPJ SERVICES LLC é incorporada. Quaisquer disputas serão resolvidas por
        arbitragem vinculante.
      </p>
    </>
  );
}

// ─── Terms Content (ES) ──────────────────────────────────────

function TermsES() {
  return (
    <>
      <h1>Términos del Programa de Referidos</h1>
      <p className="text-muted-foreground text-sm">
        Última actualización: 10 de marzo de 2026
      </p>

      <h2>1. Descripción General</h2>
      <p>
        El Programa de Referidos ClaWin1Click (&quot;Programa&quot;) permite a
        los suscriptores activos (&quot;Referidores&quot;) ganar comisiones
        recurrentes al referir nuevos clientes pagadores al Servicio. Al
        participar, aceptas estos términos.
      </p>

      <h2>2. Elegibilidad</h2>
      <p>Para participar debes:</p>
      <ul>
        <li>Tener una suscripción ClaWin1Click activa y al día</li>
        <li>
          Proporcionar una dirección de billetera BEP20 (BNB Smart Chain) válida
        </li>
        <li>Aceptar estos Términos del Programa de Referidos</li>
        <li>Tener al menos 18 años de edad</li>
      </ul>

      <h2>3. Estructura de Comisiones</h2>
      <p>
        El Programa utiliza un modelo de comisión de 3 niveles basado en los
        pagos de suscripción del cliente referido:
      </p>
      <ul>
        <li>
          <strong>Nivel 1 (Referido directo):</strong> 20% del monto del pago
        </li>
        <li>
          <strong>Nivel 2 (Referido del referido):</strong> 8% del monto del
          pago
        </li>
        <li>
          <strong>Nivel 3 (Tercer nivel):</strong> 2% del monto del pago
        </li>
      </ul>
      <p>
        Comisión máxima total por pago en todos los niveles: 30%. Las comisiones
        se calculan sobre el monto bruto del pago de suscripción, antes de
        cargos o impuestos.
      </p>

      <h2>4. Comisiones Recurrentes</h2>
      <p>
        Las comisiones son <strong>recurrentes</strong> — ganas en cada pago
        mensual realizado por tus referidos mientras su suscripción esté activa.
        Si un referido cancela y luego reactiva, el vínculo de referido no se
        restaura.
      </p>

      <h2>5. Pagos</h2>
      <ul>
        <li>
          Los pagos se realizan en <strong>USDT (BEP20)</strong> a tu billetera
          registrada
        </li>
        <li>
          Monto mínimo de retiro: <strong>$10 USDT</strong>
        </li>
        <li>
          Los pagos se procesan el <strong>día 10 de cada mes</strong>{" "}
          correspondiente a las comisiones del mes anterior
        </li>
        <li>
          Las comisiones por debajo del mínimo se acumulan para el próximo mes
        </li>
        <li>
          Eres responsable de proporcionar una dirección de billetera correcta y
          activa
        </li>
      </ul>

      <h2>6. Multi-Moneda</h2>
      <p>
        Las comisiones se rastrean en la moneda original del pago y se
        convierten a equivalente en USD para reportes. Los montos de pago se
        calculan en USDT basándose en el equivalente en USD al momento del pago
        original.
      </p>

      <h2>7. Seguimiento de Referidos</h2>
      <p>
        Los referidos se rastrean mediante tu enlace único. Se utiliza una
        cookie de atribución first-click de 30 días. El referido se acredita
        cuando el usuario referido completa su primer pago.
      </p>

      <h2>8. Prácticas Prohibidas</h2>
      <p>
        Las siguientes prácticas están estrictamente prohibidas y resultarán en
        suspensión inmediata:
      </p>
      <ul>
        <li>
          <strong>Auto-referencia:</strong> Referirte a ti mismo o a tus propias
          cuentas
        </li>
        <li>
          <strong>Cadenas circulares:</strong> Crear arreglos de referidos
          recíprocos (A refiere a B, B refiere a A)
        </li>
        <li>
          <strong>Spam:</strong> Mensajes masivos no solicitados o publicidad
          engañosa
        </li>
        <li>
          <strong>Fraude:</strong> Cuentas falsas, registros manipulados o
          prácticas engañosas
        </li>
        <li>
          <strong>Uso indebido de marca:</strong> Presentarse como empleado o
          socio de ClaWin1Click
        </li>
      </ul>

      <h2>9. Manejo de Disputas</h2>
      <p>
        Si un cliente referido disputa un cargo (contracargo), la comisión
        asociada se anula. Si la disputa se resuelve a nuestro favor, la
        comisión se restaura. Disputas repetidas de los referidos de un
        referidor pueden activar una revisión de la cuenta.
      </p>

      <h2>10. Suspensión y Terminación</h2>
      <p>
        Nos reservamos el derecho de suspender o terminar tu participación en el
        Programa en cualquier momento por violación de estos términos o sospecha
        de fraude. Tras la terminación, las comisiones pendientes por debajo del
        umbral de pago se pierden. Los pagos ya procesados no se ven afectados.
      </p>

      <h2>11. Responsabilidad Fiscal</h2>
      <p>
        Eres el único responsable de declarar y pagar cualquier impuesto debido
        sobre las comisiones ganadas en el Programa. ClaWin1Click no retiene
        impuestos ni proporciona asesoría fiscal. Recomendamos consultar a un
        profesional tributario sobre tus obligaciones.
      </p>

      <h2>12. Divulgación en Redes Sociales</h2>
      <p>
        Al promover el Servicio en redes sociales, debes divulgar claramente tu
        relación de referido (ej: usando #ad o #referido). Esto es requerido por
        las regulaciones de publicidad en la mayoría de jurisdicciones.
      </p>

      <h2>13. Modificaciones</h2>
      <p>
        Podemos modificar estos términos en cualquier momento. Los cambios
        significativos se comunicarán por correo electrónico o notificación en
        el dashboard. La participación continuada después de los cambios
        constituye aceptación de los términos modificados.
      </p>

      <h2>14. Limitación de Responsabilidad</h2>
      <p>
        ClaWin1Click no es responsable por pagos retrasados o fallidos debido a
        problemas en la red blockchain, direcciones de billetera incorrectas
        proporcionadas por ti, o eventos de fuerza mayor. Nuestra
        responsabilidad máxima se limita al saldo de comisiones no pagadas en tu
        cuenta.
      </p>

      <h2>15. Ley Aplicable</h2>
      <p>
        Estos términos se rigen por las leyes del Estado de Florida, EE.UU.,
        donde LPJ SERVICES LLC está incorporada. Cualquier disputa será resuelta
        mediante arbitraje vinculante.
      </p>
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function TermsBanner({ onAccept, isPending }: TermsBannerProps) {
  const [accepted, setAccepted] = useState(false);
  const { i18n, t } = useTranslation("dashboard");
  const locale = i18n.language;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          <article className="prose prose-neutral dark:prose-invert prose-sm max-w-none">
            {locale === "pt" ? (
              <TermsPT />
            ) : locale === "es" ? (
              <TermsES />
            ) : (
              <TermsEN />
            )}
          </article>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="flex w-full items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="size-4"
            />
            <span className="font-medium">{t("referral.terms.checkbox")}</span>
          </label>
          <Button
            size="sm"
            disabled={!accepted || isPending}
            onClick={onAccept}
          >
            {isPending ? (
              <Icons.Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {t("referral.terms.confirm")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
