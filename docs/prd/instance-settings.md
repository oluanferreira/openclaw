# Instance Settings — Product Requirements Document (PRD)

**Version:** 1.1
**Date:** 2026-03-07
**Author:** Morgan (PM Agent)
**Status:** Draft

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-07 | 1.0 | Initial draft — motivated by token loss incident | Morgan |
| 2026-03-07 | 1.1 | Audit corrections: propagation pattern, GET endpoint, cache invalidation | Morgan |

---

## 1. Goals

- Permitir que usuarios **atualizem configuracoes da instancia** (Telegram bot token, modelo AI) apos o deploy, sem destruir e recriar a instancia
- **Validar rigorosamente** inputs de configuracao antes de persisti-los, prevenindo quebras por caracteres incorretos ou valores invalidos
- Tornar a plataforma **self-service em escala** — eliminar a necessidade de intervencao manual da equipe para corrigir tokens ou configs de usuarios
- Proteger contra **data loss por redacao** — valores redactados pelo runtime nunca devem sobrescrever dados reais no DB

## 2. Background Context

O ClaWin1Click permite que usuarios deployem instancias OpenClaw via dashboard. Atualmente, as configuracoes (Telegram bot token, modelo AI, API keys) sao definidas **apenas no momento do deploy**. Nao existe forma de edita-las depois.

Um incidente em 2026-03-07 revelou que o OpenClaw v2026.3.2 redacta campos sensiveis no `openclaw.json` em runtime (`_OPENCLAW_REDACTED_`). O mecanismo de sync-back leu esses valores redactados e os gravou no DB, causando perda permanente do bot token do Telegram de um usuario. A validacao atual (`z.string().min(1)`) aceita qualquer string nao-vazia como bot token — incluindo valores corrompidos.

A plataforma precisa de uma secao de configuracoes que permita edicao pos-deploy com validacao robusta, seguindo o padrao ja existente em `PUT /keys` para API keys de AI.

---

## 3. Requirements

### 3.1 Functional Requirements

- **FR1:** O dashboard deve ter uma secao de configuracoes acessivel a partir da view da instancia, onde o usuario pode visualizar e editar as configuracoes atuais
- **FR2:** O usuario deve poder atualizar o Telegram bot token da instancia ja deployada, com a alteracao propagada para o DB (criptografado) e para o container Docker (openclaw.json)
- **FR3:** O Telegram bot token deve ser validado no formato regex antes de aceitar o input (formato: `digits:alphanumeric-35chars`)
- **FR4:** Apos validacao de formato, o sistema deve fazer uma chamada `getMe` a API do Telegram para verificar que o token e valido e pertence a um bot real, exibindo o nome do bot como confirmacao
- **FR5:** O campo de token deve exibir o valor atual mascarado (primeiros 4 + ultimos 4 caracteres) — nunca o valor completo
- **FR6:** O sistema deve exibir confirmacao visual (toast/alert) apos update bem-sucedido, e erro claro em caso de falha
- **FR7:** O endpoint `PUT /communication` deve seguir o mesmo padrao de seguranca do `PUT /keys` — autenticacao, validacao de ownership, criptografia AES-256-GCM
- **FR8:** O sync-back mechanism deve rejeitar QUALQUER valor contendo `_REDACTED_` para TODOS os campos sensiveis (tokens, API keys, senhas) via guard generico
- **FR9:** O modelo AI da instancia deve ser editavel na mesma secao de settings (dropdown com os modelos disponiveis baseado nas API keys configuradas)

### 3.2 Non-Functional Requirements

- **NFR1:** A validacao do token via Telegram API (`getMe`) deve ter timeout de 5 segundos, com fallback para aceitar apenas validacao de formato se a API nao responder
- **NFR2:** O token nunca deve ser logado, retornado em plain text via API, ou incluido em error messages — sempre mascarado ou criptografado
- **NFR3:** A latencia do update (submit a confirmacao) deve ser < 3 segundos em condicoes normais
- **NFR4:** O campo de token deve ter rate limiting de 5 tentativas por minuto para prevenir brute-force
- **NFR5:** A pagina de settings deve ser responsiva e funcional em mobile (mesma experiencia do deploy form)

---

## 4. User Interface Design Goals

### 4.1 Overall UX Vision

Interface minimalista e confiante, consistente com o design existente do dashboard. O usuario deve sentir que esta em controle das configuracoes sem medo de quebrar algo — feedback claro a cada acao.

### 4.2 Core Screens and Views

- **Instance Settings Section:** Dentro da view de instancia existente (`ViewInstance`), cards de configuracao abaixo dos cards existentes (status, logs, getting-started)
  - Card "Comunicacao": exibe canal atual (Telegram icon + bot name), botao "Editar token"
  - Card "Modelo AI": exibe modelo atual, dropdown para trocar
  - Cada card segue o padrao visual dos cards existentes no dashboard

### 4.3 Key Interaction Paradigms

- **Edit-in-place:** Clicar em "Editar" abre dialog (mesmo padrao do `TelegramConfiguration` do deploy)
- **Validacao em tempo real:** Feedback visual no campo (borda verde/vermelha) conforme o usuario digita
- **Confirmacao de bot:** Apos formato valido, chamada automatica `getMe` mostra nome do bot antes do submit
- **Mascaramento:** Token atual exibido mascarado no card, com icone de cadeado

### 4.4 Accessibility

WCAG AA

### 4.5 Target Platforms

Web Responsive (desktop + mobile)

---

## 5. Technical Assumptions

### 5.1 Stack

- **Frontend:** React 19, Next.js 16, Tailwind v4, react-hook-form, Zod
- **Backend:** Hono 4, Drizzle ORM
- **Validacao:** Zod schemas (reuso do pacote `@workspace/openclaw/config`)
- **Criptografia:** AES-256-GCM existente em `@workspace/shared/crypto`
- **Container update:** Atualizar `openclaw.json` no volume bind-mounted + `docker restart` (padrao do `PUT /skills`, NAO do `PUT /keys` que recria o container inteiro)

> **NOTA TECNICA CRITICA:** O bot token do Telegram vive no `openclaw.json` (arquivo no volume), NAO em env vars do Docker. Isso significa que a propagacao e MAIS SIMPLES que `PUT /keys` (que precisa stop+rm+run para mudar env vars). Basta: 1) Atualizar o arquivo via SSH, 2) `docker restart`. Seguir o padrao de `PUT /skills/:skillName`.

### 5.2 Architecture

- Novo endpoint `PUT /openclaw/communication` no router existente
- Reuso do `updateInstance()` do Drizzle para persistencia
- Reuso do `TelegramConfiguration` dialog adaptado para modo "edit" (nao so "create")
- Propagacao para container via `updateOpenclawJson()` + `restartContainer()` (padrao skills, NAO `routeUpdateKeys`)
- Novo endpoint `GET /openclaw/communication` para retornar token mascarado ao frontend

### 5.3 Testing

- Validacao de regex do token (unit test)
- Teste de mascaramento (unit test)
- Teste do endpoint com token valido/invalido (integration)
- Teste do guard de redacao generico (unit test)

---

## 6. Epic List

### Epic 1: Instance Settings and Token Management

**Goal:** Permitir que usuarios editem configuracoes de comunicacao (Telegram bot token) e modelo AI apos o deploy, com validacao robusta e propagacao segura para DB e container.

---

## 7. Epic 1 — Instance Settings and Token Management

### Story 1.1: Robust Telegram Token Validation Schema

**As a** developer,
**I want** a rigorous Telegram bot token validation schema,
**so that** invalid tokens are rejected before reaching the DB or container.

**Acceptance Criteria:**

1. O `telegramSchema` em `@workspace/openclaw/config` valida o token com regex `^\d{8,10}:[A-Za-z0-9_-]{35}$`
2. O schema exporta uma funcao `maskToken(token: string): string` que retorna os primeiros 4 + "..." + ultimos 4 caracteres
3. Testes unitarios cobrem: token valido, token curto, token sem ":", token com caracteres especiais, string vazia
4. O guard generico de redacao e extraido para uma utility `isRedactedValue(value: string): boolean` que detecta `_REDACTED_`, `REDACTED`, `***` e variantes comuns
5. O sync-back em `router.ts` usa `isRedactedValue()` em TODOS os campos sensiveis (nao apenas bot token e model)

### Story 1.2: PUT /communication API Endpoint

**As a** user with a deployed instance,
**I want** an API endpoint to update my Telegram bot token,
**so that** I can fix or rotate my token without redeploying.

**Acceptance Criteria:**

1. Endpoint `PUT /openclaw/communication` aceita `{ channel: "telegram", token: "..." }` validado pelo schema atualizado (Story 1.1)
2. O endpoint verifica ownership (user deve ser dono da instancia), retorna 403 se nao for
3. O endpoint chama a Telegram API `getMe` com o token fornecido e retorna 422 se o token for invalido (com mensagem amigavel)
4. Se valido, criptografa o token com AES-256-GCM e atualiza o DB via `updateInstance()`
5. Propaga a mudanca para o container: atualiza `channels.telegram.botToken` no `openclaw.json` via SSH + `docker restart` (NAO recria o container — token vive no config file, nao em env vars)
6. Retorna `{ success: true, botName: "..." }` com o nome do bot confirmado
7. Rate limited: 5 requests por minuto por usuario
8. O token NUNCA aparece em logs ou responses — apenas `botName` e status

### Story 1.2b: GET /communication API Endpoint

**As a** frontend developer,
**I want** an API endpoint that returns the masked communication token and bot info,
**so that** the UI can display current config without exposing sensitive data.

**Acceptance Criteria:**

1. Endpoint `GET /openclaw/communication` retorna `{ channel: "telegram", maskedToken: "1234...wxyz", botName: "MyBot" }`
2. Middleware: `enforceAuth` + `enforceInstance` (mesmo padrao dos outros GET)
3. O token e decriptado do DB, mascarado via `maskToken()`, e o `botName` e obtido via `getMe` da Telegram API (cache 5min)
4. Se o token no DB estiver vazio ou invalido, retorna `{ channel: "telegram", maskedToken: null, botName: null }` com status 200 (nao 404)
5. O token plain text NUNCA aparece na response

### Story 1.3: Instance Settings UI — Communication Card

**As a** user viewing my deployed instance,
**I want** to see and edit my Telegram bot token in the dashboard,
**so that** I can manage my instance configuration without support.

**Acceptance Criteria:**

1. Um card "Comunicacao" aparece na `ViewInstance` quando a instancia existe, mostrando: icone do canal (Telegram), nome do bot (obtido via API), token mascarado
2. Botao "Editar token" abre dialog reutilizando `TelegramConfiguration` adaptado para modo edit (pre-preenchido com token mascarado como placeholder)
3. Validacao em tempo real no campo: borda vermelha + mensagem de erro se formato invalido
4. Apos formato valido, chamada automatica `getMe` exibe nome do bot como preview antes do submit
5. Submit chama `PUT /openclaw/communication`, exibe toast de sucesso com nome do bot ou toast de erro
6. Apos sucesso, invalidar AMBAS as queries: `queries.communication` E `queries.get` (instancia) para refletir mudancas imediatamente em toda a ViewInstance (corrigir o bug existente do `useApiKeys` que nao invalida a query de instancia)
7. Loading state durante o submit (botao disabled + spinner)
8. Chaves i18n em todos 3 locales (en, pt, es)
9. Responsivo: funcional em mobile

### Story 1.4: Instance Settings UI — Model Selection Card

**As a** user viewing my deployed instance,
**I want** to change the AI model from the dashboard,
**so that** I can switch models without redeploying.

**Acceptance Criteria:**

1. Um card "Modelo AI" aparece na `ViewInstance`, mostrando: icone do modelo atual, nome do modelo
2. Dropdown lista apenas modelos para os quais o usuario tem API key configurada
3. Selecionar um modelo diferente chama o endpoint existente `PUT /openclaw/keys` para atualizar o modelo
4. Confirmacao visual (toast) apos update bem-sucedido
5. O card mostra estado atual em tempo real (refetch apos update)
6. Chaves i18n em todos 3 locales (en, pt, es)

---

## 8. Technical Congruence Audit

### Comparacao com fluxos existentes

| Aspecto | PUT /keys (AI keys) | PUT /skills | PUT /communication (novo) |
|---------|---------------------|-------------|--------------------------|
| Onde vive o dado | Docker env vars | openclaw.json | openclaw.json |
| Propagacao | stop+rm+run (recria container) | update file + restart | update file + restart |
| DB update | updateInstance() | N/A (skills nao vao pro DB) | updateInstance() |
| Criptografia | AES-256-GCM | AES-256-GCM (credentials) | AES-256-GCM |
| Middleware | enforceAuth + enforceInstance | enforceAuth + enforceInstance | enforceAuth + enforceInstance |
| Rate limit | Nenhum (gap existente) | Nenhum | 5/min por usuario |
| Cache invalidation | Invalida queries.keys (nao invalida instance - BUG) | N/A | Invalida queries.communication + queries.get |
| Validacao | z.string().optional() | Schema por skill | Regex + Telegram getMe |

### Fluxo completo do PUT /communication

```
Frontend                          API Server                         VPS (SSH)
========                          ==========                         =========
Dialog: novo token                PUT /communication
  regex validation (client)         enforceAuth
  |                                 enforceInstance
  |--- PUT /openclaw/communication  validate(communicationSchema)
  |    { channel, token }           |
  |                                1. Regex validate server-side
  |                                2. Telegram getMe(token) — 5s timeout
  |                                   -> 422 se invalido
  |                                3. encrypt(token, ENCRYPTION_KEY)
  |                                4. updateInstance(id, { communicationToken })  -> DB
  |                                5. updateOpenclawJson(id, vpsId):
  |                                   |--- SSH ----------------------->
  |                                   |    python3: update openclaw.json
  |                                   |    channels.telegram.botToken = token
  |                                   |    docker restart INSTANCE_ID
  |                                   |<-------------------------------
  |                                6. Return { success, botName }
  |  <--- 200 { success, botName } --|
  |
useCommunication hook
  invalidateQueries(communication)
  invalidateQueries(get)           // FIX: invalida instancia tambem
  toast.success(botName)
```

### Sync-back: guarda de ida e volta

```
GET /openclaw (sync-back existente)
  1. Le openclaw.json do container
  2. isRedactedValue(liveBotToken) ? SKIP : compare + update DB
  3. isRedactedValue(liveModel) ? SKIP : compare + update DB
  4. Retorna instancia SEM campos sensiveis
```

O novo `PUT /communication` e o sync-back sao complementares:
- PUT: usuario -> DB -> container (escrita)
- GET sync-back: container -> DB (leitura, com guard anti-redacao)
- Nunca ha conflito: o PUT grava o valor real, o sync-back so atualiza se o valor no container nao estiver redactado

### Fora de escopo (documentado)

- Troca de canal de comunicacao (ex: Telegram -> Discord) — requer redesign do deploy flow
- Atualizacao de `gateway.auth.token` ou `hooks.token` via dashboard — sao tokens internos, nao do usuario
- Discord/WhatsApp token update — canais ainda nao funcionais na plataforma

---

## 9. Checklist Results

| # | Check | Status |
|---|-------|--------|
| 1 | Goals claros e mensuraveis | PASS |
| 2 | Requirements rastreaveis (FR/NFR) | PASS — 9 FR + 5 NFR |
| 3 | Escopo definido (IN/OUT) | PASS — IN: Telegram token, model. OUT: Discord, WhatsApp, billing, channel switch |
| 4 | Riscos identificados | PASS — Token loss por redacao, validacao fraca, sem self-service |
| 5 | Stories sequenciais e independentes | PASS — 1.1 > 1.2 > 1.2b > 1.3 > 1.4 |
| 6 | AC testaveis | PASS — Todos com criterios verificaveis |
| 7 | Alinhamento com incidente | PASS — Resolve root cause + UX gap |
| 8 | Congruencia com fluxos existentes | PASS — Segue padrao PUT /skills (config file), nao PUT /keys (env vars) |
| 9 | Sync-back compativel | PASS — Guard anti-redacao complementar ao novo PUT |

---

## 10. Next Steps

### UX Expert Prompt
> Revise o PRD de Instance Settings (`docs/prd/instance-settings.md`) e proponha o layout dos cards de Comunicacao e Modelo AI dentro do `ViewInstance`, seguindo o design system existente do dashboard.

### Architect Prompt
> Revise o PRD de Instance Settings (`docs/prd/instance-settings.md`) e crie a arquitetura tecnica: endpoint design, propagacao para container, schema changes, e plano de testes. Use o padrao existente de `PUT /keys` como referencia.
