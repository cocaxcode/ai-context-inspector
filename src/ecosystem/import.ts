// ── Importacion de bundle del ecosistema AI ──

import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { join, dirname, resolve, relative } from 'node:path'
import { homedir } from 'node:os'
import type {
  EcosystemBundle,
  ImportOptions,
  ImportPlan,
  ImportAction,
  ImportResult,
  ImportTarget,
  BundleMcpServer,
  BundleSkill,
  BundleAgent,
  BundleMemory,
  BundleContextFile,
  ResourceCategory,
} from './types.js'
import { ACI_DIR, ACI_BUNDLE } from './types.js'
import { verifyChecksum } from './export.js'
import { TARGET_CONFIGS, PRIMARY_CONTEXT_MAP } from './target-map.js'
import type { TargetConfig } from './target-map.js'
import { detectTargetTools } from './detect-target.js'
import { ensureGitignore } from './export.js'

/**
 * Carga y valida un bundle desde archivo.
 * Busca en .aci/bundle.json si no se pasa ruta.
 * Verifica version === 1 y checksum.
 */
export async function loadBundle(filePath?: string, dir?: string): Promise<EcosystemBundle> {
  const resolvedPath = filePath ?? join(dir ?? '.', ACI_DIR, ACI_BUNDLE)

  let raw: string
  try {
    raw = await readFile(resolvedPath, 'utf-8')
  } catch {
    throw new Error(`Bundle no encontrado: ${resolvedPath}`)
  }

  let bundle: EcosystemBundle
  try {
    bundle = JSON.parse(raw) as EcosystemBundle
  } catch {
    throw new Error(`Bundle no es JSON valido: ${resolvedPath}`)
  }

  if (bundle.version !== 1) {
    throw new Error(`Version no soportada: ${bundle.version}. Se requiere version 1.`)
  }

  if (!verifyChecksum(bundle)) {
    throw new Error('Checksum invalido: el bundle puede estar corrupto o modificado.')
  }

  return bundle
}

/**
 * Genera el plan de importacion (dry-run) sin escribir nada.
 */
export async function planImport(
  bundle: EcosystemBundle,
  options: ImportOptions,
): Promise<ImportPlan> {
  // Determine target
  let target: ImportTarget
  if (options.target) {
    target = options.target
  } else {
    const detected = await detectTargetTools(options.dir)
    if (detected.length === 0) {
      throw new Error('No se detecto ninguna herramienta AI. Usa --target para especificar una.')
    }
    target = detected[0]
  }

  const config = TARGET_CONFIGS[target]
  const categories = options.only ?? (['mcp', 'skills', 'agents', 'memories', 'context'] as ResourceCategory[])
  const actions: ImportAction[] = []
  const pendingEnvVars: string[] = []

  // MCP servers
  if (categories.includes('mcp')) {
    for (const server of bundle.resources.mcpServers) {
      const scope = resolveScope(server.scope, options.scope)
      const basePath = getScopedBasePath(options.dir, scope)
      const mcpPath = join(basePath, config.mcpConfigPath)

      const conflict = await checkMcpConflict(
        server.name,
        server.config,
        mcpPath,
        config.mcpConfigFormat,
      )

      let action: ImportAction['action']
      let reason: string | undefined

      if (conflict === 'missing') {
        action = 'install'
      } else if (conflict === 'same') {
        action = 'skip'
        reason = 'Misma configuracion ya existe'
      } else {
        // different
        if (options.force) {
          action = 'overwrite'
          reason = 'Configuracion diferente (--force)'
        } else {
          action = 'skip'
          reason = 'Configuracion diferente (usa --force para sobreescribir)'
        }
      }

      actions.push({
        category: 'mcp',
        name: server.name,
        action,
        reason,
        targetPath: mcpPath,
      })

      // Collect pending env vars
      for (const varName of server.envVarsRedacted) {
        if (!pendingEnvVars.includes(varName)) {
          pendingEnvVars.push(varName)
        }
      }
    }
  }

  // Skills
  if (categories.includes('skills')) {
    for (const skill of bundle.resources.skills) {
      const scope = resolveScope(skill.scope, options.scope)
      const basePath = getScopedBasePath(options.dir, scope)

      if (config.skillsDir) {
        // Target supports skills natively (claude)
        const skillPath = join(basePath, config.skillsDir, skill.dirName, 'SKILL.md')

        const exists = await fileExists(skillPath)
        if (exists && !options.force) {
          actions.push({
            category: 'skills',
            name: skill.name,
            action: 'skip',
            reason: 'Skill ya existe (usa --force para sobreescribir)',
            targetPath: skillPath,
          })
        } else {
          actions.push({
            category: 'skills',
            name: skill.name,
            action: exists ? 'overwrite' : 'install',
            reason: exists ? 'Sobreescribiendo skill existente (--force)' : undefined,
            targetPath: skillPath,
          })
        }
      } else if (config.rulesDir) {
        // Map skill to rule file
        const rulePath = join(basePath, config.rulesDir, `${skill.dirName}.md`)

        const exists = await fileExists(rulePath)
        if (exists && !options.force) {
          actions.push({
            category: 'skills',
            name: skill.name,
            action: 'skip',
            reason: 'Regla ya existe (usa --force para sobreescribir)',
            targetPath: rulePath,
          })
        } else {
          actions.push({
            category: 'skills',
            name: skill.name,
            action: exists ? 'overwrite' : 'install',
            reason: exists ? 'Sobreescribiendo como regla (--force)' : 'Instalando como regla',
            targetPath: rulePath,
          })
        }
      } else {
        actions.push({
          category: 'skills',
          name: skill.name,
          action: 'unsupported',
          reason: `${target} no soporta skills ni rules`,
          targetPath: '',
        })
      }
    }
  }

  // Agents
  if (categories.includes('agents')) {
    for (const agent of bundle.resources.agents) {
      const scope = resolveScope(agent.scope, options.scope)
      const basePath = getScopedBasePath(options.dir, scope)

      if (config.agentsDir) {
        const agentPath = join(basePath, config.agentsDir, agent.fileName)

        const exists = await fileExists(agentPath)
        if (exists && !options.force) {
          actions.push({
            category: 'agents',
            name: agent.name,
            action: 'skip',
            reason: 'Agent ya existe (usa --force para sobreescribir)',
            targetPath: agentPath,
          })
        } else {
          actions.push({
            category: 'agents',
            name: agent.name,
            action: exists ? 'overwrite' : 'install',
            reason: exists ? 'Sobreescribiendo agent existente (--force)' : undefined,
            targetPath: agentPath,
          })
        }
      } else {
        actions.push({
          category: 'agents',
          name: agent.name,
          action: 'unsupported',
          reason: `${target} no soporta agents`,
          targetPath: '',
        })
      }
    }
  }

  // Context files
  if (categories.includes('context')) {
    for (const cf of bundle.resources.contextFiles) {
      const mappedPath = mapContextFilePath(cf.path, target)

      if (mappedPath) {
        const scope = resolveScope(cf.scope, options.scope)
        const basePath = getScopedBasePath(options.dir, scope)
        const fullPath = join(basePath, mappedPath)

        const exists = await fileExists(fullPath)
        if (exists && !options.force) {
          actions.push({
            category: 'context',
            name: cf.path,
            action: 'skip',
            reason: 'Archivo de contexto ya existe (usa --force para sobreescribir)',
            targetPath: fullPath,
          })
        } else {
          actions.push({
            category: 'context',
            name: cf.path,
            action: exists ? 'overwrite' : 'install',
            reason: exists ? 'Sobreescribiendo contexto (--force)' : undefined,
            targetPath: fullPath,
          })
        }
      } else {
        actions.push({
          category: 'context',
          name: cf.path,
          action: 'unsupported',
          reason: `Sin equivalente en ${target}`,
          targetPath: '',
        })
      }
    }
  }

  // Memories
  if (categories.includes('memories')) {
    for (const memory of bundle.resources.memories) {
      const scope = resolveScope(memory.scope, options.scope)
      const basePath = getScopedBasePath(options.dir, scope)

      for (const file of memory.files) {
        const filePath = join(basePath, file.relativePath)

        const exists = await fileExists(filePath)
        actions.push({
          category: 'memories',
          name: `${memory.type}/${file.relativePath}`,
          action: exists && !options.force ? 'skip' : exists ? 'overwrite' : 'install',
          reason: exists && !options.force
            ? 'Archivo de memoria ya existe'
            : exists
              ? 'Sobreescribiendo memoria (--force)'
              : undefined,
          targetPath: filePath,
        })
      }
    }
  }

  // Build summary
  const summary = {
    install: actions.filter((a) => a.action === 'install').length,
    skip: actions.filter((a) => a.action === 'skip').length,
    overwrite: actions.filter((a) => a.action === 'overwrite').length,
    unsupported: actions.filter((a) => a.action === 'unsupported').length,
  }

  return { target, actions, pendingEnvVars, summary }
}

/**
 * Ejecuta el plan de importacion. Escribe archivos al disco.
 */
export async function executeImport(
  plan: ImportPlan,
  bundle: EcosystemBundle,
  options: ImportOptions,
): Promise<ImportResult> {
  const config = TARGET_CONFIGS[plan.target]
  const installed: ImportAction[] = []
  const skipped: ImportAction[] = []
  const unsupported: ImportAction[] = []

  for (const action of plan.actions) {
    if (action.action === 'unsupported') {
      unsupported.push(action)
      continue
    }

    if (action.action === 'skip') {
      skipped.push(action)
      continue
    }

    // install or overwrite
    try {
      switch (action.category) {
        case 'mcp': {
          const server = bundle.resources.mcpServers.find((s) => s.name === action.name)
          if (server) {
            await installMcpServer(server, action.targetPath, config.mcpConfigFormat, options.secretValues)
          }
          break
        }
        case 'skills': {
          const skill = bundle.resources.skills.find((s) => s.name === action.name)
          if (skill) {
            await installSkill(skill, options.dir, config, options.scope, options.force)
          }
          break
        }
        case 'agents': {
          const agent = bundle.resources.agents.find((a) => a.name === action.name)
          if (agent) {
            await installAgent(agent, options.dir, config, options.scope, options.force)
          }
          break
        }
        case 'context': {
          const cf = bundle.resources.contextFiles.find((c) => c.path === action.name)
          if (cf) {
            const mappedPath = mapContextFilePath(cf.path, plan.target)
            if (mappedPath) {
              await installContextFile(cf, options.dir, mappedPath)
            }
          }
          break
        }
        case 'memories': {
          // Find the memory and file by name pattern "type/relativePath"
          const [memType, ...pathParts] = action.name.split('/')
          const relPath = pathParts.join('/')
          const memory = bundle.resources.memories.find((m) => m.type === memType)
          if (memory) {
            const file = memory.files.find((f) => f.relativePath === relPath)
            if (file) {
              await installMemory({ ...memory, files: [file] }, options.dir)
            }
          }
          break
        }
      }
      installed.push(action)
    } catch {
      // If install fails, mark as skipped with error
      skipped.push({ ...action, reason: 'Error al instalar' })
    }
  }

  // Ensure .aci/ is in .gitignore
  await ensureGitignore(options.dir)

  return {
    installed,
    skipped,
    unsupported,
    pendingEnvVars: plan.pendingEnvVars,
  }
}

/**
 * Comprueba si un MCP server ya existe en el archivo de config destino.
 * Retorna 'missing' | 'same' | 'different'
 */
async function checkMcpConflict(
  serverName: string,
  serverConfig: BundleMcpServer['config'],
  mcpConfigPath: string,
  format: 'flat' | 'nested',
): Promise<'missing' | 'same' | 'different'> {
  let raw: string
  try {
    raw = await readFile(mcpConfigPath, 'utf-8')
  } catch {
    return 'missing'
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return 'missing'
  }

  // flat: { mcpServers: { ... } }
  // nested: { settings?: { mcpServers: { ... } }, mcpServers?: { ... } }
  const servers = (
    format === 'flat'
      ? parsed.mcpServers
      : (parsed.settings as Record<string, unknown> | undefined)?.mcpServers ?? parsed.mcpServers
  ) as Record<string, unknown> | undefined

  if (!servers || !(serverName in servers)) {
    return 'missing'
  }

  const existing = servers[serverName] as Record<string, unknown>

  // Deep compare ignoring env values (only compare structure)
  const keysToCompare = ['command', 'args', 'url', 'transport'] as const
  for (const key of keysToCompare) {
    const a = serverConfig[key as keyof typeof serverConfig]
    const b = existing[key]
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      return 'different'
    }
  }

  return 'same'
}

/**
 * Instala un MCP server en el archivo de config (merge).
 */
async function installMcpServer(
  server: BundleMcpServer,
  mcpConfigPath: string,
  format: 'flat' | 'nested',
  secretValues?: Record<string, string | null>,
): Promise<void> {
  let parsed: Record<string, unknown> = {}

  try {
    const raw = await readFile(mcpConfigPath, 'utf-8')
    parsed = JSON.parse(raw)
  } catch {
    // File doesn't exist or is invalid, start fresh
  }

  // Get or create the mcpServers container based on format
  let serversContainer: Record<string, unknown>
  if (format === 'nested') {
    if (!parsed.settings || typeof parsed.settings !== 'object') {
      parsed.settings = {}
    }
    const settings = parsed.settings as Record<string, unknown>
    if (!settings.mcpServers || typeof settings.mcpServers !== 'object') {
      settings.mcpServers = {}
    }
    serversContainer = settings.mcpServers as Record<string, unknown>
  } else {
    if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') {
      parsed.mcpServers = {}
    }
    serversContainer = parsed.mcpServers as Record<string, unknown>
  }

  // Build the server entry
  const entry: Record<string, unknown> = {}
  if (server.config.command) entry.command = server.config.command
  if (server.config.args) entry.args = server.config.args
  if (server.config.url) entry.url = server.config.url
  if (server.config.transport && server.config.transport !== 'stdio') {
    entry.transport = server.config.transport
  }

  // Process env vars
  if (server.config.env) {
    const env = { ...server.config.env }

    // Apply secret values if provided
    if (secretValues) {
      for (const [varName, value] of Object.entries(secretValues)) {
        if (varName in env && value !== null) {
          env[varName] = value
        }
      }
    }

    entry.env = env
  }

  // Add/replace under mcpServers
  serversContainer[server.name] = entry

  // Write back preserving other keys
  await mkdir(dirname(mcpConfigPath), { recursive: true })
  await writeFile(mcpConfigPath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8')
}

/**
 * Instala un skill en el directorio correcto.
 * Para Claude: .claude/skills/{dirName}/SKILL.md
 * Para otros: {rulesDir}/{dirName}.md (como regla, solo contenido)
 */
async function installSkill(
  skill: BundleSkill,
  dir: string,
  targetConfig: TargetConfig,
  scope?: 'project' | 'user',
  _force?: boolean,
): Promise<void> {
  const effectiveScope = resolveScope(skill.scope, scope)
  const basePath = getScopedBasePath(dir, effectiveScope)

  if (targetConfig.skillsDir) {
    const skillDir = safePath(basePath, join(targetConfig.skillsDir, skill.dirName))
    const skillPath = join(skillDir, 'SKILL.md')
    await mkdir(skillDir, { recursive: true })
    await writeFile(skillPath, skill.content, 'utf-8')
  } else if (targetConfig.rulesDir) {
    const rulesDir = safePath(basePath, targetConfig.rulesDir)
    const rulePath = join(rulesDir, `${skill.dirName}.md`)
    await mkdir(rulesDir, { recursive: true })
    await writeFile(rulePath, skill.content, 'utf-8')
  }
}

/**
 * Instala un agent en el directorio correcto.
 */
async function installAgent(
  agent: BundleAgent,
  dir: string,
  targetConfig: TargetConfig,
  scope?: 'project' | 'user',
  _force?: boolean,
): Promise<void> {
  if (!targetConfig.agentsDir) return

  const effectiveScope = resolveScope(agent.scope, scope)
  const basePath = getScopedBasePath(dir, effectiveScope)
  const agentPath = safePath(basePath, join(targetConfig.agentsDir, agent.fileName))

  await mkdir(dirname(agentPath), { recursive: true })
  await writeFile(agentPath, agent.content, 'utf-8')
}

/**
 * Escribe un context file en la ruta correcta del target.
 */
async function installContextFile(
  file: BundleContextFile,
  dir: string,
  targetPath: string,
): Promise<void> {
  const fullPath = safePath(dir, targetPath)
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, file.content, 'utf-8')
}

/**
 * Escribe archivos de memoria.
 */
async function installMemory(
  memory: BundleMemory,
  dir: string,
): Promise<void> {
  for (const file of memory.files) {
    const filePath = safePath(dir, file.relativePath)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, file.content, 'utf-8')
  }
}

/**
 * Determina el scope efectivo para un recurso.
 */
function resolveScope(
  originalScope: 'project' | 'user',
  overrideScope?: 'project' | 'user',
): 'project' | 'user' {
  if (overrideScope) return overrideScope
  return originalScope
}

/**
 * Mapea un context file del source al path correcto del target.
 * Retorna null si no hay equivalente.
 */
function mapContextFilePath(
  sourcePath: string,
  target: ImportTarget,
): string | null {
  // Check if source is a known primary context file
  if (sourcePath in PRIMARY_CONTEXT_MAP) {
    // Return the target's context file path
    return TARGET_CONFIGS[target].contextFilePath
  }
  // No mapping available for non-primary context files
  return null
}

/**
 * Determina la ruta base segun el scope.
 */
function getScopedBasePath(
  dir: string,
  scope: 'project' | 'user',
): string {
  return scope === 'project' ? dir : homedir()
}

/**
 * Valida que una ruta resuelta no escape del directorio base.
 * Previene path traversal desde datos del bundle.
 */
function safePath(basePath: string, untrustedPath: string): string {
  const resolved = resolve(basePath, untrustedPath)
  const rel = relative(basePath, resolved)
  if (rel.startsWith('..') || resolve(rel) !== rel && rel.startsWith('..')) {
    throw new Error(`Ruta fuera del directorio destino: ${untrustedPath}`)
  }
  // Extra check: the resolved path must start with the base
  if (!resolved.startsWith(resolve(basePath))) {
    throw new Error(`Ruta fuera del directorio destino: ${untrustedPath}`)
  }
  return resolved
}

/**
 * Helper: checks if a file exists.
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
