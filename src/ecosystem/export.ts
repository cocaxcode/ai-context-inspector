// ── Exportacion del ecosistema AI a bundle portable ──

import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises'
import { join, basename, dirname, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { runAllScanners } from '../scanner/index.js'
import { applySecretsPolicy } from './secrets.js'
import type { ScanResult } from '../scanner/types.js'
import type {
  ExportOptions,
  EcosystemBundle,
  BundleResources,
  BundleMcpServer,
  BundleSkill,
  BundleAgent,
  BundleMemory,
  BundleMemoryFile,
  BundleContextFile,
  ResourceCategory,
} from './types.js'
import { ACI_DIR, ACI_BUNDLE, ACI_README } from './types.js'

/**
 * Exporta el ecosistema AI del proyecto a un bundle portable.
 */
export async function exportEcosystem(options: ExportOptions): Promise<EcosystemBundle> {
  const scan = await runAllScanners({
    dir: options.dir,
    includeUser: options.includeUser,
    introspect: false,
    timeout: 5000,
  })

  const resources = await buildBundleResources(scan, options)
  const checksum = computeChecksum(resources)
  const warnings: string[] = []

  // Add warning if secrets mode is 'all'
  if (options.secrets === 'all') {
    warnings.push('Secretos incluidos sin redactar. No compartas este bundle publicamente.')
  }

  // Add scan warnings
  for (const w of scan.warnings) {
    warnings.push(`[${w.scanner}] ${w.message}`)
  }

  const bundle: EcosystemBundle = {
    version: 1,
    createdAt: new Date().toISOString(),
    sourceProject: scan.project.name,
    checksum,
    warnings,
    resources,
  }

  // Write bundle to .aci/ directory
  const aciDir = join(options.dir, ACI_DIR)
  await writeBundle(bundle, aciDir)

  // Generate and write README
  const readme = generateReadme(bundle)
  await writeFile(join(aciDir, ACI_README), readme, 'utf-8')

  // Ensure .aci/ is in .gitignore
  await ensureGitignore(options.dir)

  return bundle
}

/**
 * Construye los recursos del bundle a partir del resultado del scan.
 */
export async function buildBundleResources(
  scan: ScanResult,
  options: ExportOptions,
): Promise<BundleResources> {
  const categories = options.only ?? (['mcp', 'skills', 'agents', 'memories', 'context'] as ResourceCategory[])
  const projectDir = scan.project.path

  const resources: BundleResources = {
    mcpServers: [],
    skills: [],
    agents: [],
    memories: [],
    contextFiles: [],
  }

  if (categories.includes('mcp')) {
    resources.mcpServers = buildMcpServers(scan, options)
  }

  if (categories.includes('skills')) {
    resources.skills = await buildSkills(scan)
  }

  if (categories.includes('agents')) {
    resources.agents = await buildAgents(scan)
  }

  if (categories.includes('memories')) {
    resources.memories = await buildMemories(scan, projectDir)
  }

  if (categories.includes('context')) {
    resources.contextFiles = await buildContextFiles(scan)
  }

  return resources
}

function buildMcpServers(scan: ScanResult, options: ExportOptions): BundleMcpServer[] {
  const servers: BundleMcpServer[] = []

  for (const server of scan.mcpServers) {
    const { env, redacted, included } = applySecretsPolicy(
      server.config.env,
      options.secrets,
      options.secretDecisions,
    )

    // Map source to scope (project/vscode -> project, user/desktop -> user)
    const scope: 'project' | 'user' =
      server.source === 'user' || server.source === 'desktop' ? 'user' : 'project'

    servers.push({
      name: server.name,
      scope,
      config: {
        transport: server.config.transport,
        command: server.config.command,
        args: server.config.args,
        env,
        url: server.config.url,
      },
      envVarsRedacted: redacted,
      envVarsIncluded: included,
    })
  }

  return servers
}

async function buildSkills(scan: ScanResult): Promise<BundleSkill[]> {
  const skills: BundleSkill[] = []

  for (const skill of scan.skills) {
    try {
      const content = await readFile(skill.path, 'utf-8')
      const dirName = basename(dirname(skill.path))

      skills.push({
        name: skill.name,
        scope: skill.scope,
        dirName,
        content,
        description: skill.description,
        triggers: skill.triggers,
      })
    } catch {
      // Skip unreadable skills
    }
  }

  return skills
}

async function buildAgents(scan: ScanResult): Promise<BundleAgent[]> {
  const agents: BundleAgent[] = []

  for (const agent of scan.agents) {
    try {
      const content = await readFile(agent.path, 'utf-8')
      const fileName = basename(agent.path)

      agents.push({
        name: agent.name,
        scope: agent.scope,
        fileName,
        content,
        description: agent.description,
        model: agent.model,
      })
    } catch {
      // Skip unreadable agents
    }
  }

  return agents
}

async function buildMemories(scan: ScanResult, projectDir: string): Promise<BundleMemory[]> {
  const memories: BundleMemory[] = []

  for (const memory of scan.memories) {
    // Skip non-filesystem memories (engram via MCP/plugin)
    if (memory.source !== 'filesystem') continue
    if (!memory.path) continue

    const files: BundleMemoryFile[] = []

    try {
      if (memory.type === 'atl' || memory.type === 'openspec') {
        // memory.path is relative like '.atl/' or 'openspec/'
        const cleanPath = memory.path.endsWith('/') ? memory.path.slice(0, -1) : memory.path
        const absDir = join(projectDir, cleanPath)
        const dirFiles = await readDirRecursive(absDir, absDir)
        files.push(...dirFiles)
      } else if (memory.type === 'claude-memory') {
        // memory.path is the absolute path to MEMORY.md
        const content = await readFile(memory.path, 'utf-8')
        files.push({ relativePath: basename(memory.path), content })
      } else if (memory.type === 'agent-memory') {
        // memory.path is the absolute path to directory or .md file
        const s = await stat(memory.path)
        if (s.isDirectory()) {
          const entries = await readdir(memory.path)
          for (const entry of entries) {
            if (!entry.endsWith('.md')) continue
            const filePath = join(memory.path, entry)
            const content = await readFile(filePath, 'utf-8')
            files.push({ relativePath: entry, content })
          }
        } else {
          const content = await readFile(memory.path, 'utf-8')
          files.push({ relativePath: basename(memory.path), content })
        }
      }
    } catch {
      // Skip unreadable memories
    }

    // Determine scope based on type
    const scope: 'project' | 'user' =
      memory.type === 'claude-memory' || memory.type === 'agent-memory' ? 'user' : 'project'

    if (files.length > 0) {
      memories.push({ type: memory.type, scope, files })
    }
  }

  return memories
}

async function buildContextFiles(scan: ScanResult): Promise<BundleContextFile[]> {
  const contextFiles: BundleContextFile[] = []

  for (const cf of scan.contextFiles) {
    if (cf.type === 'directory' && cf.children) {
      // Read each child file fully
      for (const child of cf.children) {
        if (child.type === 'file') {
          try {
            const content = await readFile(child.absolutePath, 'utf-8')
            contextFiles.push({
              path: child.path,
              scope: child.scope,
              tool: child.tool,
              content,
            })
          } catch {
            // Skip unreadable
          }
        }
      }
    } else if (cf.type === 'file') {
      try {
        const content = await readFile(cf.absolutePath, 'utf-8')
        contextFiles.push({
          path: cf.path,
          scope: cf.scope,
          tool: cf.tool,
          content,
        })
      } catch {
        // Skip unreadable
      }
    }
  }

  return contextFiles
}

/**
 * Recursively reads all files in a directory, returning relative paths.
 */
async function readDirRecursive(dirPath: string, basePath: string): Promise<BundleMemoryFile[]> {
  const files: BundleMemoryFile[] = []

  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        const subFiles = await readDirRecursive(fullPath, basePath)
        files.push(...subFiles)
      } else if (entry.isFile()) {
        try {
          const content = await readFile(fullPath, 'utf-8')
          files.push({
            relativePath: relative(basePath, fullPath),
            content,
          })
        } catch {
          // Skip unreadable files
        }
      }
    }
  } catch {
    // Directory not readable
  }

  return files
}

/**
 * Computes SHA-256 checksum of the resources object.
 * Uses sorted keys for deterministic output.
 */
export function computeChecksum(resources: BundleResources): string {
  const json = JSON.stringify(resources, Object.keys(resources).sort())
  return createHash('sha256').update(json).digest('hex')
}

/**
 * Verifies the checksum of an existing bundle.
 */
export function verifyChecksum(bundle: EcosystemBundle): boolean {
  const computed = computeChecksum(bundle.resources)
  return computed === bundle.checksum
}

/**
 * Writes the bundle JSON to a directory, creating it if needed.
 * Returns the full path to the written file.
 */
export async function writeBundle(bundle: EcosystemBundle, dir: string): Promise<string> {
  await mkdir(dir, { recursive: true })
  const filePath = join(dir, ACI_BUNDLE)
  const json = JSON.stringify(bundle, null, 2)
  await writeFile(filePath, json, 'utf-8')
  return filePath
}

/**
 * Generates a human-readable README.md summarizing the bundle.
 */
export function generateReadme(bundle: EcosystemBundle): string {
  const r = bundle.resources
  const lines: string[] = [
    '# ACI Export Bundle',
    '',
    `Proyecto: **${bundle.sourceProject}**`,
    `Fecha: ${bundle.createdAt}`,
    `Version: ${bundle.version}`,
    '',
    '## Contenido',
    '',
    `| Categoria | Cantidad |`,
    `|-----------|----------|`,
    `| MCP Servers | ${r.mcpServers.length} |`,
    `| Skills | ${r.skills.length} |`,
    `| Agents | ${r.agents.length} |`,
    `| Memories | ${r.memories.length} |`,
    `| Context Files | ${r.contextFiles.length} |`,
    '',
  ]

  if (r.mcpServers.length > 0) {
    lines.push('## MCP Servers', '')
    for (const s of r.mcpServers) {
      lines.push(`- **${s.name}** (${s.config.transport}, ${s.scope})`)
      if (s.envVarsRedacted.length > 0) {
        lines.push(`  - Redactadas: ${s.envVarsRedacted.join(', ')}`)
      }
    }
    lines.push('')
  }

  if (r.skills.length > 0) {
    lines.push('## Skills', '')
    for (const s of r.skills) {
      lines.push(`- **${s.name}** — ${s.description ?? 'sin descripcion'}`)
    }
    lines.push('')
  }

  if (r.agents.length > 0) {
    lines.push('## Agents', '')
    for (const a of r.agents) {
      lines.push(`- **${a.name}** — ${a.description ?? 'sin descripcion'}`)
    }
    lines.push('')
  }

  if (r.contextFiles.length > 0) {
    lines.push('## Context Files', '')
    for (const cf of r.contextFiles) {
      lines.push(`- \`${cf.path}\` (${cf.tool})`)
    }
    lines.push('')
  }

  if (bundle.warnings.length > 0) {
    lines.push('## Advertencias', '')
    for (const w of bundle.warnings) {
      lines.push(`- ${w}`)
    }
    lines.push('')
  }

  lines.push('---', 'Generado por [@cocaxcode/ai-context-inspector](https://github.com/cocaxcode/ai-context-inspector)', '')

  return lines.join('\n')
}

/**
 * Ensures .aci/ is listed in .gitignore.
 * Creates the file if it doesn't exist.
 * Returns true if the entry was added.
 */
export async function ensureGitignore(dir: string): Promise<boolean> {
  const gitignorePath = join(dir, '.gitignore')
  const entry = '.aci/'

  let content = ''
  try {
    content = await readFile(gitignorePath, 'utf-8')
  } catch {
    // File doesn't exist, will create it
  }

  // Check if already present
  const lines = content.split('\n')
  if (lines.some((line) => line.trim() === entry)) {
    return false
  }

  // Add entry
  const newContent = content.length > 0 && !content.endsWith('\n')
    ? content + '\n' + entry + '\n'
    : content + entry + '\n'

  await writeFile(gitignorePath, newContent, 'utf-8')
  return true
}
