import { readFile } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { resolve } from 'node:path'
import { scanContextFiles } from './context-files.js'
import { scanMcpConfigs } from './mcp-configs.js'
import { introspectServers } from './mcp-introspect.js'
import { scanSkills } from './skills.js'
import { scanAgents } from './agents.js'
import { scanMemories } from './memories.js'
import type { ScanConfig, ScanResult, ProjectInfo, ScanWarning } from './types.js'

async function detectProjectName(dir: string): Promise<string> {
  try {
    const pkg = await readFile(join(dir, 'package.json'), 'utf-8')
    const parsed = JSON.parse(pkg) as { name?: string }
    if (parsed.name) return parsed.name
  } catch {
    // No package.json
  }
  return basename(dir)
}

export async function runAllScanners(config: ScanConfig): Promise<ScanResult> {
  const start = performance.now()
  const warnings: ScanWarning[] = []
  const absDir = resolve(config.dir)

  // Project info
  const name = await detectProjectName(absDir)
  const project: ProjectInfo = {
    name,
    path: absDir,
    scannedAt: new Date().toISOString(),
  }

  // Run file-based scanners in parallel
  const [contextResult, mcpResult, skillsResult, agentsResult] = await Promise.all([
    scanContextFiles({ ...config, dir: absDir }),
    scanMcpConfigs({ dir: absDir, includeUser: config.includeUser }),
    scanSkills({ ...config, dir: absDir }),
    scanAgents({ ...config, dir: absDir }),
  ])

  warnings.push(...contextResult.warnings)
  warnings.push(...mcpResult.warnings)
  warnings.push(...skillsResult.warnings)
  warnings.push(...agentsResult.warnings)

  // Introspect MCP servers if enabled
  if (config.introspect && mcpResult.servers.length > 0) {
    await introspectServers(mcpResult.servers, config.timeout)
  }

  // Memories need MCP servers list (to detect engram)
  const memoriesResult = await scanMemories(
    { ...config, dir: absDir },
    mcpResult.servers,
  )
  warnings.push(...memoriesResult.warnings)

  const scanDuration = Math.round(performance.now() - start)

  return {
    project,
    contextFiles: contextResult.files,
    mcpServers: mcpResult.servers,
    skills: skillsResult.skills,
    agents: agentsResult.agents,
    memories: memoriesResult.memories,
    warnings,
    scanDuration,
  }
}
