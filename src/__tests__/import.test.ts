import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { loadBundle, planImport, executeImport } from '../ecosystem/import.js'
import { computeChecksum } from '../ecosystem/export.js'
import type { EcosystemBundle, ImportOptions, BundleResources } from '../ecosystem/types.js'
import { fixture } from './helpers.js'

const SAMPLE_BUNDLE = fixture('sample-bundle.json')
const IMPORT_TARGET = fixture('import-target')

/** Creates a minimal valid bundle programmatically */
function createTestBundle(overrides?: Partial<BundleResources>): EcosystemBundle {
  const resources: BundleResources = {
    mcpServers: overrides?.mcpServers ?? [
      {
        name: 'test-mcp',
        scope: 'project',
        config: {
          transport: 'stdio',
          command: 'npx',
          args: ['test-mcp-server'],
          env: { API_KEY: '${API_KEY}', NODE_ENV: 'development' },
        },
        envVarsRedacted: ['API_KEY'],
        envVarsIncluded: ['NODE_ENV'],
      },
      {
        name: 'simple-mcp',
        scope: 'project',
        config: {
          transport: 'stdio',
          command: 'node',
          args: ['server.js'],
        },
        envVarsRedacted: [],
        envVarsIncluded: [],
      },
    ],
    skills: overrides?.skills ?? [
      {
        name: 'deploy-skill',
        scope: 'project',
        dirName: 'deploy-skill',
        content: '## Deploy Skill\nThis skill handles deployment.',
        description: 'Handles deployment',
        triggers: ['deploy', 'release'],
      },
    ],
    agents: overrides?.agents ?? [
      {
        name: 'review-agent',
        scope: 'project',
        fileName: 'review-agent.md',
        content: '---\nname: review-agent\ndescription: Code review agent\nmodel: sonnet\n---\nYou are a code review agent.',
        description: 'Code review agent',
        model: 'sonnet',
      },
    ],
    memories: overrides?.memories ?? [
      {
        type: 'atl',
        scope: 'project',
        files: [
          { relativePath: 'decisions.md', content: '# Decisions\nUse TypeScript.' },
        ],
      },
    ],
    contextFiles: overrides?.contextFiles ?? [
      {
        path: 'CLAUDE.md',
        scope: 'project',
        tool: 'claude',
        content: '# Sample Project\nThis is a sample.',
      },
    ],
  }

  const checksum = computeChecksum(resources)

  return {
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    sourceProject: 'test-project',
    checksum,
    warnings: [],
    resources,
  }
}

describe('loadBundle', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `aci-import-load-${randomUUID()}`)
    await mkdir(tmpDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tmpDir, { recursive: true, force: true })
    } catch {
      // Cleanup best-effort
    }
  })

  it('carga bundle valido desde ruta explicita', async () => {
    const bundle = await loadBundle(SAMPLE_BUNDLE)
    expect(bundle.version).toBe(1)
    expect(bundle.sourceProject).toBe('sample-project')
    expect(bundle.resources.mcpServers).toHaveLength(2)
  })

  it('carga bundle desde .aci/ auto-detectado', async () => {
    const aciDir = join(tmpDir, '.aci')
    await mkdir(aciDir, { recursive: true })

    const bundle = createTestBundle()
    await writeFile(join(aciDir, 'bundle.json'), JSON.stringify(bundle, null, 2), 'utf-8')

    const loaded = await loadBundle(undefined, tmpDir)
    expect(loaded.version).toBe(1)
    expect(loaded.sourceProject).toBe('test-project')
  })

  it('rechaza bundle con checksum invalido', async () => {
    const bundle = createTestBundle()
    bundle.checksum = 'invalid-checksum'

    const bundlePath = join(tmpDir, 'bad-bundle.json')
    await writeFile(bundlePath, JSON.stringify(bundle), 'utf-8')

    await expect(loadBundle(bundlePath)).rejects.toThrow('Checksum invalido')
  })

  it('rechaza bundle con version incorrecta', async () => {
    const bundle = createTestBundle()
    const raw = JSON.parse(JSON.stringify(bundle))
    raw.version = 2
    // Fix checksum for new version doesn't matter, version check comes first
    const bundlePath = join(tmpDir, 'v2-bundle.json')
    await writeFile(bundlePath, JSON.stringify(raw), 'utf-8')

    await expect(loadBundle(bundlePath)).rejects.toThrow('Version no soportada')
  })

  it('lanza error si no encuentra bundle', async () => {
    await expect(loadBundle(join(tmpDir, 'nonexistent.json'))).rejects.toThrow('Bundle no encontrado')
  })
})

describe('planImport', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `aci-import-plan-${randomUUID()}`)
    await mkdir(tmpDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tmpDir, { recursive: true, force: true })
    } catch {
      // Cleanup best-effort
    }
  })

  const baseOptions: ImportOptions = {
    dir: '', // Set in each test
    force: false,
    confirm: false,
    secrets: 'none',
  }

  it('genera acciones install para recursos nuevos', async () => {
    const bundle = createTestBundle()
    const plan = await planImport(bundle, { ...baseOptions, dir: tmpDir, target: 'claude' })

    // All should be install since tmpDir is empty
    expect(plan.summary.install).toBeGreaterThan(0)
    expect(plan.target).toBe('claude')

    const mcpActions = plan.actions.filter((a) => a.category === 'mcp')
    expect(mcpActions.every((a) => a.action === 'install')).toBe(true)
  })

  it('genera skip para MCP server con misma config', async () => {
    // Create existing MCP config with same server
    await writeFile(
      join(tmpDir, '.mcp.json'),
      JSON.stringify({
        mcpServers: {
          'test-mcp': {
            command: 'npx',
            args: ['test-mcp-server'],
          },
        },
      }),
      'utf-8',
    )

    const bundle = createTestBundle()
    const plan = await planImport(bundle, { ...baseOptions, dir: tmpDir, target: 'claude' })

    const testMcp = plan.actions.find((a) => a.name === 'test-mcp')
    expect(testMcp).toBeDefined()
    expect(testMcp!.action).toBe('skip')
  })

  it('genera skip para MCP server diferente sin force', async () => {
    await writeFile(
      join(tmpDir, '.mcp.json'),
      JSON.stringify({
        mcpServers: {
          'test-mcp': {
            command: 'different-command',
            args: ['different-args'],
          },
        },
      }),
      'utf-8',
    )

    const bundle = createTestBundle()
    const plan = await planImport(bundle, { ...baseOptions, dir: tmpDir, target: 'claude' })

    const testMcp = plan.actions.find((a) => a.name === 'test-mcp')
    expect(testMcp).toBeDefined()
    expect(testMcp!.action).toBe('skip')
    expect(testMcp!.reason).toContain('--force')
  })

  it('genera overwrite para MCP server diferente con force', async () => {
    await writeFile(
      join(tmpDir, '.mcp.json'),
      JSON.stringify({
        mcpServers: {
          'test-mcp': {
            command: 'different-command',
            args: ['different-args'],
          },
        },
      }),
      'utf-8',
    )

    const bundle = createTestBundle()
    const plan = await planImport(bundle, { ...baseOptions, dir: tmpDir, target: 'claude', force: true })

    const testMcp = plan.actions.find((a) => a.name === 'test-mcp')
    expect(testMcp).toBeDefined()
    expect(testMcp!.action).toBe('overwrite')
  })

  it('instala skills como reglas para cursor', async () => {
    const bundle = createTestBundle()
    const plan = await planImport(bundle, { ...baseOptions, dir: tmpDir, target: 'cursor' })

    const skillAction = plan.actions.find((a) => a.category === 'skills')
    expect(skillAction).toBeDefined()
    // Cursor has rulesDir (.cursor/rules), so skill maps to rule
    expect(skillAction!.action).toBe('install')
    expect(skillAction!.targetPath.replace(/\\/g, '/')).toContain('.cursor/rules')
  })

  it('marca agents como unsupported para cursor', async () => {
    const bundle = createTestBundle()
    const plan = await planImport(bundle, { ...baseOptions, dir: tmpDir, target: 'cursor' })

    const agentAction = plan.actions.find((a) => a.category === 'agents')
    expect(agentAction).toBeDefined()
    expect(agentAction!.action).toBe('unsupported')
    expect(agentAction!.reason).toContain('no soporta agents')
  })

  it('detecta skill existente como skip', async () => {
    // Create existing skill
    const skillDir = join(tmpDir, '.claude/skills/deploy-skill')
    await mkdir(skillDir, { recursive: true })
    await writeFile(join(skillDir, 'SKILL.md'), 'existing skill', 'utf-8')

    const bundle = createTestBundle()
    const plan = await planImport(bundle, { ...baseOptions, dir: tmpDir, target: 'claude' })

    const skillAction = plan.actions.find((a) => a.category === 'skills')
    expect(skillAction).toBeDefined()
    expect(skillAction!.action).toBe('skip')
  })

  it('mapea context file a ruta correcta del target', async () => {
    const bundle = createTestBundle()
    const plan = await planImport(bundle, { ...baseOptions, dir: tmpDir, target: 'cursor' })

    const ctxAction = plan.actions.find((a) => a.category === 'context')
    expect(ctxAction).toBeDefined()
    expect(ctxAction!.action).toBe('install')
    expect(ctxAction!.targetPath).toContain('.cursorrules')
  })

  it('context file sin equivalente -> unsupported', async () => {
    const bundle = createTestBundle({
      contextFiles: [
        {
          path: 'custom-context.md',
          scope: 'project',
          tool: 'claude',
          content: '# Custom',
        },
      ],
    })

    const plan = await planImport(bundle, { ...baseOptions, dir: tmpDir, target: 'cursor' })

    const ctxAction = plan.actions.find((a) => a.category === 'context')
    expect(ctxAction).toBeDefined()
    expect(ctxAction!.action).toBe('unsupported')
  })

  it('lista pendingEnvVars correctamente', async () => {
    const bundle = createTestBundle()
    const plan = await planImport(bundle, { ...baseOptions, dir: tmpDir, target: 'claude' })

    expect(plan.pendingEnvVars).toContain('API_KEY')
  })

  it('respeta --only filtro', async () => {
    const bundle = createTestBundle()
    const plan = await planImport(bundle, {
      ...baseOptions,
      dir: tmpDir,
      target: 'claude',
      only: ['mcp'],
    })

    const categories = new Set(plan.actions.map((a) => a.category))
    expect(categories.has('mcp')).toBe(true)
    expect(categories.has('skills')).toBe(false)
    expect(categories.has('agents')).toBe(false)
    expect(categories.has('context')).toBe(false)
  })
})

describe('executeImport', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `aci-import-exec-${randomUUID()}`)
    await mkdir(tmpDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tmpDir, { recursive: true, force: true })
    } catch {
      // Cleanup best-effort
    }
  })

  const baseOptions: ImportOptions = {
    dir: '', // Set in each test
    force: false,
    confirm: false,
    secrets: 'none',
  }

  it('escribe MCP server nuevo en .mcp.json', async () => {
    const bundle = createTestBundle({
      mcpServers: [
        {
          name: 'new-server',
          scope: 'project',
          config: { transport: 'stdio', command: 'npx', args: ['new-server'] },
          envVarsRedacted: [],
          envVarsIncluded: [],
        },
      ],
      skills: [],
      agents: [],
      memories: [],
      contextFiles: [],
    })

    const options = { ...baseOptions, dir: tmpDir, target: 'claude' as const }
    const plan = await planImport(bundle, options)
    const result = await executeImport(plan, bundle, options)

    expect(result.installed.length).toBeGreaterThan(0)

    const mcpContent = JSON.parse(await readFile(join(tmpDir, '.mcp.json'), 'utf-8'))
    expect(mcpContent.mcpServers['new-server']).toBeDefined()
    expect(mcpContent.mcpServers['new-server'].command).toBe('npx')
  })

  it('merge MCP server en .mcp.json existente preservando otros', async () => {
    // Pre-create .mcp.json with existing server
    await writeFile(
      join(tmpDir, '.mcp.json'),
      JSON.stringify({
        mcpServers: {
          'existing-server': { command: 'npx', args: ['existing'] },
        },
      }),
      'utf-8',
    )

    const bundle = createTestBundle({
      mcpServers: [
        {
          name: 'new-server',
          scope: 'project',
          config: { transport: 'stdio', command: 'node', args: ['new.js'] },
          envVarsRedacted: [],
          envVarsIncluded: [],
        },
      ],
      skills: [],
      agents: [],
      memories: [],
      contextFiles: [],
    })

    const options = { ...baseOptions, dir: tmpDir, target: 'claude' as const }
    const plan = await planImport(bundle, options)
    await executeImport(plan, bundle, options)

    const mcpContent = JSON.parse(await readFile(join(tmpDir, '.mcp.json'), 'utf-8'))
    // Both servers should exist
    expect(mcpContent.mcpServers['existing-server']).toBeDefined()
    expect(mcpContent.mcpServers['new-server']).toBeDefined()
    expect(mcpContent.mcpServers['existing-server'].command).toBe('npx')
    expect(mcpContent.mcpServers['new-server'].command).toBe('node')
  })

  it('crea directorio y escribe SKILL.md', async () => {
    const bundle = createTestBundle({
      mcpServers: [],
      agents: [],
      memories: [],
      contextFiles: [],
    })

    const options = { ...baseOptions, dir: tmpDir, target: 'claude' as const }
    const plan = await planImport(bundle, options)
    await executeImport(plan, bundle, options)

    const skillContent = await readFile(
      join(tmpDir, '.claude/skills/deploy-skill/SKILL.md'),
      'utf-8',
    )
    expect(skillContent).toContain('Deploy Skill')
  })

  it('escribe agent .md', async () => {
    const bundle = createTestBundle({
      mcpServers: [],
      skills: [],
      memories: [],
      contextFiles: [],
    })

    const options = { ...baseOptions, dir: tmpDir, target: 'claude' as const }
    const plan = await planImport(bundle, options)
    await executeImport(plan, bundle, options)

    const agentContent = await readFile(
      join(tmpDir, '.claude/agents/review-agent.md'),
      'utf-8',
    )
    expect(agentContent).toContain('code review agent')
  })

  it('escribe context file', async () => {
    const bundle = createTestBundle({
      mcpServers: [],
      skills: [],
      agents: [],
      memories: [],
      contextFiles: [
        {
          path: 'CLAUDE.md',
          scope: 'project',
          tool: 'claude',
          content: '# Imported Project\nImported content.',
        },
      ],
    })

    const options = { ...baseOptions, dir: tmpDir, target: 'cursor' as const }
    const plan = await planImport(bundle, options)
    await executeImport(plan, bundle, options)

    const content = await readFile(join(tmpDir, '.cursorrules'), 'utf-8')
    expect(content).toContain('Imported content')
  })

  it('anade .aci/ al .gitignore', async () => {
    const bundle = createTestBundle({
      mcpServers: [],
      skills: [],
      agents: [],
      memories: [],
      contextFiles: [],
    })

    const options = { ...baseOptions, dir: tmpDir, target: 'claude' as const }
    const plan = await planImport(bundle, options)
    await executeImport(plan, bundle, options)

    const gitignore = await readFile(join(tmpDir, '.gitignore'), 'utf-8')
    expect(gitignore).toContain('.aci/')
  })
})
