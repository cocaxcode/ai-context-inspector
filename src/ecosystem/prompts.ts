// ── Prompts interactivos para export/import del ecosistema ──

import * as readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import type {
  ResourceCategory,
  SecretsMode,
  ImportTarget,
  ImportPlan,
  ImportResult,
  DetectedEnvVar,
} from './types.js'
import { isSensitiveVar } from './secrets.js'

// ── Labels ──

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  mcp: 'MCP Servers',
  skills: 'Skills',
  agents: 'Agents',
  memories: 'Memorias',
  context: 'Context Files',
}

const ALL_TARGETS: ImportTarget[] = [
  'claude',
  'cursor',
  'windsurf',
  'copilot',
  'gemini',
  'codex',
  'opencode',
]

// ── Helpers ──

/**
 * Crea una interfaz readline para prompts interactivos.
 */
export function createPromptInterface(): readline.Interface {
  return readline.createInterface({ input: stdin, output: stdout })
}

/**
 * Mascara un valor sensible: muestra primero 6 + ultimos 4 chars.
 * Si el valor es muy corto, muestra solo asteriscos.
 */
function maskValue(value: string): string {
  if (value.length <= 10) return '****'
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

/**
 * Parsea una respuesta s/n. Acepta s/S/si/SI/y/Y para true, n/N/no/NO para false.
 * Retorna undefined si la entrada no es valida.
 */
function parseYesNo(input: string): boolean | undefined {
  const trimmed = input.trim().toLowerCase()
  if (['s', 'si', 'sí', 'y', 'yes'].includes(trimmed)) return true
  if (['n', 'no'].includes(trimmed)) return false
  if (trimmed === '') return undefined // para usar default
  return undefined
}

/**
 * Pregunta repetidamente hasta obtener un numero valido en rango.
 */
async function askNumber(
  rl: readline.Interface,
  prompt: string,
  min: number,
  max: number,
): Promise<number> {
  while (true) {
    const answer = await rl.question(prompt)
    const num = parseInt(answer.trim(), 10)
    if (!isNaN(num) && num >= min && num <= max) return num
    console.error(`  Entrada inválida. Ingresa un número entre ${min} y ${max}.`)
  }
}

/**
 * Parsea una lista de numeros separados por coma.
 * Retorna null si hay numeros fuera de rango o entrada invalida.
 */
function parseNumberList(
  input: string,
  min: number,
  max: number,
): number[] | null {
  const trimmed = input.trim()
  if (trimmed === '') return [] // Enter = vacio (todas)
  const parts = trimmed.split(',').map((s) => s.trim())
  const nums: number[] = []
  for (const part of parts) {
    const num = parseInt(part, 10)
    if (isNaN(num) || num < min || num > max) return null
    nums.push(num)
  }
  return nums
}

// ── Export prompts ──

/**
 * Pregunta qué categorias exportar. Muestra checklist con conteo.
 * Retorna las categorias seleccionadas (Enter = todas).
 */
export async function promptCategories(
  rl: readline.Interface,
  available: { category: ResourceCategory; count: number }[],
  verb: 'exportar' | 'importar',
): Promise<ResourceCategory[]> {
  console.error(`\nCategorías disponibles para ${verb}:`)
  for (let i = 0; i < available.length; i++) {
    const { category, count } = available[i]
    console.error(`  [${i + 1}] ${CATEGORY_LABELS[category]} (${count})`)
  }

  while (true) {
    const answer = await rl.question(
      '\nIngresa números separados por coma, o Enter para todos: ',
    )
    const nums = parseNumberList(answer, 1, available.length)
    if (nums === null) {
      console.error('  Entrada inválida. Usa números separados por coma.')
      continue
    }
    if (nums.length === 0) {
      // Enter = todas
      return available.map((a) => a.category)
    }
    return nums.map((n) => available[n - 1].category)
  }
}

/**
 * Pregunta como manejar los secretos al exportar.
 */
export async function promptExportSecrets(
  rl: readline.Interface,
  detectedVars: DetectedEnvVar[],
): Promise<{ mode: SecretsMode; decisions?: Record<string, boolean> }> {
  if (detectedVars.length === 0) {
    return { mode: 'none' }
  }

  // Contar servidores unicos
  const serverNames = new Set(detectedVars.map((v) => v.serverName))
  console.error(
    `\nSe detectaron ${detectedVars.length} variables de entorno en ${serverNames.size} MCP server${serverNames.size > 1 ? 's' : ''}:\n`,
  )

  // Calcular ancho maximo para alinear columnas
  const maxVarLen = Math.max(...detectedVars.map((v) => v.varName.length))
  const maxServerLen = Math.max(...detectedVars.map((v) => v.serverName.length))

  for (const v of detectedVars) {
    const varPad = v.varName.padEnd(maxVarLen)
    const serverPad = v.serverName.padEnd(maxServerLen)
    const label = v.isSensitive ? '🔐 sensible' : '   no sensible'
    console.error(`  ${varPad}  (${serverPad})  ${label}`)
  }

  console.error('\n¿Cómo manejar los secretos?')
  console.error('  [1] Redactar todos (reemplazar con ${VAR_NAME})')
  console.error(
    '  [2] Incluir todos (⚠️ valores reales en texto plano)',
  )
  console.error('  [3] Decidir uno por uno')

  const option = await askNumber(rl, '\nOpción: ', 1, 3)

  if (option === 1) return { mode: 'none' }
  if (option === 2) return { mode: 'all' }

  // Opcion 3: custom
  const decisions = await promptSecretDecisionsOneByOne(rl, detectedVars)
  return { mode: 'custom', decisions }
}

/**
 * Para modo custom: pregunta por cada secreto individualmente.
 * Sensibles default=N, no sensibles default=S.
 */
async function promptSecretDecisionsOneByOne(
  rl: readline.Interface,
  detectedVars: DetectedEnvVar[],
): Promise<Record<string, boolean>> {
  console.error('\nDecide por cada variable (S=incluir, N=redactar):\n')

  const decisions: Record<string, boolean> = {}

  for (const v of detectedVars) {
    const defaultInclude = !v.isSensitive
    const defaultLabel = defaultInclude ? 'S' : 'N'
    const sensitiveTag = v.isSensitive ? ' 🔐' : ''

    while (true) {
      const answer = await rl.question(
        `  ${v.varName} (${v.serverName})${sensitiveTag} [${defaultLabel}]: `,
      )
      const trimmed = answer.trim()

      if (trimmed === '') {
        // Usar default
        decisions[v.varName] = defaultInclude
        break
      }

      const parsed = parseYesNo(trimmed)
      if (parsed !== undefined) {
        decisions[v.varName] = parsed
        break
      }
      console.error('    Entrada inválida. Usa S (incluir) o N (redactar).')
    }
  }

  return decisions
}

// ── Import prompts ──

/**
 * Pregunta que herramienta AI usar como destino.
 */
export async function promptTargetTool(
  rl: readline.Interface,
  detected: ImportTarget[],
): Promise<ImportTarget> {
  if (detected.length === 1) {
    return detected[0]
  }

  if (detected.length > 1) {
    console.error('\nSe detectaron múltiples herramientas AI:')
    for (let i = 0; i < detected.length; i++) {
      console.error(`  [${i + 1}] ${detected[i]}`)
    }
    const option = await askNumber(
      rl,
      '¿Cuál usar como destino? ',
      1,
      detected.length,
    )
    return detected[option - 1]
  }

  // Ninguna detectada: mostrar todas
  console.error('\nNo se detectó ninguna herramienta AI configurada.')
  console.error('¿Cuál configurar?')
  for (let i = 0; i < ALL_TARGETS.length; i++) {
    console.error(`  [${i + 1}] ${ALL_TARGETS[i]}`)
  }
  const option = await askNumber(rl, 'Opción: ', 1, ALL_TARGETS.length)
  return ALL_TARGETS[option - 1]
}

/**
 * Pregunta como manejar los secretos al importar.
 */
export async function promptImportSecrets(
  rl: readline.Interface,
  bundle: {
    envVarsIncluded: string[]
    envVarsRedacted: string[]
    envValues: Record<string, string>
  },
): Promise<{
  mode: 'none' | 'all' | 'custom'
  values?: Record<string, string | null>
}> {
  const hasReal = bundle.envVarsIncluded.length > 0
  const hasRedacted = bundle.envVarsRedacted.length > 0

  if (!hasReal && !hasRedacted) {
    return { mode: 'none' }
  }

  if (hasReal) {
    // Case 1: bundle tiene valores reales
    console.error(
      `\nEl bundle contiene valores reales para ${bundle.envVarsIncluded.length} variable${bundle.envVarsIncluded.length > 1 ? 's' : ''}:`,
    )
    console.error(`  ${bundle.envVarsIncluded.join(', ')}`)

    if (hasRedacted) {
      console.error(
        `Y ${bundle.envVarsRedacted.length} variable${bundle.envVarsRedacted.length > 1 ? 's' : ''} redactada${bundle.envVarsRedacted.length > 1 ? 's' : ''}:`,
      )
      console.error(`  ${bundle.envVarsRedacted.join(', ')}`)
    }

    console.error('\n¿Cómo manejar los secretos?')
    console.error('  [1] Redactar todos (dejar como ${VAR_NAME})')
    console.error('  [2] Usar valores del bundle')
    console.error('  [3] Decidir uno por uno')

    const option = await askNumber(rl, '\nOpción: ', 1, 3)

    if (option === 1) return { mode: 'none' }
    if (option === 2) {
      // Usar valores reales, redactados se quedan como estan
      const values: Record<string, string | null> = {}
      for (const v of bundle.envVarsIncluded) {
        values[v] = bundle.envValues[v] ?? null
      }
      for (const v of bundle.envVarsRedacted) {
        values[v] = null
      }
      return { mode: 'all', values }
    }

    // Opcion 3: decidir uno por uno
    const values: Record<string, string | null> = {}

    for (const varName of bundle.envVarsIncluded) {
      const val = bundle.envValues[varName] ?? ''
      const sensitive = isSensitiveVar(varName)
      const displayVal = sensitive ? maskValue(val) : val
      const sensitiveTag = sensitive ? ' 🔐' : ''

      console.error(`\n  ${varName} = "${displayVal}"${sensitiveTag}`)
      console.error('    [1] Usar valor del bundle')
      console.error(`    [2] No importar (dejar \${${varName}})`)
      console.error('    [3] Introducir nuevo valor')

      const opt = await askNumber(rl, '  Opción [1]: ', 1, 3)

      if (opt === 1) {
        values[varName] = val
      } else if (opt === 2) {
        values[varName] = null
      } else {
        const newVal = await rl.question(`  ${varName}: `)
        values[varName] = newVal
      }
    }

    for (const varName of bundle.envVarsRedacted) {
      const newVal = await rl.question(`  ${varName}: `)
      values[varName] = newVal.trim() === '' ? null : newVal
    }

    return { mode: 'custom', values }
  }

  // Case 2: todo redactado
  console.error(
    `\nEl bundle contiene ${bundle.envVarsRedacted.length} variable${bundle.envVarsRedacted.length > 1 ? 's' : ''} redactada${bundle.envVarsRedacted.length > 1 ? 's' : ''}:`,
  )
  console.error(`  ${bundle.envVarsRedacted.join(', ')}`)

  console.error('\n  [1] Dejar como ${VAR_NAME} (configurar después)')
  console.error('  [2] Introducir valores ahora')

  const option = await askNumber(rl, '\nOpción: ', 1, 2)

  if (option === 1) return { mode: 'none' }

  // Introducir valores
  const values: Record<string, string | null> = {}
  console.error('')
  for (const varName of bundle.envVarsRedacted) {
    const newVal = await rl.question(`  ${varName}: `)
    values[varName] = newVal.trim() === '' ? null : newVal
  }

  return { mode: 'custom', values }
}

/**
 * Muestra el plan de importacion y pide confirmacion.
 */
export async function promptConfirmPlan(
  rl: readline.Interface,
  plan: ImportPlan,
): Promise<boolean> {
  console.error(`\nPlan de importación (${plan.target}):\n`)

  for (const action of plan.actions) {
    const categoryLabel =
      CATEGORY_LABELS[action.category] ?? action.category
    const shortCat =
      action.category === 'mcp'
        ? 'MCP'
        : action.category === 'context'
          ? 'Context'
          : categoryLabel.replace(/s$/, '')

    if (action.action === 'install') {
      console.error(
        `  ✅ Instalar    ${shortCat}: ${action.name} → ${action.targetPath}`,
      )
    } else if (action.action === 'skip') {
      const reason = action.reason ? ` (${action.reason})` : ''
      console.error(
        `  ⏭️  Omitir     ${shortCat}: ${action.name}${reason}`,
      )
    } else if (action.action === 'overwrite') {
      console.error(
        `  ⚠️  Sobrescribir ${shortCat}: ${action.name} → ${action.targetPath}`,
      )
    } else if (action.action === 'unsupported') {
      const reason = action.reason ? ` (${action.reason})` : ''
      console.error(
        `  ❌ No soportado  ${shortCat}: ${action.name}${reason}`,
      )
    }
  }

  console.error(
    `\n  Resumen: ${plan.summary.install} instalar, ${plan.summary.skip} omitir, ${plan.summary.unsupported} no soportado`,
  )

  if (plan.pendingEnvVars.length > 0) {
    console.error(
      `  ⚠️ ${plan.pendingEnvVars.length} env vars pendientes: ${plan.pendingEnvVars.join(', ')}`,
    )
  }

  while (true) {
    const answer = await rl.question('\n¿Ejecutar? [s/N]: ')
    const trimmed = answer.trim()

    if (trimmed === '') return false // Default N
    const parsed = parseYesNo(trimmed)
    if (parsed !== undefined) return parsed
    console.error('  Entrada inválida. Usa s (sí) o n (no).')
  }
}

/**
 * Muestra el resumen post-importacion.
 */
export function printImportResult(result: ImportResult): void {
  console.error('\nImportación completada:')
  console.error(`  ✅ ${result.installed.length} instalados`)
  console.error(`  ⏭️  ${result.skipped.length} omitidos`)
  console.error(`  ❌ ${result.unsupported.length} no soportados`)

  if (result.pendingEnvVars.length > 0) {
    console.error('\n  Variables de entorno pendientes de configuración:')
    for (const varName of result.pendingEnvVars) {
      console.error(`    ${varName} → configurar manualmente`)
    }
  }
}

/**
 * Muestra resumen post-exportacion.
 */
export function printExportResult(
  bundle: { resources: any; warnings: string[] },
  redactedVars: string[],
  includedVars: string[],
  gitignoreAdded: boolean,
): void {
  const res = bundle.resources

  console.error('\nBundle exportado: .aci/bundle.json')

  if (res.mcpServers?.length > 0)
    console.error(`  MCP Servers: ${res.mcpServers.length}`)
  if (res.skills?.length > 0)
    console.error(`  Skills: ${res.skills.length}`)
  if (res.agents?.length > 0)
    console.error(`  Agents: ${res.agents.length}`)
  if (res.memories?.length > 0)
    console.error(`  Memorias: ${res.memories.length}`)
  if (res.contextFiles?.length > 0)
    console.error(`  Context Files: ${res.contextFiles.length}`)

  if (redactedVars.length > 0) {
    console.error(`  Variables redactadas: ${redactedVars.join(', ')}`)
  }
  if (includedVars.length > 0) {
    console.error(`  Variables incluidas: ${includedVars.join(', ')}`)
  }
  if (gitignoreAdded) {
    console.error('  ✅ .aci/ añadido al .gitignore')
  }

  if (bundle.warnings.length > 0) {
    console.error('\n  Advertencias:')
    for (const w of bundle.warnings) {
      console.error(`    ⚠️ ${w}`)
    }
  }
}

/**
 * Pregunta si quiere importar un bundle detectado.
 */
export async function promptAutoImport(
  rl: readline.Interface,
): Promise<boolean> {
  console.error('\nSe detectó un bundle de ecosistema AI en .aci/')

  while (true) {
    const answer = await rl.question('¿Quieres importarlo? [s/N]: ')
    const trimmed = answer.trim()

    if (trimmed === '') return false // Default N
    const parsed = parseYesNo(trimmed)
    if (parsed !== undefined) return parsed
    console.error('  Entrada inválida. Usa s (sí) o n (no).')
  }
}
