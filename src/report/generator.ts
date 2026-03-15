import type { ScanResult } from '../scanner/types.js'
import { CSS_STYLES } from './styles.js'
import { JS_SCRIPTS } from './scripts.js'
import {
  renderHeader,
  renderMcpServers,
  renderContextFiles,
  renderSkills,
  renderMemories,
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
    totalMemories: result.memories.length,
  }
}

export function generateHtml(result: ScanResult): string {
  const summary = computeSummary(result)
  const isEmpty =
    summary.totalMcpServers === 0 &&
    summary.totalFiles === 0 &&
    summary.totalSkills === 0 &&
    summary.totalMemories === 0

  const header = renderHeader(result.project, summary, result.scanDuration)
  const content = isEmpty
    ? renderEmptyState()
    : [
        renderMcpServers(result.mcpServers),
        renderContextFiles(result.contextFiles),
        renderSkills(result.skills),
        renderMemories(result.memories),
      ].join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Context Inspector — ${escHtml(result.project.name)}</title>
  <style>${CSS_STYLES}</style>
</head>
<body>
  <div class="container">
    ${header}
    <div class="search-bar">
      <input type="text" id="search-input" placeholder="Buscar tools, archivos, skills..." />
    </div>
    ${content}
    <footer class="footer">
      Generado por ai-context-inspector &mdash; ${new Date(result.project.scannedAt).toLocaleString()}
    </footer>
  </div>
  <script>${JS_SCRIPTS}</script>
</body>
</html>`
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
