import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
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

function detectEngram(mcpServers: McpServerResult[]): MemoryResult | null {
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

  const engram = detectEngram(mcpServers)
  if (engram) memories.push(engram)

  return { memories, warnings }
}
