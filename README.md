<p align="center">
  <h1 align="center">@cocaxcode/ai-context-inspector</h1>
  <p align="center">
    <strong>One command. Every AI config in your project. Instantly.</strong><br/>
    CLI + MCP server &middot; 19 tools detected &middot; Export/Import across 7 targets
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@cocaxcode/ai-context-inspector"><img src="https://img.shields.io/npm/v/@cocaxcode/ai-context-inspector.svg?style=flat-square&color=cb3837" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@cocaxcode/ai-context-inspector"><img src="https://img.shields.io/npm/dm/@cocaxcode/ai-context-inspector.svg?style=flat-square" alt="npm downloads" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/AI%20tools-19%20supported-blueviolet?style=flat-square" alt="19 AI tools" />
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#mcp-server-setup">MCP Server</a> &middot;
  <a href="#what-it-detects">What It Detects</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#mcp-tool-reference">Tool Reference</a> &middot;
  <a href="#architecture">Architecture</a>
</p>

---

The most comprehensive AI ecosystem scanner available. AI Context Inspector discovers every AI configuration file, MCP server, custom skill, agent, and persistent memory in your project — across 19 tools — and gives you the full picture in seconds. Export your entire AI setup and import it into any of 7 supported tools (Claude, Cursor, Windsurf, Copilot, Gemini, Codex, OpenCode) with automatic secret redaction. Zero config. Zero runtime dependencies beyond MCP SDK and Zod. **Everything runs locally — your configs and credentials never leave your machine.**

---

## Quick Start

```bash
npx @cocaxcode/ai-context-inspector
```

That's it. An HTML dashboard opens with everything your AI tools know about your project.

```bash
# Scan a specific directory
npx @cocaxcode/ai-context-inspector --dir /path/to/project

# Include user-level configs (~/.claude, ~/.gemini, etc.)
npx @cocaxcode/ai-context-inspector --user

# Live-connect to each MCP server and list its tools
npx @cocaxcode/ai-context-inspector --introspect

# Output raw JSON instead of HTML
npx @cocaxcode/ai-context-inspector --json
```

<details>
<summary>All CLI flags</summary>

| Flag | Description | Default |
|------|-------------|---------|
| `--dir <path>` | Directory to scan | `.` (current) |
| `--user` | Include user-level configs (`~/`) | `false` |
| `--introspect` | Connect to MCP servers and list tools | `false` |
| `--timeout <ms>` | Introspection timeout per server | `10000` |
| `--json` | Output JSON instead of HTML | `false` |
| `--mcp` | Run as MCP server (stdio transport) | `false` |

</details>

---

## MCP Server Setup

Run as an MCP server so your AI tools can inspect their own ecosystem.

### Claude Code

```bash
claude mcp add --scope user ai-context-inspector -- npx -y @cocaxcode/ai-context-inspector@latest --mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ai-context-inspector": {
      "command": "npx",
      "args": ["-y", "@cocaxcode/ai-context-inspector@latest", "--mcp"]
    }
  }
}
```

<details>
<summary>Cursor / Windsurf / VS Code / Codex CLI</summary>

**Cursor / Windsurf** — add to `.cursor/mcp.json` or equivalent:

```json
{
  "mcpServers": {
    "ai-context-inspector": {
      "command": "npx",
      "args": ["-y", "@cocaxcode/ai-context-inspector@latest", "--mcp"]
    }
  }
}
```

**VS Code** — add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "ai-context-inspector": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@cocaxcode/ai-context-inspector@latest", "--mcp"]
    }
  }
}
```

**Codex CLI:**

```bash
codex mcp add ai-context-inspector -- npx -y @cocaxcode/ai-context-inspector@latest --mcp
```

</details>

Or add directly to any `.mcp.json`:

```json
{
  "mcpServers": {
    "ai-context-inspector": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@cocaxcode/ai-context-inspector@latest", "--mcp"]
    }
  }
}
```

---

## What It Detects

| Tool | Context Files | What's Found |
|------|--------------|--------------|
| **Claude Code** | `CLAUDE.md`, `.claude/`, `.mcp.json` | Instructions, MCP config, skills, agents, memory |
| **Cursor** | `.cursorrules`, `.cursor/rules/`, `.cursorignore` | Rules, ignore patterns |
| **Windsurf** | `.windsurfrules`, `.windsurf/rules/` | Codeium/Windsurf rules |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `.github/agents/` | Instructions, custom agents |
| **Gemini CLI** | `GEMINI.md`, `.gemini/`, `.geminiignore` | Config, rules |
| **OpenAI Codex** | `AGENTS.md`, `AGENT.md`, `.codex/` | Agent instructions |
| **OpenCode** | `OPENCODE.md`, `.opencode/`, `opencode.json` | CLI config |
| **Aider** | `.aider.conf.yml`, `.aiderignore` | Config, model settings |
| **Cline** | `.clinerules`, `.clineignore` | Rules (file or directory) |
| **Roo Code** | `.roo/rules/`, `.roorules`, `.rooignore` | Rules |
| **Continue.dev** | `.continuerules`, `.continue/config.yaml` | Rules, config |
| **Amazon Q** | `.amazonq/rules/` | Developer rules |
| **Augment** | `.augment/rules/`, `.augment-guidelines` | Code rules |
| **Replit** | `.replit.md` | Agent instructions |
| **Firebase Studio** | `.idx/airules.md` | AI rules |
| **VS Code** | `.vscode/mcp.json` | MCP configuration |
| **Tabnine** | `.tabnine.yaml` | AI config |
| **Sourcegraph** | `.sourcegraph/` | Cody config |
| **Universal** | `CONVENTIONS.md` | Multi-tool conventions |

> **Tip:** Pass `--user` to also scan user-level configs: `~/.claude/`, `~/.gemini/`, `~/.codex/`, `~/.continue/`, `~/.aider.conf.yml`, `~/.augment/`, `~/.github/agents/`, `~/.codeium/`, `~/.opencode/`, `~/.tabnine/`.

Beyond context files, the scanner also detects:

- **MCP servers** from `.mcp.json`, `~/.claude.json`, `.vscode/mcp.json`, Claude Desktop config — with optional live introspection
- **Custom skills** in `.claude/skills/` (including symlinks from `npx skills add`)
- **Custom agents** in `.claude/agents/` with memory detection
- **Persistent memories** — Claude Memory, agent memory, engram, OpenSpec, ATL

---

## Features

### Scan

```bash
npx @cocaxcode/ai-context-inspector
npx @cocaxcode/ai-context-inspector --user --introspect
```

Generates a self-contained HTML dashboard with dark/light mode, search, collapsible sections, file previews, and color-coded tool badges. Pass `--json` for raw output.

### Export

```bash
# Export your AI ecosystem to .aci/bundle.json
npx @cocaxcode/ai-context-inspector export

# Export only MCP and context configs, redact secrets
npx @cocaxcode/ai-context-inspector export --only mcp,context --secrets none
```

<details>
<summary>Export flags</summary>

| Flag | Description | Default |
|------|-------------|---------|
| `--dir <path>` | Directory to export | `.` |
| `--output <path>` | Output directory | `.aci/` |
| `--include-user` | Include user-level configs | `false` |
| `--only <categories>` | Filter: `mcp,skills,agents,memories,context` | all |
| `--secrets <mode>` | `none` (redact) or `all` (include) | interactive |

</details>

### Import

```bash
# Import into a Cursor project
npx @cocaxcode/ai-context-inspector import --target cursor

# Auto-detect tool, skip confirmation, overwrite existing
npx @cocaxcode/ai-context-inspector import --yes --force
```

<details>
<summary>Import flags</summary>

| Flag | Description | Default |
|------|-------------|---------|
| `[file]` | Path to bundle JSON | auto-detect `.aci/bundle.json` |
| `--dir <path>` | Target directory | `.` |
| `--target <tool>` | Target tool (see table) | auto-detect |
| `--scope <scope>` | `project` or `user` | per-resource |
| `--force` | Overwrite existing resources | `false` |
| `--yes` | Skip confirmation prompt | `false` |
| `--only <categories>` | Filter: `mcp,skills,agents,memories,context` | all |
| `--secrets <mode>` | `none` or `all` | interactive |

</details>

### Supported Import Targets

| Target | MCP Config | Context File | Rules Dir | Skills | Agents |
|--------|-----------|-------------|-----------|--------|--------|
| `claude` | `.mcp.json` | `CLAUDE.md` | -- | `.claude/skills/` | `.claude/agents/` |
| `cursor` | `.cursor/mcp.json` | `.cursorrules` | `.cursor/rules/` | -- | -- |
| `windsurf` | `.mcp.json` | `.windsurfrules` | `.windsurf/rules/` | -- | -- |
| `copilot` | `.vscode/mcp.json` | `.github/copilot-instructions.md` | `.github/instructions/` | -- | `.github/agents/` |
| `gemini` | `.gemini/settings.json` | `GEMINI.md` | `.gemini/rules/` | -- | -- |
| `codex` | `.mcp.json` | `AGENTS.md` | `.codex/rules/` | -- | -- |
| `opencode` | `opencode.json` | `OPENCODE.md` | `.opencode/rules/` | -- | -- |

> **Note:** Secrets handling has three modes: **none** (redact all — safe for sharing), **all** (include as-is), or **interactive** (prompt per variable, CLI default). Environment variables in MCP configs are detected automatically.

---

## MCP Tool Reference

When running as an MCP server (`--mcp`), five tools are exposed:

### `scan`

Discover the complete AI ecosystem in a project directory.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory` | string | No | Path to scan (default: cwd) |
| `include_user` | boolean | No | Include user-level configs |
| `introspect` | boolean | No | Live-connect to MCP servers |
| `timeout` | number | No | Introspection timeout (ms) |

### `introspect_mcp`

Connect to a specific MCP server and list its tools, resources, and prompts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `command` | string | Yes* | Command to launch the server |
| `args` | string[] | No | Arguments for the command |
| `env` | object | No | Environment variables |
| `url` | string | Yes* | URL for HTTP/SSE servers |
| `transport` | string | No | `stdio` (default) or `http` |
| `timeout` | number | No | Connection timeout (ms) |

*Either `command` (stdio) or `url` (http) is required.

### `generate_report`

Generate a standalone HTML dashboard from scan results.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory` | string | No | Path to scan |
| `include_user` | boolean | No | Include user-level configs |
| `introspect` | boolean | No | Introspect MCP servers |
| `timeout` | number | No | Introspection timeout (ms) |

### `export_ecosystem`

Export the complete AI ecosystem to a portable `.aci/bundle.json`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dir` | string | No | Directory to scan (default: cwd) |
| `include_user` | boolean | No | Include user-level configs |
| `only` | string[] | No | Categories: `mcp`, `skills`, `agents`, `memories`, `context` |
| `secrets` | string | No | `"none"` (default), `"all"`, or `["VAR1", "VAR2"]` |

### `import_ecosystem`

Import a bundle into a project, adapting configuration to the target tool.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | string | No | Path to bundle (auto-detects `.aci/bundle.json`) |
| `dir` | string | No | Target directory (default: cwd) |
| `target` | string | No | Target tool (auto-detects): `claude`, `cursor`, `windsurf`, `copilot`, `gemini`, `codex`, `opencode` |
| `scope` | string | No | `project` or `user` |
| `force` | boolean | No | Overwrite existing resources |
| `confirm` | boolean | No | Execute import (default: `false` = dry-run) |
| `only` | string[] | No | Categories to import |
| `secrets` | string | No | `"none"`, `"all"`, `["VAR1"]`, or `{"VAR1": "value"}` |

> **Warning:** `import_ecosystem` defaults to dry-run mode (`confirm: false`). Set `confirm: true` to actually write files.

---

## Architecture

```
src/
├── index.ts              # Entry: CLI vs MCP mode routing
├── cli.ts                # CLI arg parsing + orchestration
├── server.ts             # createServer() MCP factory
├── scanner/              # 6 parallel scanners (Promise.all)
│   ├── catalog.ts        # AI_FILE_CATALOG — 50+ entries, 19 tools
│   ├── context-files.ts  # Scan .md, rules, configs
│   ├── mcp-configs.ts    # Parse .mcp.json, ~/.claude.json, etc.
│   ├── mcp-introspect.ts # Connect to servers, list tools/resources
│   ├── skills.ts         # Skills + symlinks + frontmatter
│   ├── agents.ts         # Agents + memory detection
│   └── memories.ts       # engram, openspec, .atl, claude memory
├── ecosystem/            # Export/import engine
│   ├── export.ts         # Scan → bundle → .aci/bundle.json
│   ├── import.ts         # Load → plan → execute
│   ├── target-map.ts     # Path configs for 7 AI tools
│   ├── detect-target.ts  # Auto-detect tool in project
│   └── secrets.ts        # Env var detection + redaction
├── report/               # HTML dashboard generator
│   ├── generator.ts      # generateHtml(ScanResult) → string
│   ├── sections.ts       # Section renderers
│   ├── styles.ts         # CSS (dark/light)
│   └── scripts.ts        # JS (collapse, search, preview)
└── tools/                # 5 MCP tool handlers
    ├── scan.ts
    ├── introspect.ts
    ├── report.ts
    ├── export.ts
    └── import.ts
```

**Stack:** TypeScript 5 (strict, ESM) / MCP SDK / Zod / tsup / Vitest

---

[MIT](./LICENSE) · Built by [cocaxcode](https://github.com/cocaxcode)
