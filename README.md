# @cocaxcode/ai-context-inspector

[![npm](https://img.shields.io/npm/v/@cocaxcode/ai-context-inspector)](https://www.npmjs.com/package/@cocaxcode/ai-context-inspector)
[![tests](https://img.shields.io/badge/tests-33%20passing-brightgreen)]()
[![tools](https://img.shields.io/badge/AI%20tools-13%20supported-blue)]()
[![license](https://img.shields.io/badge/license-MIT-green)]()

**Escanea cualquier proyecto para descubrir su ecosistema AI completo.** MCP servers, tools, archivos de contexto, skills, memorias — todo en un dashboard HTML interactivo.

## El problema

Tu proyecto tiene archivos de configuración AI dispersos: `CLAUDE.md`, `.cursorrules`, `.mcp.json`, `.windsurfrules`, `GEMINI.md`, `.github/copilot-instructions.md`... y no sabes exactamente qué tienes disponible ni qué tools exponen tus MCP servers.

## La solución

```bash
npx @cocaxcode/ai-context-inspector
```

Genera un **dashboard HTML interactivo** que muestra:
- Todos los archivos de configuración AI encontrados (13 herramientas soportadas)
- MCP servers configurados con sus tools, resources y prompts (introspección real)
- Skills disponibles
- Sistemas de memoria (engram, openspec, .atl)

## Instalacion

```bash
# Uso directo (sin instalar)
npx @cocaxcode/ai-context-inspector

# Instalar globalmente
npm install -g @cocaxcode/ai-context-inspector

# Como MCP server en tu proyecto
# .mcp.json:
{
  "mcpServers": {
    "ai-context-inspector": {
      "command": "npx",
      "args": ["-y", "@cocaxcode/ai-context-inspector", "--mcp"]
    }
  }
}
```

## Uso CLI

```bash
# Escanear directorio actual y generar HTML
npx @cocaxcode/ai-context-inspector

# Escanear otro directorio
npx @cocaxcode/ai-context-inspector --dir /path/to/project

# Output JSON (para pipes o programatico)
npx @cocaxcode/ai-context-inspector --json

# Sin conectar a MCP servers (solo archivos)
npx @cocaxcode/ai-context-inspector --no-introspect

# Incluir configuracion del usuario (~/.claude/, ~/.gemini/, etc.)
npx @cocaxcode/ai-context-inspector --include-user

# Guardar en ruta personalizada
npx @cocaxcode/ai-context-inspector --output ./reports/scan.html

# Timeout personalizado para introspección MCP
npx @cocaxcode/ai-context-inspector --timeout 5000
```

## Uso como MCP Server

Cuando se ejecuta con `--mcp`, expone 3 tools:

| Tool | Descripcion |
|------|-------------|
| `scan` | Escanea un proyecto y retorna todo el ecosistema AI como JSON |
| `introspect_mcp` | Introspecciona un MCP server específico por nombre |
| `generate_report` | Genera el dashboard HTML interactivo |

## Herramientas AI Soportadas (13)

| Herramienta | Archivos detectados |
|-------------|-------------------|
| **Claude** | CLAUDE.md, .claude/, .mcp.json |
| **Cursor** | .cursorrules, .cursor/rules/, .cursorignore |
| **Windsurf** | .windsurfrules, .windsurf/rules/ |
| **GitHub Copilot** | .github/copilot-instructions.md, .github/instructions/, .github/agents/ |
| **Gemini** | GEMINI.md, .gemini/ |
| **OpenAI Codex** | AGENTS.md, AGENT.md, .codex/ |
| **Aider** | .aider.conf.yml, .aiderignore |
| **Cline** | .clinerules, .clineignore |
| **Continue** | ~/.continue/ |
| **Amazon Q** | .amazonq/rules/ |
| **Augment** | .augment/rules/, .augment-guidelines |
| **Replit** | .replit.md |
| **Firebase Studio** | .idx/airules.md |

Ademas detecta: `.vscode/mcp.json`, `CONVENTIONS.md`, y configuraciones a nivel de usuario (`~/.claude/`, `~/.gemini/`, etc.)

## Dashboard HTML

El dashboard generado es un archivo HTML single-file:
- **Zero dependencias externas** — funciona offline, sin servidor
- **Dark/Light mode** automatico (respeta prefers-color-scheme)
- **Busqueda global** — filtra tools, archivos y skills
- **Secciones colapsables** — navega rapido por el contenido
- **Preview de archivos** — ve el contenido sin abrir el editor

## Arquitectura

```
Scanner modular → ScanResult (JSON) → HTML Dashboard
     ↑                  ↑                    ↑
  5 scanners     Usado por CLI         Template literals
  en paralelo    y MCP tools           CSS/JS inline
```

- **33 tests** | **3 MCP tools** | **13 AI tools** | **40+ archivos detectados**
- TypeScript 5.x + ESM + Node 20+
- Zero runtime dependencies beyond MCP SDK + Zod

## License

MIT
