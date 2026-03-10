// TOOLS.md content for each supported locale.
// Used by getDeploymentScript to inject the right language into the container.

const pt = `# TOOLS.md — Seu Ambiente Operacional

## Arquitetura

Voce roda dentro de um container Docker na plataforma **ClaWin1Click**.
Seu processo e o OpenClaw Gateway — um servidor Node.js que recebe mensagens
via Telegram e Web UI, processa com LLM, e executa comandos no container.

## Caminhos

| Caminho | O que e | Persistente? | Permissao |
|---------|---------|:---:|:---:|
| \`/opt/openclaw/\` | Seu home — tudo que importa fica aqui | SIM | rw |
| \`/opt/openclaw/.openclaw/\` | Config do OpenClaw (openclaw.json, workspace/) | SIM | rw |
| \`/opt/openclaw/.openclaw/workspace/\` | Seus arquivos de personalidade (SOUL, AGENTS, TOOLS, MEMORY, etc.) | SIM | rw |
| \`/opt/openclaw/skills/\` | Skills instaladas via ClawHub | SIM | rw |
| \`/opt/openclaw/.local/bin/\` | Binarios instalados (clawhub, gog, etc.) | SIM | rw |
| \`/opt/openclaw/memory/\` | Notas diarias (YYYY-MM-DD.md) | SIM | rw |
| \`/tmp/\` | Temporario (64MB, apagado no restart) | NAO | rw |
| \`/app/\` | Codigo do OpenClaw e skills built-in | SIM | somente leitura |
| \`/app/skills/\` | 52 skills built-in (somente leitura) | SIM | somente leitura |

## Ferramentas Disponiveis

| Ferramenta | Versao | Caminho | Para que serve |
|------------|--------|---------|---------------|
| Node.js | v22 | \`/usr/local/bin/node\` | Runtime JS, npx, npm |
| Python | 3.11 | \`/usr/bin/python3\` | Scripts, pip3 install --user |
| Git | 2.39 | \`/usr/bin/git\` | Controle de versao |
| cURL | — | \`/usr/bin/curl\` | HTTP requests |
| wget | — | \`/usr/bin/wget\` | Downloads |
| ffmpeg | 5.1 | \`/usr/bin/ffmpeg\` | Audio/video processing |
| jq | — | \`/usr/bin/jq\` | JSON no shell |
| yt-dlp | — | \`/usr/local/bin/yt-dlp\` | Download de videos |
| tesseract | — | \`/usr/bin/tesseract\` | OCR (texto em imagens) |
| clawhub | 0.7 | \`/opt/openclaw/.local/bin/clawhub\` | Gerenciar skills |

## Instalar Pacotes

\`\`\`bash
# Node.js (global para o user)
npm install -g <pacote>

# Python
pip3 install --user <pacote>

# Binarios estaticos (Go, Rust, etc.)
curl -L <url> -o /opt/openclaw/.local/bin/<nome> && chmod +x /opt/openclaw/.local/bin/<nome>
\`\`\`

## Skills — 52 Built-in + ClawHub

Skills built-in (em /app/skills/, sempre disponiveis):
1password, apple-notes, apple-reminders, bear-notes, blogwatcher, blucli,
bluebubbles, camsnap, canvas, clawhub, coding-agent, discord, eightctl,
gemini, gh-issues, gifgrep, github, gog, goplaces, healthcheck, himalaya,
imsg, mcporter, model-usage, nano-banana-pro, nano-pdf, notion,
obsidian, openai-image-gen, openai-whisper, openai-whisper-api, openhue,
oracle, ordercli, peekaboo, sag, session-logs, sherpa-onnx-tts,
skill-creator, slack, songsee, sonoscli, spotify-player, summarize,
things-mac, tmux, trello, video-frames, voice-call, wacli, weather, xurl

### ClawHub — Instalar Skills Extras

\`\`\`bash
# Instalar
clawhub install <slug> --workdir /opt/openclaw --dir skills --no-input

# Listar instaladas
clawhub list --workdir /opt/openclaw --dir skills

# Buscar no catalogo
clawhub search <query> --workdir /opt/openclaw --dir skills

# Desinstalar
clawhub uninstall <slug> --yes --workdir /opt/openclaw --dir skills --no-input
\`\`\`

Se uma skill precisa de env vars (ex: TAVILY_API_KEY), peca a chave ao user
e exporte antes de usar: \`export TAVILY_API_KEY=xxx && <comando>\`.

## Variaveis de Ambiente

3 API keys injetadas pelo host (configuraveis pelo user no dashboard):
- \`OPENAI_API_KEY\`
- \`ANTHROPIC_API_KEY\`
- \`GOOGLE_GENERATIVE_AI_API_KEY\`

## Limites do Container

| Recurso | Limite |
|---------|--------|
| RAM | 2 GB |
| CPUs | 1.5 |
| Processos | 512 (PID limit) |
| /tmp | 64 MB (tmpfs) |
| Disco (/opt/openclaw) | ~63 GB disponivel |
| Rede | Outbound total, sem inbound direto |
| Usuario | \`node\` (UID 1000), sem root/sudo |

O filesystem fora de /opt/openclaw e /tmp e somente leitura.
Nao ha sudo. Pacotes de sistema (apt/dpkg) requerem root que voce nao tem.
Browsers (Playwright/Puppeteer) dependem de libs de sistema — nao funcionam aqui.

## Plataforma ClaWin1Click

- **Dashboard:** clawin1click.com/dashboard — user gerencia instancia, billing, skills, API keys
- **Web UI:** {instanceId}.clawin1click.com — chat direto, config, logs
- **Comunicacao:** Telegram (canal primario) + Web UI
- **AI Keys:** Criptografadas AES-256, configuraveis pelo user no dashboard`;

const en = `# TOOLS.md — Your Operating Environment

## Architecture

You run inside a Docker container on the **ClaWin1Click** platform.
Your process is the OpenClaw Gateway — a Node.js server that receives messages
via Telegram and Web UI, processes them with an LLM, and executes commands in the container.

## Paths

| Path | What it is | Persistent? | Permission |
|------|-----------|:---:|:---:|
| \`/opt/openclaw/\` | Your home — everything important lives here | YES | rw |
| \`/opt/openclaw/.openclaw/\` | OpenClaw config (openclaw.json, workspace/) | YES | rw |
| \`/opt/openclaw/.openclaw/workspace/\` | Your personality files (SOUL, AGENTS, TOOLS, MEMORY, etc.) | YES | rw |
| \`/opt/openclaw/skills/\` | Skills installed via ClawHub | YES | rw |
| \`/opt/openclaw/.local/bin/\` | Installed binaries (clawhub, gog, etc.) | YES | rw |
| \`/opt/openclaw/memory/\` | Daily notes (YYYY-MM-DD.md) | YES | rw |
| \`/tmp/\` | Temporary (64MB, cleared on restart) | NO | rw |
| \`/app/\` | OpenClaw code and built-in skills | YES | read-only |
| \`/app/skills/\` | 52 built-in skills (read-only) | YES | read-only |

## Available Tools

| Tool | Version | Path | Purpose |
|------|---------|------|---------|
| Node.js | v22 | \`/usr/local/bin/node\` | JS runtime, npx, npm |
| Python | 3.11 | \`/usr/bin/python3\` | Scripts, pip3 install --user |
| Git | 2.39 | \`/usr/bin/git\` | Version control |
| cURL | — | \`/usr/bin/curl\` | HTTP requests |
| wget | — | \`/usr/bin/wget\` | Downloads |
| ffmpeg | 5.1 | \`/usr/bin/ffmpeg\` | Audio/video processing |
| jq | — | \`/usr/bin/jq\` | JSON in shell |
| yt-dlp | — | \`/usr/local/bin/yt-dlp\` | Video downloads |
| tesseract | — | \`/usr/bin/tesseract\` | OCR (text from images) |
| clawhub | 0.7 | \`/opt/openclaw/.local/bin/clawhub\` | Manage skills |

## Install Packages

\`\`\`bash
# Node.js (global for user)
npm install -g <package>

# Python
pip3 install --user <package>

# Static binaries (Go, Rust, etc.)
curl -L <url> -o /opt/openclaw/.local/bin/<name> && chmod +x /opt/openclaw/.local/bin/<name>
\`\`\`

## Skills — 52 Built-in + ClawHub

Built-in skills (in /app/skills/, always available):
1password, apple-notes, apple-reminders, bear-notes, blogwatcher, blucli,
bluebubbles, camsnap, canvas, clawhub, coding-agent, discord, eightctl,
gemini, gh-issues, gifgrep, github, gog, goplaces, healthcheck, himalaya,
imsg, mcporter, model-usage, nano-banana-pro, nano-pdf, notion,
obsidian, openai-image-gen, openai-whisper, openai-whisper-api, openhue,
oracle, ordercli, peekaboo, sag, session-logs, sherpa-onnx-tts,
skill-creator, slack, songsee, sonoscli, spotify-player, summarize,
things-mac, tmux, trello, video-frames, voice-call, wacli, weather, xurl

### ClawHub — Install Extra Skills

\`\`\`bash
# Install
clawhub install <slug> --workdir /opt/openclaw --dir skills --no-input

# List installed
clawhub list --workdir /opt/openclaw --dir skills

# Search catalog
clawhub search <query> --workdir /opt/openclaw --dir skills

# Uninstall
clawhub uninstall <slug> --yes --workdir /opt/openclaw --dir skills --no-input
\`\`\`

If a skill requires env vars (e.g. TAVILY_API_KEY), ask the user for the key
and export before using: \`export TAVILY_API_KEY=xxx && <command>\`.

## Environment Variables

3 API keys injected by the host (configurable by the user in the dashboard):
- \`OPENAI_API_KEY\`
- \`ANTHROPIC_API_KEY\`
- \`GOOGLE_GENERATIVE_AI_API_KEY\`

## Container Limits

| Resource | Limit |
|----------|-------|
| RAM | 2 GB |
| CPUs | 1.5 |
| Processes | 512 (PID limit) |
| /tmp | 64 MB (tmpfs) |
| Disk (/opt/openclaw) | ~63 GB available |
| Network | Full outbound, no direct inbound |
| User | \`node\` (UID 1000), no root/sudo |

The filesystem outside /opt/openclaw and /tmp is read-only.
No sudo. System packages (apt/dpkg) require root which you don't have.
Browsers (Playwright/Puppeteer) depend on system libraries — they won't work here.

## ClaWin1Click Platform

- **Dashboard:** clawin1click.com/dashboard — user manages instance, billing, skills, API keys
- **Web UI:** {instanceId}.clawin1click.com — direct chat, config, logs
- **Communication:** Telegram (primary channel) + Web UI
- **AI Keys:** AES-256 encrypted, configurable by the user in the dashboard`;

const es = `# TOOLS.md — Tu Entorno Operativo

## Arquitectura

Ejecutas dentro de un contenedor Docker en la plataforma **ClaWin1Click**.
Tu proceso es el OpenClaw Gateway — un servidor Node.js que recibe mensajes
via Telegram y Web UI, los procesa con un LLM y ejecuta comandos en el contenedor.

## Rutas

| Ruta | Que es | Persistente? | Permiso |
|------|--------|:---:|:---:|
| \`/opt/openclaw/\` | Tu home — todo lo importante esta aqui | SI | rw |
| \`/opt/openclaw/.openclaw/\` | Config de OpenClaw (openclaw.json, workspace/) | SI | rw |
| \`/opt/openclaw/.openclaw/workspace/\` | Tus archivos de personalidad (SOUL, AGENTS, TOOLS, MEMORY, etc.) | SI | rw |
| \`/opt/openclaw/skills/\` | Skills instaladas via ClawHub | SI | rw |
| \`/opt/openclaw/.local/bin/\` | Binarios instalados (clawhub, gog, etc.) | SI | rw |
| \`/opt/openclaw/memory/\` | Notas diarias (YYYY-MM-DD.md) | SI | rw |
| \`/tmp/\` | Temporal (64MB, se borra al reiniciar) | NO | rw |
| \`/app/\` | Codigo de OpenClaw y skills integradas | SI | solo lectura |
| \`/app/skills/\` | 52 skills integradas (solo lectura) | SI | solo lectura |

## Herramientas Disponibles

| Herramienta | Version | Ruta | Para que sirve |
|-------------|---------|------|---------------|
| Node.js | v22 | \`/usr/local/bin/node\` | Runtime JS, npx, npm |
| Python | 3.11 | \`/usr/bin/python3\` | Scripts, pip3 install --user |
| Git | 2.39 | \`/usr/bin/git\` | Control de versiones |
| cURL | — | \`/usr/bin/curl\` | Peticiones HTTP |
| wget | — | \`/usr/bin/wget\` | Descargas |
| ffmpeg | 5.1 | \`/usr/bin/ffmpeg\` | Procesamiento audio/video |
| jq | — | \`/usr/bin/jq\` | JSON en shell |
| yt-dlp | — | \`/usr/local/bin/yt-dlp\` | Descarga de videos |
| tesseract | — | \`/usr/bin/tesseract\` | OCR (texto en imagenes) |
| clawhub | 0.7 | \`/opt/openclaw/.local/bin/clawhub\` | Gestionar skills |

## Instalar Paquetes

\`\`\`bash
# Node.js (global para el usuario)
npm install -g <paquete>

# Python
pip3 install --user <paquete>

# Binarios estaticos (Go, Rust, etc.)
curl -L <url> -o /opt/openclaw/.local/bin/<nombre> && chmod +x /opt/openclaw/.local/bin/<nombre>
\`\`\`

## Skills — 52 Integradas + ClawHub

Skills integradas (en /app/skills/, siempre disponibles):
1password, apple-notes, apple-reminders, bear-notes, blogwatcher, blucli,
bluebubbles, camsnap, canvas, clawhub, coding-agent, discord, eightctl,
gemini, gh-issues, gifgrep, github, gog, goplaces, healthcheck, himalaya,
imsg, mcporter, model-usage, nano-banana-pro, nano-pdf, notion,
obsidian, openai-image-gen, openai-whisper, openai-whisper-api, openhue,
oracle, ordercli, peekaboo, sag, session-logs, sherpa-onnx-tts,
skill-creator, slack, songsee, sonoscli, spotify-player, summarize,
things-mac, tmux, trello, video-frames, voice-call, wacli, weather, xurl

### ClawHub — Instalar Skills Extras

\`\`\`bash
# Instalar
clawhub install <slug> --workdir /opt/openclaw --dir skills --no-input

# Listar instaladas
clawhub list --workdir /opt/openclaw --dir skills

# Buscar en el catalogo
clawhub search <query> --workdir /opt/openclaw --dir skills

# Desinstalar
clawhub uninstall <slug> --yes --workdir /opt/openclaw --dir skills --no-input
\`\`\`

Si una skill necesita variables de entorno (ej: TAVILY_API_KEY), pide la clave al usuario
y exportala antes de usar: \`export TAVILY_API_KEY=xxx && <comando>\`.

## Variables de Entorno

3 API keys inyectadas por el host (configurables por el usuario en el dashboard):
- \`OPENAI_API_KEY\`
- \`ANTHROPIC_API_KEY\`
- \`GOOGLE_GENERATIVE_AI_API_KEY\`

## Limites del Contenedor

| Recurso | Limite |
|---------|--------|
| RAM | 2 GB |
| CPUs | 1.5 |
| Procesos | 512 (PID limit) |
| /tmp | 64 MB (tmpfs) |
| Disco (/opt/openclaw) | ~63 GB disponible |
| Red | Salida total, sin entrada directa |
| Usuario | \`node\` (UID 1000), sin root/sudo |

El filesystem fuera de /opt/openclaw y /tmp es solo lectura.
No hay sudo. Paquetes de sistema (apt/dpkg) requieren root que no tienes.
Navegadores (Playwright/Puppeteer) dependen de librerias de sistema — no funcionan aqui.

## Plataforma ClaWin1Click

- **Dashboard:** clawin1click.com/dashboard — el usuario gestiona instancia, billing, skills, API keys
- **Web UI:** {instanceId}.clawin1click.com — chat directo, config, logs
- **Comunicacion:** Telegram (canal principal) + Web UI
- **AI Keys:** Cifradas AES-256, configurables por el usuario en el dashboard`;

const toolsMdByLocale: Record<string, string> = { pt, en, es };

export function getToolsMd(locale?: string): string {
  const lang = locale?.slice(0, 2) ?? "en";
  return toolsMdByLocale[lang] ?? en;
}
