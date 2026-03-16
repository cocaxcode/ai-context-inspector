import { describe, it, expect, vi } from 'vitest'
import { parseCliArgs, parseExportArgs, parseImportArgs, parseOnlyFlag } from '../cli.js'

describe('parseCliArgs', () => {
  it('parsea --dir correctamente', () => {
    const opts = parseCliArgs(['--dir', '/my/project'])
    expect(opts.dir).toBe('/my/project')
  })

  it('parsea --json flag', () => {
    const opts = parseCliArgs(['--json'])
    expect(opts.json).toBe(true)
  })

  it('parsea --no-introspect flag', () => {
    const opts = parseCliArgs(['--no-introspect'])
    expect(opts.noIntrospect).toBe(true)
  })

  it('parsea --mcp flag', () => {
    const opts = parseCliArgs(['--mcp'])
    expect(opts.mcp).toBe(true)
  })

  it('parsea --include-user flag', () => {
    const opts = parseCliArgs(['--include-user'])
    expect(opts.includeUser).toBe(true)
  })

  it('parsea --timeout', () => {
    const opts = parseCliArgs(['--timeout', '5000'])
    expect(opts.timeout).toBe(5000)
  })

  it('defaults correctos sin argumentos', () => {
    const opts = parseCliArgs([])
    expect(opts.dir).toBe(process.cwd())
    expect(opts.output).toBe('ai-context-report.html')
    expect(opts.json).toBe(false)
    expect(opts.noIntrospect).toBe(false)
    expect(opts.mcp).toBe(false)
    expect(opts.includeUser).toBe(false)
    expect(opts.timeout).toBe(10000)
  })

  it('parsea -d short flag', () => {
    const opts = parseCliArgs(['-d', '/short/path'])
    expect(opts.dir).toBe('/short/path')
  })

  it('parsea --output flag', () => {
    const opts = parseCliArgs(['--output', './reports/scan.html'])
    expect(opts.output).toBe('./reports/scan.html')
  })
})

describe('CLI subcommands', () => {
  it('detecta subcomando export via runCli routing', async () => {
    // Verify that export-specific args are parsed correctly
    const values = parseExportArgs(['--dir', '/my/project', '--only', 'mcp,skills', '--secrets', 'none'])
    expect(values.dir).toBe('/my/project')
    expect(values.only).toBe('mcp,skills')
    expect(values.secrets).toBe('none')
  })

  it('detecta subcomando import via runCli routing', async () => {
    const { values, positionals } = parseImportArgs([
      'bundle.json',
      '--target',
      'cursor',
      '--force',
      '--yes',
    ])
    expect(positionals).toContain('bundle.json')
    expect(values.target).toBe('cursor')
    expect(values.force).toBe(true)
    expect(values.yes).toBe(true)
  })

  it('sin subcomando parseCliArgs funciona normalmente', () => {
    const opts = parseCliArgs(['--dir', '/scan/path', '--json'])
    expect(opts.dir).toBe('/scan/path')
    expect(opts.json).toBe(true)
  })

  it('parsea --only mcp,skills correctamente', () => {
    const result = parseOnlyFlag('mcp,skills')
    expect(result).toEqual(['mcp', 'skills'])
  })

  it('parsea --only con espacios', () => {
    const result = parseOnlyFlag('mcp , skills , agents')
    expect(result).toEqual(['mcp', 'skills', 'agents'])
  })

  it('parseOnlyFlag retorna undefined si no hay flag', () => {
    const result = parseOnlyFlag(undefined)
    expect(result).toBeUndefined()
  })

  it('export --secrets none se parsea correctamente', () => {
    const values = parseExportArgs(['--secrets', 'none'])
    expect(values.secrets).toBe('none')
  })

  it('export --secrets all se parsea correctamente', () => {
    const values = parseExportArgs(['--secrets', 'all'])
    expect(values.secrets).toBe('all')
  })

  it('import --yes se parsea correctamente', () => {
    const { values } = parseImportArgs(['--yes'])
    expect(values.yes).toBe(true)
  })

  it('import --scope project se parsea correctamente', () => {
    const { values } = parseImportArgs(['--scope', 'project'])
    expect(values.scope).toBe('project')
  })

  it('import --target claude se parsea correctamente', () => {
    const { values } = parseImportArgs(['--target', 'claude'])
    expect(values.target).toBe('claude')
  })

  it('import sin bundle file usa auto-deteccion', () => {
    const { positionals } = parseImportArgs(['--target', 'cursor'])
    expect(positionals).toHaveLength(0)
  })

  it('import con bundle file lo captura como positional', () => {
    const { positionals } = parseImportArgs(['/path/to/bundle.json', '--target', 'cursor'])
    expect(positionals[0]).toBe('/path/to/bundle.json')
  })

  it('export --include-user se parsea correctamente', () => {
    const values = parseExportArgs(['--include-user'])
    expect(values['include-user']).toBe(true)
  })

  it('export -d short flag funciona', () => {
    const values = parseExportArgs(['-d', '/export/dir'])
    expect(values.dir).toBe('/export/dir')
  })

  it('import --force se parsea correctamente', () => {
    const { values } = parseImportArgs(['--force'])
    expect(values.force).toBe(true)
  })

  it('import --only mcp,context se parsea como flag', () => {
    const { values } = parseImportArgs(['--only', 'mcp,context'])
    expect(values.only).toBe('mcp,context')
    const parsed = parseOnlyFlag(values.only as string)
    expect(parsed).toEqual(['mcp', 'context'])
  })
})
