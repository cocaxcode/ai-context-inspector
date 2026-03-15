# CLAUDE.md — @cocaxcode/ai-context-inspector

## Project Overview

CLI + MCP server that scans projects to discover their complete AI ecosystem. 3 MCP tools, 33 tests.

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
├── cli.ts                # CLI arg parsing + orchestration
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
├── report/
│   ├── generator.ts      # generateHtml(ScanResult) → string
│   ├── sections.ts       # HTML section renderers
│   ├── styles.ts         # CSS (dark/light mode)
│   └── scripts.ts        # JS (collapse, search, preview)
├── tools/
│   ├── scan.ts           # MCP tool: scan project
│   ├── introspect.ts     # MCP tool: introspect specific MCP
│   └── report.ts         # MCP tool: generate HTML report
└── __tests__/
    ├── fixtures/          # Test projects (full, empty, mcp-only)
    ├── helpers.ts         # fixture() path helper
    └── *.test.ts          # 6 test files, 33 tests
```

## Key Patterns

- **Dual mode**: CLI (generates HTML) or MCP server (exposes tools)
- **Factory function**: `createServer()` for testability
- **Scanner pattern**: Each scanner is `async (config) => { data, warnings }`
- **Error handling**: MCP tools return `{ isError: true }`, never throw
- **Logging**: Only `console.error()` — stdout reserved for JSON-RPC/JSON output
- **Catalog-driven**: `AI_FILE_CATALOG` defines all 40+ known AI config files

## Commands

```bash
npm test          # Run all tests (33)
npm run build     # Build with tsup
npm run typecheck # TypeScript check
npm run lint      # ESLint
```

## Conventions

- Spanish for user-facing strings (tool descriptions, error messages, HTML)
- English for code (variable names, comments)
- No semi, single quotes, trailing commas (Prettier)
