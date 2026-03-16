// ── Mapa de configuracion por herramienta AI destino ──

import type { ImportTarget } from './types.js'

/** Configuracion de rutas y formatos para cada herramienta destino */
export interface TargetConfig {
  /** Ruta relativa al archivo de configuracion MCP */
  mcpConfigPath: string
  /** Formato del JSON de MCP: 'flat' (objeto directo) o 'nested' (bajo clave mcpServers) */
  mcpConfigFormat: 'flat' | 'nested'
  /** Ruta al archivo principal de contexto/instrucciones */
  contextFilePath: string
  /** Directorio de reglas adicionales, o null si no soporta */
  rulesDir: string | null
  /** Directorio de skills, o null si no soporta */
  skillsDir: string | null
  /** Directorio de agents, o null si no soporta */
  agentsDir: string | null
}

/** Configuracion completa para las 7 herramientas soportadas */
export const TARGET_CONFIGS: Record<ImportTarget, TargetConfig> = {
  claude: {
    mcpConfigPath: '.mcp.json',
    mcpConfigFormat: 'flat',
    contextFilePath: 'CLAUDE.md',
    rulesDir: null,
    skillsDir: '.claude/skills',
    agentsDir: '.claude/agents',
  },
  cursor: {
    mcpConfigPath: '.cursor/mcp.json',
    mcpConfigFormat: 'flat',
    contextFilePath: '.cursorrules',
    rulesDir: '.cursor/rules',
    skillsDir: null,
    agentsDir: null,
  },
  windsurf: {
    mcpConfigPath: '.mcp.json',
    mcpConfigFormat: 'flat',
    contextFilePath: '.windsurfrules',
    rulesDir: '.windsurf/rules',
    skillsDir: null,
    agentsDir: null,
  },
  copilot: {
    mcpConfigPath: '.vscode/mcp.json',
    mcpConfigFormat: 'flat',
    contextFilePath: '.github/copilot-instructions.md',
    rulesDir: '.github/instructions',
    skillsDir: null,
    agentsDir: '.github/agents',
  },
  gemini: {
    mcpConfigPath: '.gemini/settings.json',
    mcpConfigFormat: 'nested',
    contextFilePath: 'GEMINI.md',
    rulesDir: '.gemini/rules',
    skillsDir: null,
    agentsDir: null,
  },
  codex: {
    mcpConfigPath: '.mcp.json',
    mcpConfigFormat: 'flat',
    contextFilePath: 'AGENTS.md',
    rulesDir: '.codex/rules',
    skillsDir: null,
    agentsDir: null,
  },
  opencode: {
    mcpConfigPath: 'opencode.json',
    mcpConfigFormat: 'nested',
    contextFilePath: 'OPENCODE.md',
    rulesDir: '.opencode/rules',
    skillsDir: null,
    agentsDir: null,
  },
}

/**
 * Marcadores de archivos/directorios para auto-detectar que herramienta
 * se usa en un proyecto. Se evaluan en orden de prioridad.
 */
export const TOOL_MARKERS: Record<ImportTarget, string[]> = {
  claude: ['CLAUDE.md', '.claude', '.mcp.json'],
  cursor: ['.cursorrules', '.cursor'],
  windsurf: ['.windsurfrules', '.windsurf'],
  copilot: [
    '.github/copilot-instructions.md',
    '.github/agents',
    '.vscode/mcp.json',
  ],
  gemini: ['GEMINI.md', '.gemini'],
  codex: ['AGENTS.md', '.codex'],
  opencode: ['OPENCODE.md', '.opencode', 'opencode.json'],
}

/**
 * Mapeo inverso: archivo de contexto principal -> herramienta.
 * Usado al importar para saber de que herramienta proviene un contexto.
 */
export const PRIMARY_CONTEXT_MAP: Record<string, ImportTarget> = {
  'CLAUDE.md': 'claude',
  '.cursorrules': 'cursor',
  '.windsurfrules': 'windsurf',
  '.github/copilot-instructions.md': 'copilot',
  'GEMINI.md': 'gemini',
  'AGENTS.md': 'codex',
  'OPENCODE.md': 'opencode',
}
