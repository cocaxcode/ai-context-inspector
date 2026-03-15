import type { ScanResult } from '../scanner/types.js'
import { CSS_STYLES } from './styles.js'
import { JS_SCRIPTS } from './scripts.js'
import { renderEcosystemMap } from './ecosystem-map.js'
import {
  renderNavBar,
  renderHeader,
  renderStatsGrid,
  renderMcpServers,
  renderContextFiles,
  renderSkills,
  renderAgents,
  renderMemories,
  renderWarnings,
  renderEmptyState,
  type ScanSummary,
} from './sections.js'

function computeSummary(result: ScanResult): ScanSummary {
  return {
    totalMcpServers: result.mcpServers.length,
    totalTools: result.mcpServers.reduce(
      (sum, s) => sum + (s.introspection?.tools.length ?? 0),
      0,
    ),
    totalFiles: result.contextFiles.length,
    totalSkills: result.skills.length,
    totalAgents: result.agents.length,
    totalMemories: result.memories.length,
  }
}

export function generateHtml(result: ScanResult): string {
  const summary = computeSummary(result)
  const isEmpty =
    summary.totalMcpServers === 0 &&
    summary.totalFiles === 0 &&
    summary.totalSkills === 0 &&
    summary.totalAgents === 0 &&
    summary.totalMemories === 0

  const navBar = renderNavBar(summary)
  const header = renderHeader(result.project, summary, result.scanDuration)
  const statsGrid = renderStatsGrid(summary)
  const ecosystemMap = renderEcosystemMap(result, summary)

  const content = isEmpty
    ? renderEmptyState()
    : [
        renderMcpServers(result.mcpServers),
        renderContextFiles(result.contextFiles),
        renderSkills(result.skills),
        renderAgents(result.agents),
        renderMemories(result.memories),
        renderWarnings(result.warnings),
      ].join('')

  // Build a safe JSON summary for export (no sensitive paths)
  const exportData = {
    project: result.project.name,
    scannedAt: result.project.scannedAt,
    scanDuration: result.scanDuration,
    summary,
    mcpServers: result.mcpServers.map((s) => ({
      name: s.name,
      source: s.source,
      transport: s.config.transport,
      tools: s.introspection?.tools.length ?? 0,
    })),
    contextFiles: result.contextFiles.map((f) => ({
      path: f.path,
      tool: f.tool,
      scope: f.scope,
    })),
    skills: result.skills.map((s) => ({ name: s.name, scope: s.scope })),
    agents: result.agents.map((a) => ({
      name: a.name,
      scope: a.scope,
      model: a.model,
    })),
    memories: result.memories.map((m) => ({
      type: m.type,
      source: m.source,
      status: m.status,
    })),
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Context Inspector \u2014 ${escHtml(result.project.name)}</title>
  <style>${CSS_STYLES}</style>
</head>
<body>
  ${navBar}
  <div class="container">
    ${header}
    ${statsGrid}
    ${ecosystemMap}
    <div class="search-bar">
      <div class="search-bar-inner">
        <span class="search-icon">\uD83D\uDD0D</span>
        <input type="text" id="search-input" placeholder="Buscar tools, archivos, skills, agents..." />
        <span class="search-kbd">/</span>
      </div>
      <span class="search-results-count"></span>
    </div>
    ${content}
    <footer class="footer">
      Generado por ai-context-inspector &mdash; ${new Date(result.project.scannedAt).toLocaleString()}
    </footer>
  </div>
  <script type="application/json" id="scan-data">${JSON.stringify(exportData)}</script>
  <script>${JS_SCRIPTS}</script>
</body>
</html>`
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
