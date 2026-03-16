import { readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { ScanConfig, AgentResult, ScanWarning } from './types.js'
import { parseFrontmatter } from './utils.js'

const AGENT_DIRS_PROJECT = ['.claude/agents']
const AGENT_DIRS_USER = ['~/.claude/agents']
const AGENT_MEMORY_DIRS_USER = ['~/.claude/agent-memory']

async function scanAgentDir(
  dirPath: string,
  memoryDirPath: string | null,
  scope: 'project' | 'user',
): Promise<AgentResult[]> {
  const agents: AgentResult[] = []

  try {
    const entries = await readdir(dirPath)
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue

      const filePath = join(dirPath, entry)
      try {
        const s = await stat(filePath)
        if (!s.isFile()) continue

        const content = await readFile(filePath, 'utf-8')
        const agentName = entry.replace(/\.md$/, '')

        let name = agentName
        let description: string | undefined
        let model: string | undefined

        const frontmatter = parseFrontmatter(content)
        if (frontmatter) {
          if (frontmatter.name) name = frontmatter.name
          if (frontmatter.description) {
            // Truncate long descriptions (agents can have very long ones)
            description = frontmatter.description.slice(0, 300)
          }
          if (frontmatter.model) model = frontmatter.model
        }

        // Check if agent has persistent memory
        let hasMemory = false
        if (memoryDirPath) {
          try {
            await stat(join(memoryDirPath, agentName))
            hasMemory = true
          } catch {
            // No memory dir
          }
        }

        agents.push({
          name,
          path: filePath,
          scope,
          description,
          model,
          hasMemory,
        })
      } catch {
        // Skip unreadable
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return agents
}

export async function scanAgents(
  config: ScanConfig,
): Promise<{ agents: AgentResult[]; warnings: ScanWarning[] }> {
  const allAgents: AgentResult[] = []
  const warnings: ScanWarning[] = []

  // Project-level agents
  for (const dir of AGENT_DIRS_PROJECT) {
    const fullPath = join(config.dir, dir)
    const found = await scanAgentDir(fullPath, null, 'project')
    allAgents.push(...found)
  }

  // User-level agents
  if (config.includeUser) {
    for (let i = 0; i < AGENT_DIRS_USER.length; i++) {
      const dir = AGENT_DIRS_USER[i]
      const memDir = AGENT_MEMORY_DIRS_USER[i]
      const fullPath = dir.startsWith('~/')
        ? join(homedir(), dir.slice(2))
        : dir
      const memPath = memDir?.startsWith('~/')
        ? join(homedir(), memDir.slice(2))
        : memDir ?? null
      const found = await scanAgentDir(fullPath, memPath, 'user')
      allAgents.push(...found)
    }
  }

  return { agents: allAgents, warnings }
}
