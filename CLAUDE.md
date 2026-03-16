# CLAUDE.md — @cocaxcode/ai-context-inspector

## Project Overview

CLI + MCP server that scans projects to discover their complete AI ecosystem. Export/import configs between 7 AI tools. 5 MCP tools, 104 tests.

## Stack

- TypeScript 5.x (strict mode, ESM)
- @modelcontextprotocol/sdk 1.27.x (client + server)
- Zod 3.25+ for schema validation
- Vitest for testing
- tsup for building (ESM output with shebang)

## Architecture

```
src/
├── index.ts              # Entry: CLI vs MCP mode routing
├── cli.ts                # CLI arg parsing + orchestration (scan, export, import subcommands)
├── server.ts             # createServer() MCP factory
├── scanner/
│   ├── types.ts          # All TypeScript interfaces
│   ├── catalog.ts        # AI_FILE_CATALOG (40+ entries, 13 tools)
│   ├── index.ts          # runAllScanners() orchestrator
│   ├── context-files.ts  # Scan context files (.md, rules, configs)
│   ├── mcp-configs.ts    # Parse .mcp.json, ~/.claude.json, etc.
│   ├── mcp-introspect.ts # Connect to MCP servers, list tools/resources/prompts
│   ├── skills.ts         # Scan skill directories + registry
│   └── memories.ts       # Detect engram, openspec, .atl
├── ecosystem/            # Export/import module
│   ├── types.ts          # EcosystemBundle, ImportTarget, options interfaces
│   ├── index.ts          # Re-exports all public API
│   ├── export.ts         # exportEcosystem() — scan → bundle → .aci/bundle.json
│   ├── import.ts         # loadBundle(), planImport(), executeImport()
│   ├── target-map.ts     # TARGET_CONFIGS for 7 AI tools (paths, formats)
│   ├── detect-target.ts  # Auto-detect which AI tool is used in a project
│   ├── secrets.ts        # Env var detection, sensitive pattern matching
│   └── prompts.ts        # Interactive CLI prompts (categories, secrets, confirm)
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

## Key Patterns

- **Dual mode**: CLI (generates HTML) or MCP server (exposes tools)
- **Factory function**: `createServer()` for testability
- **Scanner pattern**: Each scanner is `async (config) => { data, warnings }`
- **Error handling**: MCP tools return `{ isError: true }`, never throw
- **Logging**: Only `console.error()` — stdout reserved for JSON-RPC/JSON output
- **Catalog-driven**: `AI_FILE_CATALOG` defines all 40+ known AI config files
- **Bundle format**: `.aci/bundle.json` with version, checksum, and categorized resources

## Export/Import Ecosystem

### MCP Tools

- **`export_ecosystem`** — Exports the entire AI ecosystem to a portable `.aci/bundle.json`. Parameters: `dir`, `include_user`, `only` (category filter), `secrets` (`"none"` | `"all"` | `string[]`).
- **`import_ecosystem`** — Imports a bundle into a project, adapting config to the target tool. Parameters: `file`, `dir`, `target` (auto-detected), `scope`, `force`, `confirm` (false = dry-run), `only`, `secrets`.

### CLI Subcommands

- `npx @cocaxcode/ai-context-inspector export [--dir] [--only mcp,skills] [--secrets none|all]`
- `npx @cocaxcode/ai-context-inspector import [bundle.json] [--target cursor] [--force] [--yes]`

### The `.aci/` Directory

Export creates `.aci/bundle.json` — a self-contained JSON with all resources, checksummed. Auto-added to `.gitignore`. Import auto-detects this directory when no file is specified.

### 7 Supported Target Tools

`claude` | `cursor` | `windsurf` | `copilot` | `gemini` | `codex` | `opencode`

Each target has its own path mappings in `TARGET_CONFIGS` (MCP config path, context file, rules dir, skills dir, agents dir).

### Secrets Handling

Env vars in MCP server configs are detected and classified as sensitive (API keys, tokens, passwords). Three modes: `none` (redact all), `all` (include all), `custom` (per-variable). Interactive CLI prompts when no flag is provided.

## Commands

```bash
npm test          # Run all tests (104)
npm run build     # Build with tsup
npm run typecheck # TypeScript check
npm run lint      # ESLint
```

## Conventions

- Spanish for user-facing strings (tool descriptions, error messages, HTML)
- English for code (variable names, comments)
- No semi, single quotes, trailing commas (Prettier)
