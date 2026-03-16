import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { exportEcosystem } from '../ecosystem/export.js'
import type { ResourceCategory, SecretsMode } from '../ecosystem/types.js'

export function registerExportTool(server: McpServer): void {
  server.tool(
    'export_ecosystem',
    'Exporta el ecosistema AI completo de un proyecto a un bundle JSON portable en .aci/ (MCP servers, skills, agentes, memorias, archivos de contexto)',
    {
      dir: z.string().optional().describe('Directorio a escanear (default: directorio actual)'),
      include_user: z
        .boolean()
        .optional()
        .describe('Incluir recursos a nivel de usuario (~/.claude/skills, memorias, etc.)'),
      only: z
        .array(z.enum(['mcp', 'skills', 'agents', 'memories', 'context']))
        .optional()
        .describe('Exportar solo categorias especificas'),
      secrets: z
        .union([z.enum(['none', 'all']), z.array(z.string())])
        .optional()
        .default('none')
        .describe(
          'Manejo de secretos: "none" redacta todo (default), "all" incluye todo, array de nombres incluye solo esos',
        ),
    },
    async ({ dir, include_user, only, secrets }) => {
      try {
        // Resolve secrets mode and decisions
        let secretsMode: SecretsMode = 'none'
        let secretDecisions: Record<string, boolean> | undefined

        if (secrets === 'all') {
          secretsMode = 'all'
        } else if (Array.isArray(secrets)) {
          secretsMode = 'custom'
          secretDecisions = {}
          // All vars default to false (redact), only named ones are true (include)
          for (const varName of secrets) {
            secretDecisions[varName] = true
          }
        }
        // else 'none' (default)

        const bundle = await exportEcosystem({
          dir: dir ?? process.cwd(),
          includeUser: include_user ?? false,
          only: only as ResourceCategory[] | undefined,
          secrets: secretsMode,
          secretDecisions,
        })

        const mcpCount = bundle.resources.mcpServers.length
        const skillsCount = bundle.resources.skills.length
        const agentsCount = bundle.resources.agents.length
        const memoriesCount = bundle.resources.memories.length
        const contextCount = bundle.resources.contextFiles.length

        // Collect redacted/included var info
        const allRedacted = bundle.resources.mcpServers.flatMap((s) => s.envVarsRedacted)
        const allIncluded = bundle.resources.mcpServers.flatMap((s) => s.envVarsIncluded)

        let summary = `Bundle exportado en .aci/bundle.json\n\n`
        summary += `MCP Servers: ${mcpCount}\n`
        summary += `Skills: ${skillsCount}\n`
        summary += `Agents: ${agentsCount}\n`
        summary += `Memorias: ${memoriesCount}\n`
        summary += `Context Files: ${contextCount}\n`

        if (allRedacted.length > 0) {
          summary += `\nVariables redactadas: ${allRedacted.join(', ')}`
        }
        if (allIncluded.length > 0) {
          summary += `\nVariables incluidas: ${allIncluded.join(', ')}`
        }
        if (bundle.warnings.length > 0) {
          summary += `\n\n⚠️ ${bundle.warnings.join('\n')}`
        }

        return {
          content: [{ type: 'text' as const, text: summary }],
        }
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error exportando ecosistema: ${(err as Error).message}`,
            },
          ],
        }
      }
    },
  )
}
