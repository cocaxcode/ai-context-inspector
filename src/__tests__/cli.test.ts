import { describe, it, expect } from 'vitest'
import { parseCliArgs } from '../cli.js'

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
