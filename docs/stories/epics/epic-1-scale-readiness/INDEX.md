# EPIC-1: Scale-Readiness — Primeiros 5 Clientes Pagantes

## Contexto

ClaWin1Click em negociacao de investimento ($250K / 15% equity, valuation ~$1.67M). Antes de acionar investidores:

1. **Provar estabilidade com 5 users pagantes reais**
2. **Garantir que billing funciona sem falhas**
3. **Ter visibilidade operacional (errors, metrics)**
4. **Codigo limpo para due diligence tecnico**

Apos provar estabilidade, escalaremos infra (nova VPS e/ou upgrade da atual).

## Infraestrutura Atual

| Recurso | Valor |
|---------|-------|
| VPS | 1x Hostinger (2 CPU, 8GB RAM, 96GB disk) |
| Containers ativos | 3 users |
| Capacidade estimada | ~15 containers |
| Target | 5 users pagantes = ~8 containers (3 atuais + 5 novos) |
| Margem | Confortavel (~50% de headroom) |

## Fases

### Fase 1 — Pre 5 Users (BLOCKING)
> O que DEVE estar pronto antes de ativar marketing

| Wave | Stories | Paralelismo |
|------|---------|-------------|
| Wave 1 | 1.1, 1.2, 1.3 | Paralelas (independentes) |
| Wave 2 | 1.4, 1.5 | Paralelas (dependem da Wave 1) |

### Fase 2 — Pos 5 Users Estaveis (PRE-INVESTOR)
> Polimento para apresentar ao investidor

| Wave | Stories | Paralelismo |
|------|---------|-------------|
| Wave 3 | 1.6, 1.7 | Paralelas |

### Fase 3 — Pos Investimento (SCALE)
> Escalar infra com capital do investidor

| Wave | Stories | Paralelismo |
|------|---------|-------------|
| Wave 4 | 1.8, 1.9, 1.10 | 1.8 primeiro, depois 1.9+1.10 paralelas |

---

## Stories

### Wave 1 — Fundacao (Paralelas)

#### 1.1 — Integrar Sentry Error Tracking
- **Agente:** @dev
- **Esforco:** P (2h)
- **Prioridade:** CRITICAL

**Descricao:**
Adicionar Sentry ao Next.js (frontend + API routes) e ao Hono API para capturar errors em producao. Sem isso, nao temos visibilidade sobre falhas.

**Acceptance Criteria:**
- [ ] Sentry SDK instalado no `apps/web` (Next.js integration)
- [ ] Sentry configurado para capturar errors no Hono API (via `onError` handler)
- [ ] Source maps uploaded no build
- [ ] Alertas de error por email configurados
- [ ] Variaveis de ambiente: `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- [ ] Teste: forcar um error e verificar que aparece no Sentry dashboard

**Scope IN:** Next.js frontend errors, API route errors, unhandled rejections
**Scope OUT:** Performance monitoring (APM), session replay

---

#### 1.2 — Testes de Billing Webhooks + Subscription Lifecycle
- **Agente:** @dev + @qa
- **Esforco:** M (4-6h)
- **Prioridade:** CRITICAL

**Descricao:**
O fluxo de billing e o coracao do negocio. Um bug aqui = perda de receita ou acesso indevido. Precisamos de testes unitarios cobrindo todos os webhook events e o lifecycle completo.

**Acceptance Criteria:**
- [ ] Testes para `checkout.session.completed` -> cria/atualiza subscription
- [ ] Testes para `customer.subscription.updated` -> atualiza status + period
- [ ] Testes para `customer.subscription.updated` com `past_due` -> calcula deadline grace period (+3d)
- [ ] Testes para `customer.subscription.deleted` -> status inactive, destroyInstanceFull, deleteInstance
- [ ] Testes para `invoice.payment_failed` -> marca past_due, notifica agente
- [ ] Testes para Stripe signature verification (rejeitar payloads invalidos)
- [ ] Testes para fluxo completo: active -> past_due -> grace -> deleted
- [ ] Test runner configurado (vitest) com coverage report
- [ ] Coverage minimo: 90% nos webhook handlers

**Scope IN:** billing router webhook handlers, subscription state machine
**Scope OUT:** Stripe API mocking (usar fixtures), frontend billing view

---

#### 1.3 — Limpar Dead Code + Arquivos Residuais
- **Agente:** @dev
- **Esforco:** S (1h)
- **Prioridade:** HIGH

**Descricao:**
Remover codigo morto que adiciona superficie de manutencao e confunde due diligence tecnico.

**Acceptance Criteria:**
- [ ] Remover 5 endpoints `/store/*` do `openclaw/router.ts` (~230 LOC)
- [ ] Remover `packages/api/src/modules/openclaw/store-cache.ts` (69 LOC)
- [ ] Remover imports de `fetchClawHub` e `clawhubExec` do router (se nao usados por curated skills)
- [ ] Remover `packages/api/src/middleware.ts.bak`
- [ ] Remover `packages/api/src/middleware.ts.orig`
- [ ] Remover `update-image.sh` e `update-image.log` da raiz
- [ ] Verificar se `packages/db/src/schema/vps-server.ts` esta em uso (preservar — e o multi-VPS)
- [ ] Avaliar migracao para remover coluna `source` de `instance_skill` (se existir)
- [ ] Build + typecheck passando apos remocoes
- [ ] Commitar: `chore: remove dead store endpoints and residual files [EPIC-1]`

**Scope IN:** Dead code identificado na analise
**Scope OUT:** Refactoring de codigo funcional

---

### Wave 2 — Resiliencia (Apos Wave 1)

#### 1.4 — PM2 Cluster Mode + Health Check
- **Agente:** @devops
- **Esforco:** P (2h)
- **Prioridade:** HIGH

**Descricao:**
A app web roda em PM2 fork mode (1 processo). Se crasha, todo o servico fica indisponivel. Cluster mode para resiliencia e melhor uso de CPU.

**Acceptance Criteria:**
- [ ] `ecosystem.config.js` atualizado: `instances: 2`, `exec_mode: "cluster"`
- [ ] Health check endpoint (`GET /api/status`) verificado e funcional
- [ ] UptimeRobot configurado para alertar em <30s de downtime
- [ ] Graceful reload funcionando: `pm2 reload openclaw-web`
- [ ] Validar rate limiting in-memory em cluster (documentar limitacao para Wave 4)
- [ ] Teste: matar 1 worker, verificar que o outro serve requests
- [ ] Monitorar por 24h apos mudanca

**Scope IN:** PM2 config, health check, graceful reload
**Scope OUT:** Dockerizacao da app web, Redis rate limiting

**Risks:**
- Rate limiting via `Map` in-memory nao compartilhado entre workers — aceitavel para 5 users, resolvido na Story 1.9

---

#### 1.5 — Simplificar Skills Page + Link ClawHub
- **Agente:** @dev
- **Esforco:** P (2h)
- **Prioridade:** MEDIUM

**Descricao:**
O agente OpenClaw instala skills via chat. A Skill Store UI planejada e desnecessaria. A page de skills deve focar em gerenciamento de credenciais + link externo ao ClawHub.

**Acceptance Criteria:**
- [ ] Remover referencias a "Skill Store" ou "store" do frontend
- [ ] Manter secao de credenciais: GoG OAuth, Notion, Slack, Discord, GitHub (toggles + config)
- [ ] Adicionar card/banner "Explorar Skills" com link para `https://clawhub.ai` e texto: "Seu agente instala skills pelo chat. Explore o catalogo no ClawHub."
- [ ] Manter skills "auto" como informativas (sem toggle, apenas listagem)
- [ ] Manter GoG OAuth flow (3 steps) — necessario por requerer OAuth
- [ ] Atualizar i18n (en/pt/es) com novas strings
- [ ] Visual: card atrativo com icone + CTA claro

**Scope IN:** Frontend skills view, i18n
**Scope OUT:** Backend skills endpoints curados (manter GET /skills e PUT /skills/:name)

---

### Wave 3 — Polimento Pre-Investor

#### 1.6 — Precos Dinamicos (Stripe + Config + Frontend)
- **Agente:** @dev + @devops
- **Esforco:** M (3-4h)
- **Prioridade:** MEDIUM

**Descricao:**
Precos hardcoded no frontend ($29.90, R$153,39, R$199,90) e apenas os Price objects atuais configurados no Stripe. Se pricing mudar (provavel pos-investimento), exige tanto criacao de novo Price no Stripe quanto deploy do frontend. O fluxo completo de mudanca de preco deve ser: criar Price no Stripe -> atualizar env vars -> frontend reflete automaticamente.

**Acceptance Criteria:**
- [ ] Documentar Stripe Prices atuais (IDs, valores, moedas) em `docs/operations.md`
- [ ] Garantir que existem Price objects separados no Stripe para USD e BRL
- [ ] Criar config centralizado: `{ currency: { priceId, displayValue } }` em `packages/shared/src/constants/pricing.ts`
- [ ] Frontend (BillingView + Landing) consome displayValue do config
- [ ] POST /checkout usa o priceId correto do config baseado na currency do user
- [ ] Env vars para override: `STRIPE_PRICE_ID_USD`, `STRIPE_PRICE_ID_BRL`, `PRICE_DISPLAY_USD`, `PRICE_DISPLAY_BRL`
- [ ] Atualizar i18n para interpolacao de precos (remover valores hardcoded das translations)
- [ ] Documentar procedimento de mudanca de preco: 1) Criar Price no Stripe Dashboard 2) Atualizar env vars 3) Deploy

**Scope IN:** Stripe Price config, frontend pricing, checkout flow, documentacao do processo
**Scope OUT:** Fetch dinamico do Stripe Price API em runtime

**Nota:** Qualquer mudanca futura de preco requer: criar novo Price no Stripe, atualizar env vars, deploy. Esta story garante que esse processo seja simples e documentado, nao que seja zero-deploy.

---

#### 1.7 — Script de Deploy com Health Check + Rollback
- **Agente:** @devops
- **Esforco:** M (3-4h)
- **Prioridade:** MEDIUM

**Descricao:**
Deploy manual via SSH com multiplos comandos. Sem rollback, sem health check pos-deploy. Processo operacional precisa ser confiavel para investidor.

**Acceptance Criteria:**
- [ ] Script `deploy.sh` na raiz do projeto com:
  - Build com abort on error
  - Backup do `.next` anterior (rollback)
  - PM2 reload (graceful, zero-downtime com cluster mode da 1.4)
  - Health check pos-deploy (curl /api/status, retry 3x, 5s interval)
  - Rollback automatico se health check falha
- [ ] Documentar processo no `docs/operations.md`
- [ ] Testar rollback com falha simulada

**Scope IN:** Deploy script com safety nets
**Scope OUT:** CI/CD pipeline completo, Docker deploy

---

### Wave 4 — Escala Pos-Investimento

#### 1.8 — Provisionar Segunda VPS + Registrar no Sistema
- **Agente:** @devops
- **Esforco:** M (3-4h)
- **Prioridade:** HIGH (quando atingir ~10 users)

**Descricao:**
O codigo multi-VPS ja existe. Provisionar segunda VPS, instalar deps, deploy do vps-agent, registrar no DB.

**Acceptance Criteria:**
- [ ] Nova VPS provisionada (minimo 4 CPU, 16GB RAM)
- [ ] Docker, Node.js, Caddy instalados
- [ ] `vps-agent.ts` rodando via PM2 com token de autenticacao
- [ ] OpenClaw container image pulled
- [ ] INSERT no `vps_server` table com endpoint HTTP da nova VPS
- [ ] Testar `selectBestVps()` retornando a nova VPS quando principal sobrecarregada
- [ ] Deploy de 1 container de teste na nova VPS pelo fluxo normal
- [ ] Documentar processo de provisionamento no `docs/vps-setup.md`

**Scope IN:** Infra nova VPS, registro no sistema, teste E2E
**Scope OUT:** Auto-scaling, Kubernetes, load balancer externo

**Dependencia:** Orcamento do investimento

---

#### 1.9 — Rate Limiting Compartilhado (Redis)
- **Agente:** @dev
- **Esforco:** M (3h)
- **Prioridade:** HIGH (com multiplos workers/VPS)

**Descricao:**
Rate limiting usa `Map` in-memory. Com cluster mode e multiplas VPS, cada processo tem seu proprio counter. Migrar para Redis.

**Acceptance Criteria:**
- [ ] Redis instalado e configurado na VPS principal
- [ ] Rate limit store migrado para Redis
- [ ] Manter mesma API: `rateLimit(max, windowMs)`
- [ ] Funcionar entre workers PM2 e entre VPS
- [ ] Fallback graceful: se Redis cai, degradar para in-memory com warning no Sentry
- [ ] Testes para rate limiting distribuido
- [ ] Benchmark: latencia do rate limit check < 5ms

**Scope IN:** Rate limiting middleware
**Scope OUT:** Session store migration, caching layer geral

---

#### 1.10 — CI/CD Pipeline (GitHub Actions)
- **Agente:** @devops
- **Esforco:** M (4h)
- **Prioridade:** MEDIUM

**Descricao:**
Automatizar pipeline: push -> test -> build -> deploy. Ja existem 3 workflows basicos, expandir para deploy completo.

**Acceptance Criteria:**
- [ ] Workflow `deploy-production.yml`:
  - Trigger: push to `main` ou manual dispatch
  - Steps: install -> typecheck -> lint -> test -> build -> deploy SSH -> health check
- [ ] Secrets configurados: `VPS_SSH_KEY`, `SENTRY_DSN`, etc.
- [ ] Deploy apenas se todos checks passam
- [ ] Notificacao de falha (GitHub + email)
- [ ] Badge de status no README

**Scope IN:** GitHub Actions pipeline
**Scope OUT:** Preview deployments, staging environment

---

## Metricas de Sucesso

| Metrica | Target |
|---------|--------|
| Uptime | > 99.5% (UptimeRobot) |
| Error rate | < 1% dos requests |
| Billing accuracy | 100% (zero discrepancias) |
| Deploy time | < 5 minutos (build + reload) |
| Users pagantes | 5 estaveis por 2+ semanas |
| Tempo para escalar (+1 VPS) | < 2 horas |

## Timeline Estimada

| Fase | Duracao | Quando |
|------|---------|--------|
| Wave 1 (1.1, 1.2, 1.3) | 2-3 dias | Imediato |
| Wave 2 (1.4, 1.5) | 1-2 dias | Apos Wave 1 |
| Captacao 5 users | 1-2 semanas | Apos Wave 2 |
| Wave 3 (1.6, 1.7) | 2-3 dias | Durante/apos captacao |
| Acionar investidores | — | Apos 2 semanas estavel com 5 users |
| Wave 4 (1.8, 1.9, 1.10) | 1 semana | Apos investimento |

## Change Log

| Data | Autor | Mudanca |
|------|-------|---------|
| 2026-03-07 | Morgan (PM) | Epic criado com 10 stories em 4 waves |

---

*Epic criado por Morgan — Product Manager Agent*
*Synkra AIOS — ClaWin1Click*
