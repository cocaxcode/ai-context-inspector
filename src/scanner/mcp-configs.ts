import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { platform } from 'node:process'
import type { McpServerResult, McpServerConfig, ScanWarning } from './types.js'

const ENV_VAR_REGEX = /\$\{[^}]+\}/

interface RawMcpConfig {
  mcpServers?: Record<string, RawServerEntry>
}

interface RawServerEntry {
  command?: string
  args?: string[]
  env?: Record<string, string>
  type?: 'http' | 'sse' | 'stdio'
  url?: string
  headers?: Record<string, string>
}

function parseServerEntry(
  name: string,
  entry: RawServerEntry,
  source: McpServerResult['source'],
): McpServerResult {
  let transport: McpServerConfig['transport'] = 'stdio'
  if (entry.type === 'http' || entry.type === 'sse') {
    transport = entry.type
  } else if (entry.url && !entry.command) {
    transport = 'http'
  }

  const envStr = JSON.stringify(entry.env ?? {}) + JSON.stringify(entry.args ?? [])
  const hasEnvVars = ENV_VAR_REGEX.test(envStr)

  return {
    name,
    source,
    config: {
      transport,
      command: entry.command,
      args: entry.args,
      env: entry.env,
      url: entry.url,
      hasEnvVars,
    },
    introspection: null,
  }
}

async function readMcpFile(
  filePath: string,
  source: McpServerResult['source'],
): Promise<{ servers: McpServerResult[]; warnings: ScanWarning[] }> {
  const servers: McpServerResult[] = []
  const warnings: ScanWarning[] = []

  try {
    const content = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content) as RawMcpConfig

    const mcpServers = parsed.mcpServers ?? {}
    for (const [name, entry] of Object.entries(mcpServers)) {
      servers.push(parseServerEntry(name, entry, source))
    }
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      warnings.push({
        scanner: 'mcp-configs',
        message: `Error leyendo ${filePath}: ${(err as Error).message}`,
        path: filePath,
      })
    }
  }

  return { servers, warnings }
}

function getDesktopConfigPath(): string {
  if (platform === 'win32') {
    return join(
      process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'),
      'Claude',
      'claude_desktop_config.json',
    )
  }
  if (platform === 'darwin') {
    return join(
      homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json',
    )
  }
  return join(homedir(), '.config', 'claude-desktop', 'claude_desktop_config.json')
}

export async function scanMcpConfigs(
  config: { dir: string; includeUser: boolean },
): Promise<{ servers: McpServerResult[]; warnings: ScanWarning[] }> {
  const allServers: McpServerResult[] = []
  const allWarnings: ScanWarning[] = []

  // Project-level: .mcp.json
  const project = await readMcpFile(join(config.dir, '.mcp.json'), 'project')
  allServers.push(...project.servers)
  allWarnings.push(...project.warnings)

  // VS Code: .vscode/mcp.json
  const vscode = await readMcpFile(join(config.dir, '.vscode', 'mcp.json'), 'vscode')
  allServers.push(...vscode.servers)
  allWarnings.push(...vscode.warnings)

  if (config.includeUser) {
    // User-level: ~/.claude.json
    const user = await readMcpFile(join(homedir(), '.claude.json'), 'user')
    allServers.push(...user.servers)
    allWarnings.push(...user.warnings)

    // Desktop app
    const desktop = await readMcpFile(getDesktopConfigPath(), 'desktop')
    allServers.push(...desktop.servers)
    allWarnings.push(...desktop.warnings)
  }

  return { servers: allServers, warnings: allWarnings }
}
