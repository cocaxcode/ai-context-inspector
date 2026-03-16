// ── Deteccion y manejo de secretos en variables de entorno ──

import type { DetectedEnvVar } from './types.js'
import type { McpServerResult } from '../scanner/types.js'

/**
 * Patron para detectar variables que probablemente contienen secretos.
 * Coincide con: key, token, secret, password, credential, auth (case-insensitive).
 */
const SENSITIVE_VAR_REGEX = /key|token|secret|password|credential|auth/i

/**
 * Patron para detectar valores que ya son referencias a variables (e.g. ${VAR_NAME}).
 * Estos no se redactan porque ya son placeholders.
 */
const VAR_REFERENCE_REGEX = /^\$\{.+\}$/

/**
 * Patron para extraer referencias ${VAR} dentro de strings de argumentos.
 */
const ARG_VAR_REGEX = /\$\{([^}]+)\}/g

/**
 * Determina si un nombre de variable es potencialmente sensible.
 */
export function isSensitiveVar(varName: string): boolean {
  return SENSITIVE_VAR_REGEX.test(varName)
}

/**
 * Escanea todos los servidores MCP y extrae las variables de entorno detectadas.
 * Tambien revisa los args por patrones ${VAR}.
 */
export function detectEnvVars(servers: McpServerResult[]): DetectedEnvVar[] {
  const vars: DetectedEnvVar[] = []
  const seen = new Set<string>()

  for (const server of servers) {
    // Variables explicitias en config.env
    if (server.config.env) {
      for (const [varName, value] of Object.entries(server.config.env)) {
        const key = `${server.name}:${varName}`
        if (seen.has(key)) continue
        seen.add(key)

        vars.push({
          serverName: server.name,
          varName,
          value,
          isSensitive: isSensitiveVar(varName),
        })
      }
    }

    // Variables referenciadas en args via ${VAR}
    if (server.config.args) {
      for (const arg of server.config.args) {
        let match: RegExpExecArray | null
        while ((match = ARG_VAR_REGEX.exec(arg)) !== null) {
          const varName = match[1]
          const key = `${server.name}:${varName}`
          if (seen.has(key)) continue
          seen.add(key)

          vars.push({
            serverName: server.name,
            varName,
            value: `\${${varName}}`,
            isSensitive: isSensitiveVar(varName),
          })
        }
      }
    }
  }

  return vars
}

/**
 * Genera el valor redactado para una variable: ${VAR_NAME}
 */
export function redactValue(varName: string): string {
  return `\${${varName}}`
}

/**
 * Aplica la politica de secretos a un objeto de variables de entorno.
 *
 * @param env - Variables de entorno originales (puede ser undefined)
 * @param mode - 'none' redacta todo, 'all' incluye todo, 'custom' usa customDecisions
 * @param customDecisions - Mapa varName -> true=incluir, false=redactar (solo para mode 'custom')
 * @returns env procesado, lista de vars redactadas, lista de vars incluidas
 */
export function applySecretsPolicy(
  env: Record<string, string> | undefined,
  mode: 'none' | 'all' | 'custom',
  customDecisions?: Record<string, boolean>,
): {
  env: Record<string, string> | undefined
  redacted: string[]
  included: string[]
} {
  if (!env || Object.keys(env).length === 0) {
    return { env: undefined, redacted: [], included: [] }
  }

  const processed: Record<string, string> = {}
  const redacted: string[] = []
  const included: string[] = []

  for (const [varName, value] of Object.entries(env)) {
    // Si el valor ya es una referencia ${...}, mantener tal cual
    if (VAR_REFERENCE_REGEX.test(value)) {
      processed[varName] = value
      included.push(varName)
      continue
    }

    if (mode === 'none') {
      // Redactar todo
      processed[varName] = redactValue(varName)
      redacted.push(varName)
    } else if (mode === 'all') {
      // Incluir todo
      processed[varName] = value
      included.push(varName)
    } else {
      // Modo custom: consultar decisiones individuales
      const include = customDecisions?.[varName] ?? false
      if (include) {
        processed[varName] = value
        included.push(varName)
      } else {
        processed[varName] = redactValue(varName)
        redacted.push(varName)
      }
    }
  }

  return { env: processed, redacted, included }
}
