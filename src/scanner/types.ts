// ── Scan Configuration ──

export interface ScanConfig {
  dir: string
  includeUser: boolean
  introspect: boolean
  timeout: number
}

// ── Scan Result ──

export interface ScanResult {
  project: ProjectInfo
  contextFiles: ContextFileResult[]
  mcpServers: McpServerResult[]
  skills: SkillResult[]
  agents: AgentResult[]
  memories: MemoryResult[]
  warnings: ScanWarning[]
  scanDuration: number
}

export interface ProjectInfo {
  name: string
  path: string
  scannedAt: string
}

// ── Context Files ──

export type AiTool =
  | 'claude'
  | 'cursor'
  | 'windsurf'
  | 'copilot'
  | 'gemini'
  | 'codex'
  | 'opencode'
  | 'aider'
  | 'cline'
  | 'roo'
  | 'continue'
  | 'amazonq'
  | 'augment'
  | 'replit'
  | 'firebase'
  | 'tabnine'
  | 'sourcegraph'
  | 'vscode'
  | 'universal'

export interface ContextFileResult {
  path: string
  absolutePath: string
  tool: AiTool
  alsoUsedBy: AiTool[]
  type: 'file' | 'directory'
  scope: 'project' | 'user'
  size: number
  preview: string | null
  children?: ContextFileResult[]
  error?: string
}

// ── MCP Servers ──

export interface McpServerResult {
  name: string
  source: 'project' | 'user' | 'vscode' | 'desktop'
  config: McpServerConfig
  introspection: McpIntrospectionResult | null
}

export interface McpServerConfig {
  transport: 'stdio' | 'http' | 'sse'
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  hasEnvVars: boolean
}

export interface McpIntrospectionResult {
  status: 'ok' | 'timeout' | 'error'
  error?: string
  serverInfo?: { name: string; version: string }
  capabilities?: Record<string, unknown>
  instructions?: string
  tools: McpToolInfo[]
  resources: McpResourceInfo[]
  prompts: McpPromptInfo[]
}

export interface McpToolInfo {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

export interface McpResourceInfo {
  name: string
  uri: string
  description?: string
  mimeType?: string
}

export interface McpPromptInfo {
  name: string
  description?: string
  arguments?: { name: string; description?: string; required?: boolean }[]
}

// ── Skills ──

export interface SkillResult {
  name: string
  path: string
  scope: 'project' | 'user'
  description?: string
  triggers?: string[]
}

// ── Agents ──

export interface AgentResult {
  name: string
  path: string
  scope: 'project' | 'user'
  description?: string
  model?: string
  hasMemory: boolean
}

// ── Memories ──

export interface MemoryResult {
  type: 'engram' | 'openspec' | 'atl' | 'claude-memory' | 'agent-memory' | 'other'
  path?: string
  source: 'filesystem' | 'mcp' | 'plugin'
  status: 'active' | 'configured' | 'detected'
  details?: Record<string, unknown>
}

// ── Warnings ──

export interface ScanWarning {
  scanner: string
  message: string
  path?: string
}
