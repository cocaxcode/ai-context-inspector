import { parseArgs } from 'node:util'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { runAllScanners } from './scanner/index.js'
import { generateHtml } from './report/generator.js'
import type { ScanConfig } from './scanner/types.js'
import {
  exportEcosystem,
  loadBundle,
  planImport,
  executeImport,
  detectTargetTools,
  detectEnvVars,
  createPromptInterface,
  promptCategories,
  promptExportSecrets,
  promptTargetTool,
  promptImportSecrets,
  promptConfirmPlan,
  promptAutoImport,
  printImportResult,
  printExportResult,
  ACI_DIR,
  ACI_BUNDLE,
} from './ecosystem/index.js'
import type {
  ResourceCategory,
  SecretsMode,
  ImportTarget,
  ImportSecretsMode,
  ExportOptions,
  ImportOptions,
} from './ecosystem/types.js'

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

/**
 * Parsea flags especificos del subcomando export.
 */
export function parseExportArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      dir: { type: 'string', short: 'd' },
      output: { type: 'string', short: 'o' },
      'include-user': { type: 'boolean', default: false },
      only: { type: 'string' },
      secrets: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: false,
    allowPositionals: true,
  })

  return values
}

/**
 * Parsea flags especificos del subcomando import.
 */
export function parseImportArgs(argv: string[]) {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      dir: { type: 'string', short: 'd' },
      target: { type: 'string' },
      scope: { type: 'string' },
      force: { type: 'boolean', default: false },
      yes: { type: 'boolean', default: false },
      only: { type: 'string' },
      secrets: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: false,
    allowPositionals: true,
  })

  return { values, positionals }
}

export function printHelp(): void {
  console.error(`
  ai-context-inspector — Escanea el ecosistema AI de un proyecto

  Uso:
    npx @cocaxcode/ai-context-inspector [opciones]
    npx @cocaxcode/ai-context-inspector export [opciones]
    npx @cocaxcode/ai-context-inspector import [archivo] [opciones]

  Subcomandos:
    export              Exportar ecosistema AI a bundle portable (.aci/)
    import [archivo]    Importar bundle a otra herramienta AI

  Opciones generales:
    -d, --dir <ruta>       Directorio a escanear (default: cwd)
    -o, --output <ruta>    Archivo HTML de salida (default: ai-context-report.html)
    --json                 Output JSON en stdout (no genera HTML)
    --no-introspect        No conectar a MCP servers
    --include-user         Incluir configuración del directorio de usuario
    --timeout <ms>         Timeout de introspección MCP (default: 10000)
    --mcp                  Arrancar como MCP server
    -h, --help             Mostrar ayuda

  Opciones de export:
    -d, --dir <ruta>       Directorio a exportar (default: cwd)
    -o, --output <ruta>    Directorio de salida (default: .aci/)
    --include-user         Incluir configuración del directorio de usuario
    --only <categorías>    Solo exportar: mcp,skills,agents,memories,context
    --secrets <modo>       Modo de secretos: none | all (default: interactivo)

  Opciones de import:
    -d, --dir <ruta>       Directorio destino (default: cwd)
    --target <tool>        Herramienta destino: claude|cursor|windsurf|copilot|gemini|codex|opencode
    --scope <scope>        Scope: project | user
    --force                Sobreescribir recursos existentes
    --yes                  Saltar confirmación
    --only <categorías>    Solo importar: mcp,skills,agents,memories,context
    --secrets <modo>       Modo de secretos: none | all (default: interactivo)
`)
}

function printExportHelp(): void {
  console.error(`
  ai-context-inspector export — Exportar ecosistema AI a bundle portable

  Uso:
    npx @cocaxcode/ai-context-inspector export [opciones]

  Opciones:
    -d, --dir <ruta>       Directorio a exportar (default: cwd)
    -o, --output <ruta>    Directorio de salida (default: .aci/)
    --include-user         Incluir configuración del directorio de usuario
    --only <categorías>    Solo exportar: mcp,skills,agents,memories,context
    --secrets <modo>       Modo de secretos: none | all (default: interactivo)
    -h, --help             Mostrar ayuda
`)
}

function printImportHelp(): void {
  console.error(`
  ai-context-inspector import — Importar bundle a otra herramienta AI

  Uso:
    npx @cocaxcode/ai-context-inspector import [archivo] [opciones]

  Argumentos:
    archivo                Ruta al bundle (default: auto-detecta .aci/bundle.json)

  Opciones:
    -d, --dir <ruta>       Directorio destino (default: cwd)
    --target <tool>        Herramienta destino: claude|cursor|windsurf|copilot|gemini|codex|opencode
    --scope <scope>        Scope: project | user
    --force                Sobreescribir recursos existentes
    --yes                  Saltar confirmación
    --only <categorías>    Solo importar: mcp,skills,agents,memories,context
    --secrets <modo>       Modo de secretos: none | all (default: interactivo)
    -h, --help             Mostrar ayuda
`)
}

/**
 * Parsea una lista de categorias separadas por coma.
 */
export function parseOnlyFlag(onlyStr: string | undefined): ResourceCategory[] | undefined {
  if (!onlyStr) return undefined
  return onlyStr.split(',').map((s) => s.trim()) as ResourceCategory[]
}

/**
 * Runs the export subcommand.
 * If flags are provided, uses them. Missing options trigger interactive prompts.
 */
export async function runExport(argv: string[]): Promise<void> {
  const values = parseExportArgs(argv)

  if (values.help) {
    printExportHelp()
    process.exit(0)
  }

  const dir = resolve((values.dir as string) ?? process.cwd())
  try {
    await access(dir)
  } catch {
    console.error(`Error: El directorio no existe: ${dir}`)
    process.exit(1)
  }

  const includeUser = (values['include-user'] as boolean) ?? false
  const onlyFlag = parseOnlyFlag(values.only as string | undefined)
  const secretsFlag = values.secrets as string | undefined

  // Run scanner to discover resources
  console.error(`Escaneando ${dir}...`)
  const scan = await runAllScanners({
    dir,
    includeUser,
    introspect: false,
    timeout: 5000,
  })

  // Count resources per category
  const available: { category: ResourceCategory; count: number }[] = []
  if (scan.mcpServers.length > 0) available.push({ category: 'mcp', count: scan.mcpServers.length })
  if (scan.skills.length > 0) available.push({ category: 'skills', count: scan.skills.length })
  if (scan.agents.length > 0) available.push({ category: 'agents', count: scan.agents.length })
  if (scan.memories.length > 0) available.push({ category: 'memories', count: scan.memories.length })
  if (scan.contextFiles.length > 0) available.push({ category: 'context', count: scan.contextFiles.length })

  if (available.length === 0) {
    console.error('No se encontraron recursos AI para exportar.')
    return
  }

  // Resolve categories
  let only: ResourceCategory[] | undefined = onlyFlag
  if (!only) {
    const rl = createPromptInterface()
    try {
      only = await promptCategories(rl, available, 'exportar')
    } finally {
      rl.close()
    }
  }

  // Resolve secrets
  let secretsMode: SecretsMode
  let secretDecisions: Record<string, boolean> | undefined

  if (secretsFlag === 'none' || secretsFlag === 'all') {
    secretsMode = secretsFlag
  } else {
    // Detect env vars for prompting
    const detectedVars = detectEnvVars(scan.mcpServers)
    if (detectedVars.length === 0) {
      secretsMode = 'none'
    } else {
      const rl = createPromptInterface()
      try {
        const result = await promptExportSecrets(rl, detectedVars)
        secretsMode = result.mode
        secretDecisions = result.decisions
      } finally {
        rl.close()
      }
    }
  }

  // Export
  const exportOptions: ExportOptions = {
    dir,
    includeUser,
    only,
    secrets: secretsMode,
    secretDecisions,
  }

  const bundle = await exportEcosystem(exportOptions)

  // Collect redacted/included vars for print
  const allRedacted: string[] = []
  const allIncluded: string[] = []
  for (const server of bundle.resources.mcpServers) {
    allRedacted.push(...server.envVarsRedacted)
    allIncluded.push(...server.envVarsIncluded)
  }

  // Check if gitignore was added (re-check since exportEcosystem already does it)
  // We just report what the bundle contains
  printExportResult(bundle, allRedacted, allIncluded, true)
}

/**
 * Runs the import subcommand.
 * If flags are provided, uses them. Missing options trigger interactive prompts.
 */
export async function runImport(argv: string[]): Promise<void> {
  const { values, positionals } = parseImportArgs(argv)

  if (values.help) {
    printImportHelp()
    process.exit(0)
  }

  const dir = resolve((values.dir as string) ?? process.cwd())
  const bundleFile = positionals[0] ?? undefined
  const targetFlag = values.target as string | undefined
  const scopeFlag = values.scope as string | undefined
  const forceFlag = (values.force as boolean) ?? false
  const yesFlag = (values.yes as boolean) ?? false
  const onlyFlag = parseOnlyFlag(values.only as string | undefined)
  const secretsFlag = values.secrets as string | undefined

  // Load bundle (auto-detect if no path)
  console.error('Cargando bundle...')
  const bundle = await loadBundle(bundleFile, dir)
  console.error(`Bundle cargado: ${bundle.sourceProject} (${bundle.createdAt})`)

  // Count resources per category
  const available: { category: ResourceCategory; count: number }[] = []
  const r = bundle.resources
  if (r.mcpServers.length > 0) available.push({ category: 'mcp', count: r.mcpServers.length })
  if (r.skills.length > 0) available.push({ category: 'skills', count: r.skills.length })
  if (r.agents.length > 0) available.push({ category: 'agents', count: r.agents.length })
  if (r.memories.length > 0) available.push({ category: 'memories', count: r.memories.length })
  if (r.contextFiles.length > 0) available.push({ category: 'context', count: r.contextFiles.length })

  if (available.length === 0) {
    console.error('El bundle no contiene recursos para importar.')
    return
  }

  // Resolve categories
  let only: ResourceCategory[] | undefined = onlyFlag
  if (!only) {
    const rl = createPromptInterface()
    try {
      only = await promptCategories(rl, available, 'importar')
    } finally {
      rl.close()
    }
  }

  // Resolve target
  let target: ImportTarget | undefined = targetFlag as ImportTarget | undefined
  if (!target) {
    const detected = await detectTargetTools(dir)
    if (detected.length === 1) {
      target = detected[0]
      console.error(`Herramienta detectada: ${target}`)
    } else {
      const rl = createPromptInterface()
      try {
        target = await promptTargetTool(rl, detected)
      } finally {
        rl.close()
      }
    }
  }

  // Resolve secrets
  let secretValues: Record<string, string | null> | undefined
  if (secretsFlag !== 'none' && secretsFlag !== 'all') {
    // Collect env var info from bundle
    const envVarsIncluded: string[] = []
    const envVarsRedacted: string[] = []
    const envValues: Record<string, string> = {}

    for (const server of r.mcpServers) {
      envVarsIncluded.push(...server.envVarsIncluded)
      envVarsRedacted.push(...server.envVarsRedacted)
      if (server.config.env) {
        for (const [k, v] of Object.entries(server.config.env)) {
          if (server.envVarsIncluded.includes(k)) {
            envValues[k] = v
          }
        }
      }
    }

    if (envVarsIncluded.length > 0 || envVarsRedacted.length > 0) {
      const rl = createPromptInterface()
      try {
        const result = await promptImportSecrets(rl, { envVarsIncluded, envVarsRedacted, envValues })
        if (result.values) {
          secretValues = result.values
        }
      } finally {
        rl.close()
      }
    }
  } else if (secretsFlag === 'none') {
    // Leave secrets as-is (redacted stay redacted)
    secretValues = undefined
  }
  // secretsFlag === 'all': use bundle values as-is (no secretValues override)

  // Build import options
  const importOptions: ImportOptions = {
    file: bundleFile,
    dir,
    target,
    scope: scopeFlag as 'project' | 'user' | undefined,
    force: forceFlag,
    confirm: yesFlag,
    only,
    secrets: (secretsFlag as ImportSecretsMode) ?? 'none',
    secretValues,
  }

  // Generate plan (dry-run)
  const plan = await planImport(bundle, importOptions)

  // Confirm unless --yes
  if (!yesFlag) {
    const rl = createPromptInterface()
    try {
      const confirmed = await promptConfirmPlan(rl, plan)
      if (!confirmed) {
        console.error('Importación cancelada.')
        return
      }
    } finally {
      rl.close()
    }
  }

  // Execute import
  const result = await executeImport(plan, bundle, importOptions)
  printImportResult(result)
}

export async function runCli(argv: string[]): Promise<void> {
  // Check for subcommand before parsing flags
  const subcommand = argv[0]

  if (subcommand === 'export') {
    return runExport(argv.slice(1))
  }
  if (subcommand === 'import') {
    return runImport(argv.slice(1))
  }

  // Existing scan/report behavior
  const options = parseCliArgs(argv)

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

  // Auto-detect .aci/ bundle and prompt to import
  const aciPath = join(dir, ACI_DIR, ACI_BUNDLE)
  try {
    await access(aciPath)
    // Bundle found! Prompt user
    const rl = createPromptInterface()
    try {
      const shouldImport = await promptAutoImport(rl)
      if (shouldImport) {
        await runImport([])
      }
    } finally {
      rl.close()
    }
  } catch {
    // No bundle, continue normally
  }
}
