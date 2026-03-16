import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { loadBundle, planImport, executeImport } from '../ecosystem/import.js'
import { detectTargetTools } from '../ecosystem/detect-target.js'
import type { ImportOptions, ImportTarget, ResourceCategory, ImportSecretsMode } from '../ecosystem/types.js'

export function registerImportTool(server: McpServer): void {
  server.tool(
    'import_ecosystem',
    'Importa un bundle de ecosistema AI (.aci/) a un proyecto, adaptando la configuracion a la herramienta destino',
    {
      file: z
        .string()
        .optional()
        .describe('Ruta al archivo JSON del bundle (auto-detecta .aci/bundle.json si no se especifica)'),
      dir: z.string().optional().describe('Directorio destino del proyecto (default: directorio actual)'),
      target: z
        .enum(['claude', 'cursor', 'windsurf', 'copilot', 'gemini', 'codex', 'opencode'])
        .optional()
        .describe('Herramienta AI destino (auto-detecta si no se especifica)'),
      scope: z
        .enum(['project', 'user'])
        .optional()
        .describe('Forzar scope para recursos flexibles (skills, agents)'),
      force: z.boolean().optional().describe('Sobrescribir recursos existentes sin preguntar'),
      confirm: z
        .boolean()
        .optional()
        .default(true)
        .describe('Ejecutar la importacion (false = solo mostrar plan/dry-run)'),
      only: z
        .array(z.enum(['mcp', 'skills', 'agents', 'memories', 'context']))
        .optional()
        .describe('Importar solo categorias especificas'),
      secrets: z
        .union([z.enum(['none', 'all']), z.array(z.string()), z.record(z.string(), z.string())])
        .optional()
        .default('none')
        .describe(
          'Secretos: "none" redacta, "all" usa valores del bundle, array incluye solo esos, objeto {nombre: valor} asigna valores custom',
        ),
    },
    async ({ file, dir, target, scope, force, confirm, only, secrets }) => {
      try {
        const resolvedDir = dir ?? process.cwd()

        // Load bundle
        const bundle = await loadBundle(file ?? undefined, resolvedDir)

        // Resolve target
        let resolvedTarget: ImportTarget
        if (target) {
          resolvedTarget = target
        } else {
          const detected = await detectTargetTools(resolvedDir)
          if (detected.length === 0) {
            return {
              isError: true,
              content: [
                {
                  type: 'text' as const,
                  text: 'No se detecto herramienta AI en el directorio. Especifica el parametro "target".',
                },
              ],
            }
          }
          resolvedTarget = detected[0]
        }

        // Resolve secrets
        let secretsMode: ImportSecretsMode = 'none'
        let secretValues: Record<string, string | null> | undefined

        if (secrets === 'all') {
          secretsMode = 'all'
        } else if (Array.isArray(secrets)) {
          secretsMode = 'custom'
          // Include only named vars from bundle values
          secretValues = {}
          for (const name of secrets) {
            secretValues[name] = null // will use bundle value if available
          }
        } else if (typeof secrets === 'object' && secrets !== null && !Array.isArray(secrets)) {
          secretsMode = 'custom'
          secretValues = secrets as Record<string, string>
        }

        const options: ImportOptions = {
          file: file ?? undefined,
          dir: resolvedDir,
          target: resolvedTarget,
          scope: scope ?? undefined,
          force: force ?? false,
          confirm: confirm ?? true,
          only: only as ResourceCategory[] | undefined,
          secrets: secretsMode,
          secretValues,
        }

        // Generate plan
        const plan = await planImport(bundle, options)

        // If confirm is false, return dry-run plan only
        if (!confirm) {
          let planText = `Plan de importacion (${resolvedTarget}):\n\n`
          for (const action of plan.actions) {
            const icon =
              action.action === 'install'
                ? '✅'
                : action.action === 'skip'
                  ? '⏭️'
                  : action.action === 'overwrite'
                    ? '🔄'
                    : '❌'
            const label =
              action.action === 'install'
                ? 'Instalar'
                : action.action === 'skip'
                  ? 'Omitir'
                  : action.action === 'overwrite'
                    ? 'Sobrescribir'
                    : 'No soportado'
            planText += `  ${icon} ${label}  ${action.category}: ${action.name} → ${action.targetPath}`
            if (action.reason) planText += ` (${action.reason})`
            planText += '\n'
          }
          planText += `\nResumen: ${plan.summary.install} instalar, ${plan.summary.skip} omitir, ${plan.summary.unsupported} no soportado`
          if (plan.pendingEnvVars.length > 0) {
            planText += `\n⚠️ ${plan.pendingEnvVars.length} env vars pendientes: ${plan.pendingEnvVars.join(', ')}`
          }
          return {
            content: [{ type: 'text' as const, text: planText }],
          }
        }

        // Execute import
        const result = await executeImport(plan, bundle, options)

        let resultText = `Importacion completada (${resolvedTarget}):\n\n`
        resultText += `  ✅ ${result.installed.length} instalados\n`
        resultText += `  ⏭️  ${result.skipped.length} omitidos\n`
        resultText += `  ❌ ${result.unsupported.length} no soportados\n`

        if (result.pendingEnvVars.length > 0) {
          resultText += `\n⚠️ Variables de entorno pendientes:\n`
          for (const varName of result.pendingEnvVars) {
            resultText += `  ${varName}\n`
          }
        }

        return {
          content: [{ type: 'text' as const, text: resultText }],
        }
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error importando ecosistema: ${(err as Error).message}`,
            },
          ],
        }
      }
    },
  )
}
