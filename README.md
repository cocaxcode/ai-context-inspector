<p align="center">
  <h1 align="center">@cocaxcode/ai-context-inspector</h1>
  <p align="center">
    <strong>See everything your AI tools know about your project.</strong><br/>
    19 AI tools &middot; 6 scanners &middot; 5 MCP tools &middot; Export/Import across 7 tools &middot; CLI + MCP server
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@cocaxcode/ai-context-inspector"><img src="https://img.shields.io/npm/v/@cocaxcode/ai-context-inspector.svg?style=flat-square&color=cb3837" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@cocaxcode/ai-context-inspector"><img src="https://img.shields.io/npm/dm/@cocaxcode/ai-context-inspector.svg?style=flat-square" alt="npm downloads" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/AI%20tools-19%20supported-blueviolet?style=flat-square" alt="19 AI tools" />
  <img src="https://img.shields.io/badge/tests-104-brightgreen?style=flat-square" alt="104 tests" />
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> &middot;
  <a href="#the-solution">The Solution</a> &middot;
  <a href="#installation">Installation</a> &middot;
  <a href="#cli-usage">CLI Usage</a> &middot;
  <a href="#exportimport">Export/Import</a> &middot;
  <a href="#mcp-server">MCP Server</a> &middot;
  <a href="#what-it-detects">What It Detects</a> &middot;
  <a href="#html-dashboard">HTML Dashboard</a> &middot;
  <a href="#architecture">Architecture</a>
</p>

---

## The Problem

Your project has AI configuration scattered everywhere:

- `CLAUDE.md` with project instructions, `.cursorrules` with coding rules, `AGENTS.md` with universal guidelines
- MCP servers configured in `.mcp.json`, `~/.claude.json`, `.vscode/mcp.json` — each with different tools
- Custom skills installed via `npx skills add`, custom agents in `~/.claude/agents/`
- Persistent memories in engram, Claude memory files, agent-specific memory stores
- **You don't know the full picture.** Each tool sees only its own slice.

## The Solution

**AI Context Inspector** scans your entire AI ecosystem in one shot:

```bash
npx @cocaxcode/ai-context-inspector
```

It discovers **every** AI configuration file, MCP server (with live introspection), installed skill, custom agent, and persistent memory — then generates a beautiful HTML dashboard or exposes the data as an MCP server for your AI tools to consume.

**Zero config. Zero dependencies.** Just run it.

---

## Installation

### CLI (one-shot, no install)

```bash
npx @cocaxcode/ai-context-inspector
```

### Claude Code (MCP server)

```bash
claude mcp add --scope user ai-context-inspector -- npx -y @cocaxcode/ai-context-inspector@latest --mcp
```

Or add to your `.mcp.json`:

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

### Cursor / Windsurf

Add to `.cursor/mcp.json` or equivalent:

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

### Codex CLI

```bash
codex mcp add ai-context-inspector -- npx -y @cocaxcode/ai-context-inspector@latest --mcp
```

### VS Code

Add to `.vscode/mcp.json`:

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

---

## CLI Usage

```bash
# Scan current directory → generates HTML report
npx @cocaxcode/ai-context-inspector

# Scan a specific directory
npx @cocaxcode/ai-context-inspector --dir /path/to/project

# Include user-level configs (~/.claude, ~/.gemini, etc.)
npx @cocaxcode/ai-context-inspector --user

# Enable live MCP server introspection (connects to each server)
npx @cocaxcode/ai-context-inspector --introspect

# Set introspection timeout (default: 10000ms)
npx @cocaxcode/ai-context-inspector --introspect --timeout 15000

# Output raw JSON instead of HTML
npx @cocaxcode/ai-context-inspector --json

# Run as MCP server (for AI tool integration)
npx @cocaxcode/ai-context-inspector --mcp

# All flags combined
npx @cocaxcode/ai-context-inspector --dir ./my-project --user --introspect --timeout 15000
```

### CLI Flags Reference

| Flag | Description | Default |
|------|-------------|---------|
| `--dir <path>` | Directory to scan | `.` (current) |
| `--user` | Include user-level configs (`~/`) | `false` |
| `--introspect` | Connect to MCP servers and list tools | `false` |
| `--timeout <ms>` | Introspection timeout per server | `10000` |
| `--json` | Output JSON instead of HTML | `false` |
| `--mcp` | Run as MCP server (stdio transport) | `false` |

---

## Export/Import

Move your AI configuration between tools. Export from one project, import into another — or the same project with a different AI tool.

### Quick Start

```bash
# Export your AI ecosystem to .aci/bundle.json
npx @cocaxcode/ai-context-inspector export

# Import into a project using Cursor
npx @cocaxcode/ai-context-inspector import --target cursor

# Non-interactive export (all categories, no secrets)
npx @cocaxcode/ai-context-inspector export --only mcp,context --secrets none

# Non-interactive import (auto-detect tool, skip confirmation)
npx @cocaxcode/ai-context-inspector import --yes --force
```

### Export Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--dir <path>` | Directory to export | `.` (current) |
| `--output <path>` | Output directory | `.aci/` |
| `--include-user` | Include user-level configs (`~/`) | `false` |
| `--only <categories>` | Filter: `mcp,skills,agents,memories,context` | all |
| `--secrets <mode>` | `none` (redact all) or `all` (include all) | interactive |

### Import Flags

| Flag | Description | Default |
|------|-------------|---------|
| `[file]` | Path to bundle JSON | auto-detect `.aci/bundle.json` |
| `--dir <path>` | Target directory | `.` (current) |
| `--target <tool>` | Target tool (see table below) | auto-detect |
| `--scope <scope>` | `project` or `user` | per-resource |
| `--force` | Overwrite existing resources | `false` |
| `--yes` | Skip confirmation prompt | `false` |
| `--only <categories>` | Filter: `mcp,skills,agents,memories,context` | all |
| `--secrets <mode>` | `none` or `all` | interactive |

### Supported Target Tools

| Target | MCP Config | Context File | Rules Dir | Skills | Agents |
|--------|-----------|-------------|-----------|--------|--------|
| `claude` | `.mcp.json` | `CLAUDE.md` | — | `.claude/skills/` | `.claude/agents/` |
| `cursor` | `.cursor/mcp.json` | `.cursorrules` | `.cursor/rules/` | — | — |
| `windsurf` | `.mcp.json` | `.windsurfrules` | `.windsurf/rules/` | — | — |
| `copilot` | `.vscode/mcp.json` | `.github/copilot-instructions.md` | `.github/instructions/` | — | `.github/agents/` |
| `gemini` | `.gemini/settings.json` | `GEMINI.md` | `.gemini/rules/` | — | — |
| `codex` | `.mcp.json` | `AGENTS.md` | `.codex/rules/` | — | — |
| `opencode` | `opencode.json` | `OPENCODE.md` | `.opencode/rules/` | — | — |

### The `.aci/` Directory

Export creates `.aci/bundle.json` — a self-contained, checksummed JSON bundle with all your AI resources. It is automatically added to `.gitignore`. Import auto-detects this directory when no file path is specified.

### Secrets Handling

Environment variables in MCP server configs (API keys, tokens, passwords) are detected automatically. Three modes:

- **`none`** — redact all sensitive values (safe for sharing)
- **`all`** — include all values as-is
- **interactive** (default in CLI) — prompt per variable

---

## MCP Server

When running as an MCP server (`--mcp`), five tools are exposed:

### `scan`

Scan a project directory to discover its complete AI ecosystem.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory` | string | No | Path to scan (default: cwd) |
| `include_user` | boolean | No | Include user-level configs |
| `introspect` | boolean | No | Live-connect to MCP servers |
| `timeout` | number | No | Introspection timeout (ms) |

**Example prompt:** _"Scan this project and tell me what AI tools are configured"_

### `introspect_mcp`

Connect to a specific MCP server and list its tools, resources, and prompts.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `command` | string | Yes* | Command to launch the server |
| `args` | string[] | No | Arguments for the command |
| `env` | object | No | Environment variables |
| `url` | string | Yes* | URL for HTTP/SSE servers |
| `transport` | string | No | `stdio` (default) or `http` |
| `timeout` | number | No | Connection timeout (ms) |

*Either `command` (stdio) or `url` (http) is required.

**Example prompt:** _"Introspect the MCP server at npx @anthropic/mcp-server-memory"_

### `generate_report`

Generate a standalone HTML dashboard from scan results.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory` | string | No | Path to scan |
| `include_user` | boolean | No | Include user-level configs |
| `introspect` | boolean | No | Introspect MCP servers |
| `timeout` | number | No | Introspection timeout (ms) |

**Example prompt:** _"Generate an HTML report of my project's AI context"_

### `export_ecosystem`

Export the complete AI ecosystem to a portable `.aci/bundle.json`.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dir` | string | No | Directory to scan (default: cwd) |
| `include_user` | boolean | No | Include user-level configs |
| `only` | string[] | No | Categories: `mcp`, `skills`, `agents`, `memories`, `context` |
| `secrets` | string | No | `"none"` (default), `"all"`, or `["VAR1", "VAR2"]` to include specific vars |

**Example prompt:** _"Export my AI ecosystem without secrets"_

### `import_ecosystem`

Import a bundle into a project, adapting configuration to the target AI tool.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | string | No | Path to bundle (auto-detects `.aci/bundle.json`) |
| `dir` | string | No | Target directory (default: cwd) |
| `target` | string | No | Target tool (auto-detects). One of: `claude`, `cursor`, `windsurf`, `copilot`, `gemini`, `codex`, `opencode` |
| `scope` | string | No | `project` or `user` |
| `force` | boolean | No | Overwrite existing resources |
| `confirm` | boolean | No | Execute import (default: `false` = dry-run plan only) |
| `only` | string[] | No | Categories to import |
| `secrets` | string | No | `"none"`, `"all"`, `["VAR1"]`, or `{"VAR1": "value"}` |

**Example prompt:** _"Import the AI bundle into this project for Cursor"_

---

## What It Detects

### 19 AI Coding Tools

| Tool | Context Files | Description |
|------|--------------|-------------|
| **Claude Code** | `CLAUDE.md`, `.claude/`, `.mcp.json` | Project instructions + MCP config |
| **Cursor** | `.cursorrules`, `.cursor/rules/`, `.cursorignore` | Rules + ignore patterns |
| **Windsurf** | `.windsurfrules`, `.windsurf/rules/` | Codeium/Windsurf rules |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `.github/agents/` | Instructions + custom agents |
| **Gemini CLI** | `GEMINI.md`, `.gemini/`, `.geminiignore` | Google Gemini config |
| **OpenAI Codex** | `AGENTS.md`, `AGENT.md`, `.codex/` | Universal agent instructions |
| **OpenCode** | `OPENCODE.md`, `.opencode/`, `opencode.json` | OpenCode CLI config |
| **Aider** | `.aider.conf.yml`, `.aiderignore` | Aider config + model settings |
| **Cline** | `.clinerules`, `.clineignore` | Cline rules (file or directory) |
| **Roo Code** | `.roo/rules/`, `.roorules`, `.rooignore` | Roo Code rules |
| **Continue.dev** | `.continuerules`, `.continue/config.yaml` | Continue rules + config |
| **Amazon Q** | `.amazonq/rules/` | Amazon Q Developer rules |
| **Augment** | `.augment/rules/`, `.augment-guidelines` | Augment Code rules |
| **Replit** | `.replit.md` | Replit Agent instructions |
| **Firebase Studio** | `.idx/airules.md` | Firebase Studio AI rules |
| **VS Code** | `.vscode/mcp.json` | VS Code MCP configuration |
| **Tabnine** | `.tabnine.yaml` | Tabnine AI config |
| **Sourcegraph** | `.sourcegraph/` | Sourcegraph Cody config |
| **Universal** | `CONVENTIONS.md` | Multi-tool conventions |

Plus **user-level configs** (`~/.claude/`, `~/.gemini/`, `~/.codex/`, `~/.continue/`, `~/.aider.conf.yml`, `~/.augment/`, `~/.github/agents/`, `~/.codeium/`, `~/.opencode/`, `~/.tabnine/`).

### MCP Servers

- Discovers servers from `.mcp.json`, `~/.claude.json`, `.vscode/mcp.json`, Claude Desktop config
- Groups by source: project, user, VS Code, desktop
- **Live introspection**: connects to each server, lists tools/resources/prompts with descriptions
- Shows transport type (stdio/http/sse), command, args, environment variables

### Custom Skills

- Scans `.claude/skills/` (project) and `~/.claude/skills/` (user)
- Follows symlinks (installed via `npx skills add`)
- Parses YAML frontmatter for name, description, triggers
- Falls back to `## Purpose` section parsing

### Custom Agents

- Scans `.claude/agents/` (project) and `~/.claude/agents/` (user)
- Parses YAML frontmatter for name, description, model
- Detects if agent has persistent memory (via `~/.claude/agent-memory/`)

### Persistent Memories

- **Claude Memory**: `~/.claude/projects/*/memory/MEMORY.md` with preview
- **Agent Memory**: `~/.claude/agent-memory/` files and directories
- **Engram**: detected as MCP server or Claude Code plugin
- **OpenSpec**: `openspec/` directory with specs and changes count
- **ATL**: `.atl/` directory with file count

---

## HTML Dashboard

The CLI generates a **self-contained HTML file** (no external dependencies) with:

- **Dark/light mode** — auto-detects system preference
- **Summary badges** — total MCPs, tools, files, skills, agents, memories at a glance
- **Collapsible sections** — expand/collapse each category
- **Search** — filter across all sections in real-time
- **File previews** — inline preview of context file contents
- **MCP tool details** — full tool listings with descriptions and input schemas
- **Tool badges** — color-coded by AI tool (Claude, Cursor, Copilot, etc.)

---

## Architecture

```
src/
├── index.ts              # Entry: CLI vs MCP mode routing
├── cli.ts                # CLI arg parsing + orchestration (scan, export, import)
├── server.ts             # createServer() MCP factory
├── scanner/              # Discovery engine
│   ├── types.ts          # All TypeScript interfaces
│   ├── catalog.ts        # AI_FILE_CATALOG (50+ entries, 19 tools)
│   ├── index.ts          # runAllScanners() orchestrator
│   ├── context-files.ts  # Scan context files (.md, rules, configs)
│   ├── mcp-configs.ts    # Parse .mcp.json, ~/.claude.json, etc.
│   ├── mcp-introspect.ts # Connect to MCP servers, list tools/resources
│   ├── utils.ts          # Shared utilities (parseFrontmatter)
│   ├── skills.ts         # Scan skill directories + parse frontmatter
│   ├── agents.ts         # Scan agent directories + detect memory
│   └── memories.ts       # Detect engram, openspec, .atl, claude memory
├── ecosystem/            # Export/import engine
│   ├── types.ts          # Bundle format, import targets, options
│   ├── index.ts          # Public API re-exports
│   ├── export.ts         # Scan → bundle → .aci/bundle.json
│   ├── import.ts         # Load bundle → plan → execute
│   ├── target-map.ts     # Path configs for 7 AI tools
│   ├── detect-target.ts  # Auto-detect AI tool in project
│   ├── secrets.ts        # Env var detection + sensitive patterns
│   └── prompts.ts        # Interactive CLI prompts
├── report/
│   ├── generator.ts      # generateHtml(ScanResult) → string
│   ├── sections.ts       # HTML section renderers
│   ├── styles.ts         # CSS (dark/light mode)
│   └── scripts.ts        # JS (collapse, search, preview)
├── tools/
│   ├── scan.ts           # MCP tool: scan project
│   ├── introspect.ts     # MCP tool: introspect specific MCP
│   ├── report.ts         # MCP tool: generate HTML report
│   ├── export.ts         # MCP tool: export_ecosystem
│   └── import.ts         # MCP tool: import_ecosystem
└── __tests__/
    ├── fixtures/          # Test projects (full, empty, mcp-only, export-project)
    ├── helpers.ts         # fixture() path helper
    └── *.test.ts          # 10 test files, 104 tests
```

### 6 Parallel Scanners

| Scanner | Detects | Sources |
|---------|---------|---------|
| `context-files` | Config files for 19 AI tools | Project + user dirs |
| `mcp-configs` | MCP server definitions | `.mcp.json`, `~/.claude.json`, VS Code, Desktop |
| `mcp-introspect` | Live tool/resource/prompt listings | stdio/http connections |
| `skills` | Custom Claude Code skills | `.claude/skills/` + symlinks |
| `agents` | Custom Claude Code agents | `.claude/agents/` + memory detection |
| `memories` | Persistent memory systems | engram, openspec, .atl, claude memory |

All scanners run in parallel via `Promise.all()` for maximum speed.

---

## Stack

- **TypeScript 5.x** — strict mode, ESM
- **@modelcontextprotocol/sdk** — MCP client + server
- **Zod** — schema validation for MCP tool inputs
- **tsup** — build (ESM output with shebang)
- **Vitest** — testing (104 tests)

**Zero runtime dependencies** beyond MCP SDK and Zod.

---

## Contributing

```bash
git clone https://github.com/cocaxcode/ai-context-inspector.git
cd ai-context-inspector
npm install
npm test          # Run all tests
npm run build     # Build with tsup
npm run typecheck # TypeScript check
npm run lint      # ESLint
```

---

## License

MIT &copy; [cocaxcode](https://github.com/cocaxcode)
