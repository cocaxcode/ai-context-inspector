// ── Tipos del ecosistema export/import ──

import type { AiTool } from '../scanner/types.js'

// ── Directorio y archivos ACI ──

/** Nombre del directorio de exportacion */
export const ACI_DIR = '.aci'

/** Nombre del archivo bundle dentro de .aci/ */
export const ACI_BUNDLE = 'bundle.json'

/** Nombre del README generado dentro de .aci/ */
export const ACI_README = 'README.md'

// ── Bundle format ──

/** Formato principal del bundle exportado */
export interface EcosystemBundle {
  version: 1
  createdAt: string
  sourceProject: string
  checksum: string // SHA-256 de JSON.stringify(resources)
  warnings: string[]
  resources: BundleResources
}

/** Todos los recursos incluidos en el bundle */
export interface BundleResources {
  mcpServers: BundleMcpServer[]
  skills: BundleSkill[]
  agents: BundleAgent[]
  memories: BundleMemory[]
  contextFiles: BundleContextFile[]
}

// ── Recursos individuales ──

export interface BundleMcpServer {
  name: string
  scope: 'project' | 'user'
  config: {
    transport: 'stdio' | 'http' | 'sse'
    command?: string
    args?: string[]
    env?: Record<string, string>
    url?: string
  }
  /** Variables de entorno que fueron redactadas */
  envVarsRedacted: string[]
  /** Variables de entorno que fueron incluidas con su valor */
  envVarsIncluded: string[]
}

export interface BundleSkill {
  name: string
  scope: 'project' | 'user'
  dirName: string
  content: string
  description?: string
  triggers?: string[]
}

export interface BundleAgent {
  name: string
  scope: 'project' | 'user'
  fileName: string
  content: string
  description?: string
  model?: string
}

export interface BundleMemory {
  type:
    | 'claude-memory'
    | 'atl'
    | 'openspec'
    | 'engram'
    | 'agent-memory'
    | 'other'
  scope: 'project' | 'user'
  files: BundleMemoryFile[]
}

export interface BundleMemoryFile {
  relativePath: string
  content: string
}

export interface BundleContextFile {
  path: string
  scope: 'project' | 'user'
  /** Herramienta AI asociada (tipo AiTool del scanner) */
  tool: AiTool
  content: string
}

// ── Opciones de exportacion ──

/** Modo de manejo de secretos al exportar */
export type SecretsMode = 'none' | 'all' | 'custom'

/** Categorias de recursos que se pueden filtrar */
export type ResourceCategory =
  | 'mcp'
  | 'skills'
  | 'agents'
  | 'memories'
  | 'context'

export interface ExportOptions {
  dir: string
  includeUser: boolean
  only?: ResourceCategory[]
  secrets: SecretsMode
  /** Decisiones por variable: varName -> true=incluir, false=redactar */
  secretDecisions?: Record<string, boolean>
}

// ── Opciones de importacion ──

/** Herramientas AI soportadas como destino de importacion */
export type ImportTarget =
  | 'claude'
  | 'cursor'
  | 'windsurf'
  | 'copilot'
  | 'gemini'
  | 'codex'
  | 'opencode'

/** Modo de manejo de secretos al importar */
export type ImportSecretsMode = 'none' | 'all' | 'custom'

export interface ImportOptions {
  /** Ruta al bundle; si no se provee, busca .aci/ automaticamente */
  file?: string
  dir: string
  target?: ImportTarget
  scope?: 'project' | 'user'
  force: boolean
  confirm: boolean
  only?: ResourceCategory[]
  secrets: ImportSecretsMode
  /** Valores de variables de entorno a inyectar: varName -> valor o null */
  secretValues?: Record<string, string | null>
}

// ── Plan de importacion ──

export interface ImportPlan {
  target: ImportTarget
  actions: ImportAction[]
  pendingEnvVars: string[]
  summary: {
    install: number
    skip: number
    overwrite: number
    unsupported: number
  }
}

export interface ImportAction {
  category: ResourceCategory
  name: string
  action: 'install' | 'skip' | 'overwrite' | 'unsupported'
  reason?: string
  targetPath: string
}

export interface ImportResult {
  installed: ImportAction[]
  skipped: ImportAction[]
  unsupported: ImportAction[]
  pendingEnvVars: string[]
}

// ── Deteccion de secretos ──

export interface DetectedEnvVar {
  serverName: string
  varName: string
  value: string
  isSensitive: boolean
}
