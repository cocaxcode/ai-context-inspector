import type { AiTool } from './types.js'

export interface CatalogEntry {
  path: string
  tool: AiTool
  alsoUsedBy?: AiTool[]
  type: 'file' | 'directory'
  scope: 'project' | 'user'
  description: string
}

export const AI_FILE_CATALOG: CatalogEntry[] = [
  // ── Claude ──
  {
    path: 'CLAUDE.md',
    tool: 'claude',
    type: 'file',
    scope: 'project',
    description: 'Instrucciones de proyecto para Claude Code',
  },
  {
    path: '.claude',
    tool: 'claude',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de configuración de Claude Code',
  },
  {
    path: '.mcp.json',
    tool: 'claude',
    type: 'file',
    scope: 'project',
    description: 'Configuración de servidores MCP del proyecto',
  },

  // ── Cursor ──
  {
    path: '.cursorrules',
    tool: 'cursor',
    type: 'file',
    scope: 'project',
    description: 'Reglas AI de Cursor (legacy)',
  },
  {
    path: '.cursor/rules',
    tool: 'cursor',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de reglas de Cursor (.mdc)',
  },
  {
    path: '.cursorignore',
    tool: 'cursor',
    type: 'file',
    scope: 'project',
    description: 'Archivos ignorados por Cursor AI',
  },
  {
    path: '.cursorindexingignore',
    tool: 'cursor',
    type: 'file',
    scope: 'project',
    description: 'Archivos excluidos del indexado de Cursor',
  },

  // ── Windsurf / Codeium ──
  {
    path: '.windsurfrules',
    tool: 'windsurf',
    type: 'file',
    scope: 'project',
    description: 'Reglas AI de Windsurf',
  },
  {
    path: '.windsurf/rules',
    tool: 'windsurf',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de reglas de Windsurf',
  },

  // ── GitHub Copilot ──
  {
    path: '.github/copilot-instructions.md',
    tool: 'copilot',
    type: 'file',
    scope: 'project',
    description: 'Instrucciones personalizadas de GitHub Copilot',
  },
  {
    path: '.github/instructions',
    tool: 'copilot',
    type: 'directory',
    scope: 'project',
    description: 'Instrucciones por ruta de Copilot',
  },
  {
    path: '.github/agents',
    tool: 'copilot',
    type: 'directory',
    scope: 'project',
    description: 'Agentes personalizados de Copilot',
  },
  {
    path: '.copilotignore',
    tool: 'copilot',
    type: 'file',
    scope: 'project',
    description: 'Archivos excluidos de Copilot',
  },

  // ── Gemini ──
  {
    path: 'GEMINI.md',
    tool: 'gemini',
    type: 'file',
    scope: 'project',
    description: 'Instrucciones de proyecto para Gemini CLI',
  },
  {
    path: '.gemini',
    tool: 'gemini',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de configuración de Gemini',
  },
  {
    path: '.geminiignore',
    tool: 'gemini',
    type: 'file',
    scope: 'project',
    description: 'Archivos excluidos de Gemini',
  },

  // ── OpenAI Codex ──
  {
    path: 'AGENTS.md',
    tool: 'codex',
    alsoUsedBy: ['copilot', 'cursor', 'gemini'],
    type: 'file',
    scope: 'project',
    description: 'Instrucciones universales de agentes (multi-tool)',
  },
  {
    path: 'AGENT.md',
    tool: 'codex',
    alsoUsedBy: ['gemini'],
    type: 'file',
    scope: 'project',
    description: 'Instrucciones de agente (alias)',
  },
  {
    path: '.codex',
    tool: 'codex',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de configuración de Codex',
  },

  // ── OpenCode ──
  {
    path: 'OPENCODE.md',
    tool: 'opencode',
    type: 'file',
    scope: 'project',
    description: 'Instrucciones de proyecto para OpenCode CLI',
  },
  {
    path: '.opencode',
    tool: 'opencode',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de configuración de OpenCode',
  },
  {
    path: 'opencode.json',
    tool: 'opencode',
    type: 'file',
    scope: 'project',
    description: 'Configuración de OpenCode',
  },

  // ── Roo Code (ex-Cline fork) ──
  {
    path: '.roo/rules',
    tool: 'roo',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de reglas de Roo Code',
  },
  {
    path: '.roorules',
    tool: 'roo',
    type: 'file',
    scope: 'project',
    description: 'Reglas de Roo Code (archivo único)',
  },
  {
    path: '.rooignore',
    tool: 'roo',
    type: 'file',
    scope: 'project',
    description: 'Archivos excluidos de Roo Code',
  },

  // ── Aider ──
  {
    path: '.aider.conf.yml',
    tool: 'aider',
    type: 'file',
    scope: 'project',
    description: 'Configuración YAML de Aider',
  },
  {
    path: '.aiderignore',
    tool: 'aider',
    type: 'file',
    scope: 'project',
    description: 'Archivos ignorados por Aider',
  },
  {
    path: '.aider.model.settings.yml',
    tool: 'aider',
    type: 'file',
    scope: 'project',
    description: 'Configuración de modelo de Aider',
  },
  {
    path: '.aider.model.metadata.json',
    tool: 'aider',
    type: 'file',
    scope: 'project',
    description: 'Metadatos de modelo de Aider',
  },

  // ── Cline ──
  {
    path: '.clinerules',
    tool: 'cline',
    type: 'file',
    scope: 'project',
    description: 'Reglas de Cline (archivo único)',
  },
  {
    path: '.clinerules',
    tool: 'cline',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de reglas de Cline',
  },
  {
    path: '.clineignore',
    tool: 'cline',
    type: 'file',
    scope: 'project',
    description: 'Archivos excluidos de Cline',
  },

  // ── Amazon Q ──
  {
    path: '.amazonq/rules',
    tool: 'amazonq',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de reglas de Amazon Q Developer',
  },

  // ── Augment ──
  {
    path: '.augment/rules',
    tool: 'augment',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de reglas de Augment Code',
  },
  {
    path: '.augment-guidelines',
    tool: 'augment',
    type: 'file',
    scope: 'project',
    description: 'Directrices de Augment (legacy)',
  },

  // ── Replit ──
  {
    path: '.replit.md',
    tool: 'replit',
    type: 'file',
    scope: 'project',
    description: 'Instrucciones de Replit Agent',
  },

  // ── Firebase Studio ──
  {
    path: '.idx/airules.md',
    tool: 'firebase',
    type: 'file',
    scope: 'project',
    description: 'Reglas AI de Firebase Studio',
  },

  // ── VS Code ──
  {
    path: '.vscode/mcp.json',
    tool: 'vscode',
    type: 'file',
    scope: 'project',
    description: 'Configuración MCP de VS Code',
  },

  // ── Universal ──
  {
    path: 'CONVENTIONS.md',
    tool: 'universal',
    type: 'file',
    scope: 'project',
    description: 'Convenciones de código (multi-tool)',
  },

  // ── Tabnine ──
  {
    path: '.tabnine.yaml',
    tool: 'tabnine',
    type: 'file',
    scope: 'project',
    description: 'Configuración de Tabnine AI',
  },

  // ── Sourcegraph / Cody ──
  {
    path: '.sourcegraph',
    tool: 'sourcegraph',
    type: 'directory',
    scope: 'project',
    description: 'Directorio de Sourcegraph Cody',
  },

  // ── Continue.dev (project level) ──
  {
    path: '.continuerules',
    tool: 'continue',
    type: 'file',
    scope: 'project',
    description: 'Reglas de Continue.dev',
  },
  {
    path: '.continue/config.yaml',
    tool: 'continue',
    type: 'file',
    scope: 'project',
    description: 'Configuración de Continue.dev',
  },

  // ── User-level entries ──
  {
    path: '~/.claude',
    tool: 'claude',
    type: 'directory',
    scope: 'user',
    description: 'Configuración global de Claude Code',
  },
  {
    path: '~/.claude.json',
    tool: 'claude',
    type: 'file',
    scope: 'user',
    description: 'Servidores MCP a nivel de usuario',
  },
  {
    path: '~/.claude/CLAUDE.md',
    tool: 'claude',
    type: 'file',
    scope: 'user',
    description: 'Instrucciones globales de Claude Code',
  },
  {
    path: '~/.gemini',
    tool: 'gemini',
    type: 'directory',
    scope: 'user',
    description: 'Configuración global de Gemini CLI',
  },
  {
    path: '~/.gemini/GEMINI.md',
    tool: 'gemini',
    type: 'file',
    scope: 'user',
    description: 'Instrucciones globales de Gemini CLI',
  },
  {
    path: '~/.codex',
    tool: 'codex',
    type: 'directory',
    scope: 'user',
    description: 'Configuración global de Codex CLI',
  },
  {
    path: '~/.continue',
    tool: 'continue',
    type: 'directory',
    scope: 'user',
    description: 'Configuración global de Continue.dev',
  },
  {
    path: '~/.aider.conf.yml',
    tool: 'aider',
    type: 'file',
    scope: 'user',
    description: 'Configuración global de Aider',
  },
  {
    path: '~/.augment/rules',
    tool: 'augment',
    type: 'directory',
    scope: 'user',
    description: 'Reglas globales de Augment',
  },
  {
    path: '~/.github/agents',
    tool: 'copilot',
    type: 'directory',
    scope: 'user',
    description: 'Agentes globales de Copilot',
  },
  {
    path: '~/.codeium',
    tool: 'windsurf',
    type: 'directory',
    scope: 'user',
    description: 'Configuración global de Codeium/Windsurf',
  },
  {
    path: '~/.opencode',
    tool: 'opencode',
    type: 'directory',
    scope: 'user',
    description: 'Configuración global de OpenCode CLI',
  },
  {
    path: '~/.tabnine',
    tool: 'tabnine',
    type: 'directory',
    scope: 'user',
    description: 'Configuración global de Tabnine',
  },
]
