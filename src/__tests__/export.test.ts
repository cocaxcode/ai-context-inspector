import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import {
  exportEcosystem,
  computeChecksum,
  verifyChecksum,
  generateReadme,
  ensureGitignore,
} from '../ecosystem/export.js'
import type { EcosystemBundle, BundleResources } from '../ecosystem/types.js'
import { fixture } from './helpers.js'

const EXPORT_FIXTURE = fixture('export-project')

describe('exportEcosystem', () => {
  afterEach(async () => {
    // Clean up .aci/ and .gitignore created in fixture by exportEcosystem
    try {
      await rm(join(EXPORT_FIXTURE, '.aci'), { recursive: true, force: true })
    } catch { /* ignore */ }
    try {
      await rm(join(EXPORT_FIXTURE, '.gitignore'), { force: true })
    } catch { /* ignore */ }
  })

  it('genera bundle con version 1', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    expect(bundle.version).toBe(1)
    expect(bundle.createdAt).toBeDefined()
    expect(bundle.sourceProject).toBeDefined()
    expect(bundle.resources).toBeDefined()
  })

  it('genera checksum SHA-256 valido', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    // SHA-256 produces 64 hex characters
    expect(bundle.checksum).toMatch(/^[a-f0-9]{64}$/)
  })

  it('verifyChecksum retorna true para bundle intacto', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    expect(verifyChecksum(bundle)).toBe(true)
  })

  it('verifyChecksum retorna false para bundle modificado', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    // Tamper with resources
    const tampered: EcosystemBundle = {
      ...bundle,
      resources: {
        ...bundle.resources,
        mcpServers: [],
      },
    }

    expect(verifyChecksum(tampered)).toBe(false)
  })

  it('incluye MCP servers del proyecto', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    const servers = bundle.resources.mcpServers
    expect(servers.length).toBeGreaterThanOrEqual(2)

    const testServer = servers.find((s) => s.name === 'test-server')
    expect(testServer).toBeDefined()
    expect(testServer!.config.command).toBe('npx')
    expect(testServer!.scope).toBe('project')

    const simpleServer = servers.find((s) => s.name === 'simple-server')
    expect(simpleServer).toBeDefined()
    expect(simpleServer!.config.command).toBe('node')
  })

  it('lee contenido completo de skills', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    const skills = bundle.resources.skills
    expect(skills.length).toBeGreaterThanOrEqual(1)

    const testSkill = skills.find((s) => s.name === 'test-skill')
    expect(testSkill).toBeDefined()
    expect(testSkill!.content).toContain('This is a test skill for export testing.')
    expect(testSkill!.dirName).toBe('test-skill')
    expect(testSkill!.description).toBe('A test skill')
  })

  it('lee contenido completo de agents', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    const agents = bundle.resources.agents
    expect(agents.length).toBeGreaterThanOrEqual(1)

    const testAgent = agents.find((a) => a.name === 'test-agent')
    expect(testAgent).toBeDefined()
    expect(testAgent!.content).toContain('You are a test agent.')
    expect(testAgent!.fileName).toBe('test-agent.md')
    expect(testAgent!.model).toBe('sonnet')
  })

  it('lee contenido de context files', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    const contextFiles = bundle.resources.contextFiles
    // Should find CLAUDE.md at minimum
    const claudeMd = contextFiles.find((cf) => cf.path === 'CLAUDE.md')
    expect(claudeMd).toBeDefined()
    expect(claudeMd!.content).toContain('# Test Project')
    expect(claudeMd!.tool).toBe('claude')
  })

  it('lee archivos de memorias recursivamente', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    // The fixture has openspec/specs/test.yaml
    const openspecMemory = bundle.resources.memories.find((m) => m.type === 'openspec')
    if (openspecMemory) {
      expect(openspecMemory.files.length).toBeGreaterThanOrEqual(1)
      const testYaml = openspecMemory.files.find((f) => f.relativePath.includes('test.yaml'))
      expect(testYaml).toBeDefined()
      expect(testYaml!.content).toContain('name: test-spec')
    }
  })

  it('secrets none: redacta todas las env vars', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    const testServer = bundle.resources.mcpServers.find((s) => s.name === 'test-server')
    expect(testServer).toBeDefined()
    expect(testServer!.config.env!.API_KEY).toBe('${API_KEY}')
    expect(testServer!.config.env!.NODE_ENV).toBe('${NODE_ENV}')
    expect(testServer!.envVarsRedacted).toContain('API_KEY')
    expect(testServer!.envVarsRedacted).toContain('NODE_ENV')
  })

  it('secrets all: incluye todas + warning', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'all',
    })

    const testServer = bundle.resources.mcpServers.find((s) => s.name === 'test-server')
    expect(testServer).toBeDefined()
    expect(testServer!.config.env!.API_KEY).toBe('secret123')
    expect(testServer!.config.env!.NODE_ENV).toBe('development')
    expect(testServer!.envVarsIncluded).toContain('API_KEY')

    // Should have warning about secrets
    expect(bundle.warnings.some((w) => w.includes('Secretos'))).toBe(true)
  })

  it('secrets custom: respeta decisiones por variable', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'custom',
      secretDecisions: { NODE_ENV: true },
    })

    const testServer = bundle.resources.mcpServers.find((s) => s.name === 'test-server')
    expect(testServer).toBeDefined()
    // API_KEY not in decisions → redacted by default
    expect(testServer!.config.env!.API_KEY).toBe('${API_KEY}')
    // NODE_ENV explicitly included
    expect(testServer!.config.env!.NODE_ENV).toBe('development')
  })

  it('respeta --only filtro de categorias', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
      only: ['mcp'],
    })

    expect(bundle.resources.mcpServers.length).toBeGreaterThan(0)
    expect(bundle.resources.skills).toHaveLength(0)
    expect(bundle.resources.agents).toHaveLength(0)
    expect(bundle.resources.contextFiles).toHaveLength(0)
  })

  it('genera README.md con resumen del bundle', async () => {
    const bundle = await exportEcosystem({
      dir: EXPORT_FIXTURE,
      includeUser: false,
      secrets: 'none',
    })

    const readme = generateReadme(bundle)
    expect(readme).toContain('# ACI Export Bundle')
    expect(readme).toContain('MCP Servers')
    expect(readme).toContain('Contenido')
    expect(readme).toContain(bundle.sourceProject)
  })
})

describe('ensureGitignore', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `aci-gitignore-${randomUUID()}`)
    await mkdir(tmpDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tmpDir, { recursive: true, force: true })
    } catch {
      // Cleanup best-effort
    }
  })

  it('crea .gitignore si no existe', async () => {
    const added = await ensureGitignore(tmpDir)
    expect(added).toBe(true)

    const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8')
    expect(content).toContain('.aci/')
  })

  it('anade .aci/ si no esta presente', async () => {
    await writeFile(join(tmpDir, '.gitignore'), 'node_modules/\ndist/\n', 'utf-8')

    const added = await ensureGitignore(tmpDir)
    expect(added).toBe(true)

    const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8')
    expect(content).toContain('.aci/')
    expect(content).toContain('node_modules/')
  })

  it('no duplica .aci/ si ya existe', async () => {
    await writeFile(join(tmpDir, '.gitignore'), 'node_modules/\n.aci/\n', 'utf-8')

    const added = await ensureGitignore(tmpDir)
    expect(added).toBe(false)

    const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8')
    // Count occurrences of .aci/
    const matches = content.match(/\.aci\//g)
    expect(matches).toHaveLength(1)
  })
})
