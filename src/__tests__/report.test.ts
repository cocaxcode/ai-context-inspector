import { describe, it, expect } from 'vitest'
import { generateHtml } from '../report/generator.js'
import type { ScanResult } from '../scanner/types.js'

function mockScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    project: {
      name: 'test-project',
      path: '/test',
      scannedAt: new Date().toISOString(),
    },
    contextFiles: [],
    mcpServers: [],
    skills: [],
    agents: [],
    memories: [],
    warnings: [],
    scanDuration: 42,
    ...overrides,
  }
}

describe('generateHtml', () => {
  it('genera HTML válido con DOCTYPE', () => {
    const html = generateHtml(mockScanResult())
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="es">')
    expect(html).toContain('</html>')
  })

  it('contiene CSS y JS inline, no external links', () => {
    const html = generateHtml(mockScanResult())
    expect(html).toContain('<style>')
    expect(html).toContain('<script>')
    expect(html).not.toContain('href="http')
    expect(html).not.toContain('src="http')
  })

  it('muestra empty state cuando no hay datos', () => {
    const html = generateHtml(mockScanResult())
    expect(html).toContain('No se encontró configuración AI')
  })

  it('muestra badges con conteos correctos', () => {
    const html = generateHtml(
      mockScanResult({
        contextFiles: [
          {
            path: 'CLAUDE.md',
            absolutePath: '/test/CLAUDE.md',
            tool: 'claude',
            alsoUsedBy: [],
            type: 'file',
            scope: 'project',
            size: 100,
            preview: 'test',
          },
        ],
        mcpServers: [
          {
            name: 'test',
            source: 'project',
            config: { transport: 'stdio', command: 'echo', hasEnvVars: false },
            introspection: {
              status: 'ok',
              tools: [{ name: 'tool1' }, { name: 'tool2' }],
              resources: [],
              prompts: [],
            },
          },
        ],
      }),
    )

    expect(html).toContain('1 MCPs')
    expect(html).toContain('2 tools')
    expect(html).toContain('1 archivos')
  })

  it('muestra sección MCP con tools', () => {
    const html = generateHtml(
      mockScanResult({
        mcpServers: [
          {
            name: 'my-server',
            source: 'project',
            config: {
              transport: 'stdio',
              command: 'npx',
              args: ['server'],
              hasEnvVars: false,
            },
            introspection: {
              status: 'ok',
              serverInfo: { name: 'my-server', version: '1.0.0' },
              tools: [
                { name: 'my_tool', description: 'Does something' },
              ],
              resources: [],
              prompts: [],
            },
          },
        ],
      }),
    )

    expect(html).toContain('my-server')
    expect(html).toContain('my_tool')
    expect(html).toContain('Does something')
  })

  it('agrupa archivos por herramienta', () => {
    const html = generateHtml(
      mockScanResult({
        contextFiles: [
          {
            path: 'CLAUDE.md',
            absolutePath: '/t/CLAUDE.md',
            tool: 'claude',
            alsoUsedBy: [],
            type: 'file',
            scope: 'project',
            size: 50,
            preview: null,
          },
          {
            path: '.cursorrules',
            absolutePath: '/t/.cursorrules',
            tool: 'cursor',
            alsoUsedBy: [],
            type: 'file',
            scope: 'project',
            size: 30,
            preview: null,
          },
        ],
      }),
    )

    expect(html).toContain('tool-badge--claude')
    expect(html).toContain('tool-badge--cursor')
  })

  it('CSS contiene prefers-color-scheme dark', () => {
    const html = generateHtml(mockScanResult())
    expect(html).toContain('prefers-color-scheme: light')
  })

  it('contiene data-searchable para búsqueda', () => {
    const html = generateHtml(
      mockScanResult({
        mcpServers: [
          {
            name: 'searchable-server',
            source: 'project',
            config: { transport: 'stdio', command: 'echo', hasEnvVars: false },
            introspection: {
              status: 'ok',
              tools: [{ name: 'find_me' }],
              resources: [],
              prompts: [],
            },
          },
        ],
      }),
    )

    expect(html).toContain('data-searchable')
    expect(html).toContain('find_me')
  })
})
