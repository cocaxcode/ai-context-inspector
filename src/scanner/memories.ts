import { readFile, readdir, stat } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { homedir } from 'node:os'
import type {
  ScanConfig,
  MemoryResult,
  McpServerResult,
  ScanWarning,
} from './types.js'

async function detectOpenspec(dir: string): Promise<MemoryResult | null> {
  const openspecDir = join(dir, 'openspec')
  try {
    const s = await stat(openspecDir)
    if (!s.isDirectory()) return null

    let specsCount = 0
    let changesCount = 0

    try {
      const specsDir = join(openspecDir, 'specs')
      const specs = await readdir(specsDir)
      specsCount = specs.filter((f) => !f.startsWith('.')).length
    } catch {
      // No specs dir
    }

    try {
      const changesDir = join(openspecDir, 'changes')
      const changes = await readdir(changesDir)
      changesCount = changes.filter(
        (f) => !f.startsWith('.') && f !== 'archive',
      ).length
    } catch {
      // No changes dir
    }

    return {
      type: 'openspec',
      path: 'openspec/',
      source: 'filesystem',
      status: 'active',
      details: { specs: specsCount, changes: changesCount },
    }
  } catch {
    return null
  }
}

async function detectAtl(dir: string): Promise<MemoryResult | null> {
  const atlDir = join(dir, '.atl')
  try {
    const s = await stat(atlDir)
    if (!s.isDirectory()) return null

    let files: string[] = []
    try {
      files = await readdir(atlDir)
    } catch {
      // Can't read
    }

    return {
      type: 'atl',
      path: '.atl/',
      source: 'filesystem',
      status: 'active',
      details: { files: files.length },
    }
  } catch {
    return null
  }
}

function detectEngramMcp(mcpServers: McpServerResult[]): MemoryResult | null {
  const engram = mcpServers.find(
    (s) =>
      s.name.toLowerCase().includes('engram') ||
      (s.config.command && s.config.command.includes('engram')) ||
      (s.config.args &&
        s.config.args.some((a) => a.toLowerCase().includes('engram'))),
  )

  if (!engram) return null

  return {
    type: 'engram',
    source: 'mcp',
    status: 'configured',
    details: { server: engram.name },
  }
}

/**
 * Detect engram as a Claude Code plugin (enabled in ~/.claude/settings.json)
 */
async function detectEngramPlugin(): Promise<MemoryResult | null> {
  try {
    const settingsPath = join(homedir(), '.claude', 'settings.json')
    const content = await readFile(settingsPath, 'utf-8')
    const settings = JSON.parse(content) as {
      enabledPlugins?: Record<string, boolean>
    }

    if (!settings.enabledPlugins) return null

    const engramKey = Object.keys(settings.enabledPlugins).find(
      (k) => k.toLowerCase().includes('engram') && settings.enabledPlugins![k],
    )

    if (!engramKey) return null

    return {
      type: 'engram',
      source: 'plugin',
      status: 'active',
      details: { plugin: engramKey },
    }
  } catch {
    return null
  }
}

/**
 * Detect Claude Code built-in project memories at ~/.claude/projects/\*\/memory/MEMORY.md
 */
async function detectClaudeMemories(
  _dir: string,
): Promise<MemoryResult[]> {
  const memories: MemoryResult[] = []
  const projectsDir = join(homedir(), '.claude', 'projects')

  try {
    const entries = await readdir(projectsDir)
    for (const entry of entries) {
      const memoryPath = join(projectsDir, entry, 'memory', 'MEMORY.md')
      try {
        const s = await stat(memoryPath)
        if (!s.isFile()) continue

        const content = await readFile(memoryPath, 'utf-8')
        const previewLength = Math.min(content.length, 300)
        const preview = content.slice(0, previewLength)

        // Try to get the project name from the directory naming convention
        // Format: C--path-to-project → C:\path\to\project
        const projectName = entry.replace(/--/g, '/').replace(/-/g, '/')

        memories.push({
          type: 'claude-memory',
          path: memoryPath,
          source: 'filesystem',
          status: 'active',
          details: {
            project: projectName,
            size: s.size,
            preview,
          },
        })
      } catch {
        // No memory file
      }
    }
  } catch {
    // No projects dir
  }

  return memories
}

/**
 * Detect agent memories at ~/.claude/agent-memory/
 */
async function detectAgentMemories(): Promise<MemoryResult[]> {
  const memories: MemoryResult[] = []
  const agentMemDir = join(homedir(), '.claude', 'agent-memory')

  try {
    const entries = await readdir(agentMemDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Agent memory directory (e.g., best-practices-advisor/)
        const memDir = join(agentMemDir, entry.name)
        try {
          const files = await readdir(memDir)
          const mdFiles = files.filter((f) => f.endsWith('.md'))
          if (mdFiles.length > 0) {
            memories.push({
              type: 'agent-memory',
              path: memDir,
              source: 'filesystem',
              status: 'active',
              details: {
                agent: entry.name,
                files: mdFiles.length,
              },
            })
          }
        } catch {
          // Can't read
        }
      } else if (entry.name.endsWith('.md')) {
        // Agent memory file (e.g., best-practices-advisor.md)
        memories.push({
          type: 'agent-memory',
          path: join(agentMemDir, entry.name),
          source: 'filesystem',
          status: 'active',
          details: {
            agent: basename(entry.name, '.md'),
          },
        })
      }
    }
  } catch {
    // No agent-memory dir
  }

  return memories
}

export async function scanMemories(
  config: ScanConfig,
  mcpServers: McpServerResult[],
): Promise<{ memories: MemoryResult[]; warnings: ScanWarning[] }> {
  const memories: MemoryResult[] = []
  const warnings: ScanWarning[] = []

  const openspec = await detectOpenspec(config.dir)
  if (openspec) memories.push(openspec)

  const atl = await detectAtl(config.dir)
  if (atl) memories.push(atl)

  // Engram: check MCP server first, then plugin
  const engramMcp = detectEngramMcp(mcpServers)
  if (engramMcp) {
    memories.push(engramMcp)
  } else if (config.includeUser) {
    const engramPlugin = await detectEngramPlugin()
    if (engramPlugin) memories.push(engramPlugin)
  }

  // User-level memories
  if (config.includeUser) {
    const claudeMemories = await detectClaudeMemories(config.dir)
    memories.push(...claudeMemories)

    const agentMemories = await detectAgentMemories()
    memories.push(...agentMemories)
  }

  return { memories, warnings }
}
