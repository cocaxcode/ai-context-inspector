import { parseArgs } from 'node:util'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { runAllScanners } from './scanner/index.js'
import { generateHtml } from './report/generator.js'
import type { ScanConfig } from './scanner/types.js'

export interface CliOptions {
  dir: string
  output: string
  json: boolean
  noIntrospect: boolean
  mcp: boolean
  includeUser: boolean
  timeout: number
}

export function parseCliArgs(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      dir: { type: 'string', short: 'd' },
      output: { type: 'string', short: 'o' },
      json: { type: 'boolean', default: false },
      'no-introspect': { type: 'boolean', default: false },
      mcp: { type: 'boolean', default: false },
      'include-user': { type: 'boolean', default: false },
      timeout: { type: 'string', default: '10000' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: false,
    allowPositionals: true,
  })

  if (values.help) {
    printHelp()
    process.exit(0)
  }

  return {
    dir: (values.dir as string) ?? process.cwd(),
    output: (values.output as string) ?? 'ai-context-report.html',
    json: (values.json as boolean) ?? false,
    noIntrospect: (values['no-introspect'] as boolean) ?? false,
    mcp: (values.mcp as boolean) ?? false,
    includeUser: (values['include-user'] as boolean) ?? false,
    timeout: parseInt((values.timeout as string) ?? '10000', 10),
  }
}

function printHelp(): void {
  console.error(`
  ai-context-inspector — Escanea el ecosistema AI de un proyecto

  Uso:
    npx @cocaxcode/ai-context-inspector [opciones]

  Opciones:
    -d, --dir <ruta>       Directorio a escanear (default: cwd)
    -o, --output <ruta>    Archivo HTML de salida (default: ai-context-report.html)
    --json                 Output JSON en stdout (no genera HTML)
    --no-introspect        No conectar a MCP servers
    --include-user         Incluir configuración del directorio de usuario
    --timeout <ms>         Timeout de introspección MCP (default: 10000)
    --mcp                  Arrancar como MCP server
    -h, --help             Mostrar ayuda
`)
}

export async function runCli(options: CliOptions): Promise<void> {
  // Validate directory exists
  const dir = resolve(options.dir)
  try {
    await access(dir)
  } catch {
    console.error(`Error: El directorio no existe: ${dir}`)
    process.exit(1)
  }

  const config: ScanConfig = {
    dir,
    includeUser: options.includeUser,
    introspect: !options.noIntrospect,
    timeout: options.timeout,
  }

  console.error(`Escaneando ${dir}...`)
  const result = await runAllScanners(config)

  if (options.json) {
    process.stdout.write(JSON.stringify(result, null, 2))
    return
  }

  // Generate HTML
  const html = generateHtml(result)
  const outputPath = resolve(options.output)

  // Create directories if needed
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, html, 'utf-8')

  console.error(`
Escaneo completado en ${result.scanDuration}ms
  MCP Servers: ${result.mcpServers.length}
  Tools: ${result.mcpServers.reduce((s, m) => s + (m.introspection?.tools.length ?? 0), 0)}
  Archivos: ${result.contextFiles.length}
  Skills: ${result.skills.length}
  Memorias: ${result.memories.length}
  Warnings: ${result.warnings.length}

Reporte: ${outputPath}`)
}
