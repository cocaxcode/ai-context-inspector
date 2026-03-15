import type { ScanResult } from '../scanner/types.js'
import type { ScanSummary } from './sections.js'

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface MapCategory {
  id: string
  label: string
  icon: string
  count: number
  color: string
  items: { name: string; detail?: string }[]
}

function buildCategories(
  result: ScanResult,
  summary: ScanSummary,
): MapCategory[] {
  return [
    {
      id: 'section-mcp',
      label: 'MCP',
      icon: '\u2699',
      count: summary.totalMcpServers,
      color: '#00d4ff',
      items: result.mcpServers.slice(0, 8).map((s) => ({
        name: s.name,
        detail: `${s.introspection?.tools.length ?? 0} tools`,
      })),
    },
    {
      id: 'section-context',
      label: 'Contexto',
      icon: '\uD83D\uDCC4',
      count: summary.totalFiles,
      color: '#b388ff',
      items: result.contextFiles.slice(0, 8).map((f) => ({
        name: f.path,
        detail: f.tool,
      })),
    },
    {
      id: 'section-skills',
      label: 'Skills',
      icon: '\u26A1',
      count: summary.totalSkills,
      color: '#ffab40',
      items: result.skills.slice(0, 8).map((s) => ({
        name: s.name,
      })),
    },
    {
      id: 'section-agents',
      label: 'Agents',
      icon: '\uD83E\uDD16',
      count: summary.totalAgents,
      color: '#00e676',
      items: result.agents.slice(0, 8).map((a) => ({
        name: a.name,
        detail: a.model,
      })),
    },
    {
      id: 'section-memories',
      label: 'Memorias',
      icon: '\uD83E\uDDE0',
      count: summary.totalMemories,
      color: '#ff80ab',
      items: result.memories.slice(0, 8).map((m) => ({
        name: m.type,
        detail: m.status,
      })),
    },
  ]
}

export function renderEcosystemMap(
  result: ScanResult,
  summary: ScanSummary,
): string {
  const categories = buildCategories(result, summary)
  const totalItems =
    summary.totalMcpServers +
    summary.totalFiles +
    summary.totalSkills +
    summary.totalAgents +
    summary.totalMemories

  if (totalItems === 0) return ''

  const W = 800
  const H = 420
  const cx = W / 2
  const cy = H / 2
  const catRadius = 155
  const itemRadius = 70
  const startAngle = -Math.PI / 2

  let svg = ''

  // Defs: glow filter + gradients
  svg += `<defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`

  // Background subtle grid
  svg += `<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
    <circle cx="15" cy="15" r="0.5" fill="var(--text-dim)" opacity="0.15"/>
  </pattern>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>`

  // Draw connections from center to categories
  const catPositions: { x: number; y: number; cat: MapCategory }[] = []

  categories.forEach((cat, i) => {
    const angle = startAngle + (i / categories.length) * Math.PI * 2
    const x = cx + Math.cos(angle) * catRadius
    const y = cy + Math.sin(angle) * catRadius
    catPositions.push({ x, y, cat })

    const dimmed = cat.count === 0

    // Connection line center → category
    svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"
      class="eco-connection ${dimmed ? 'eco-dimmed' : 'eco-connection--active'}"
      style="animation-delay: ${i * 0.3}s"/>`

    // Item sub-nodes
    if (!dimmed && cat.items.length > 0) {
      const maxItems = Math.min(cat.items.length, 8)
      const arcSpread = Math.min(Math.PI * 0.5, maxItems * 0.2)

      cat.items.slice(0, maxItems).forEach((item, j) => {
        const itemAngle =
          angle - arcSpread / 2 + (maxItems > 1 ? (j / (maxItems - 1)) * arcSpread : 0)
        const ix = x + Math.cos(itemAngle) * itemRadius
        const iy = y + Math.sin(itemAngle) * itemRadius

        // Thin connection line
        svg += `<line x1="${x}" y1="${y}" x2="${ix}" y2="${iy}"
          stroke="${cat.color}" stroke-width="0.8" opacity="0.25"/>`

        // Item dot
        svg += `<circle cx="${ix}" cy="${iy}" r="4" fill="${cat.color}"
          class="eco-item-circle" opacity="0.5">
          <title>${esc(item.name)}${item.detail ? ' (' + esc(item.detail) + ')' : ''}</title>
        </circle>`
      })

      // +N more indicator
      if (cat.items.length < cat.count) {
        const extra = cat.count - cat.items.length
        const moreAngle = angle + arcSpread / 2 + 0.3
        const mx = x + Math.cos(moreAngle) * (itemRadius - 10)
        const my = y + Math.sin(moreAngle) * (itemRadius - 10)
        svg += `<text x="${mx}" y="${my}" font-family="var(--font-mono)"
          font-size="9" fill="${cat.color}" opacity="0.6" text-anchor="middle"
          dominant-baseline="middle">+${extra}</text>`
      }
    }

    // Category node circle
    const nodeR = dimmed ? 22 : 28
    svg += `<g class="eco-node ${dimmed ? 'eco-dimmed' : ''}" data-section="${cat.id}">
      <circle cx="${x}" cy="${y}" r="${nodeR}"
        fill="${cat.color}15" stroke="${cat.color}" stroke-width="2"
        class="eco-node-circle" ${!dimmed ? 'filter="url(#glow)"' : ''}/>
      <text x="${x}" y="${y - 3}" class="eco-label"
        fill="${cat.color}" font-weight="600">${cat.icon} ${cat.label}</text>
      <text x="${x}" y="${y + 12}" class="eco-label eco-label--count">${cat.count}</text>
    </g>`
  })

  // Center project node
  const projectName =
    result.project.name.length > 18
      ? result.project.name.slice(0, 16) + '..'
      : result.project.name

  svg += `<g class="eco-node">
    <circle cx="${cx}" cy="${cy}" r="38" fill="var(--accent)" opacity="0.1"
      stroke="var(--accent)" stroke-width="2" class="eco-center-circle"
      filter="url(#glow-strong)"/>
    <circle cx="${cx}" cy="${cy}" r="36" fill="var(--bg-alt)" opacity="0.9"/>
    <text x="${cx}" y="${cy - 5}" class="eco-label eco-label--center">${esc(projectName)}</text>
    <text x="${cx}" y="${cy + 12}" class="eco-label eco-label--count">${totalItems} elementos</text>
  </g>`

  return `
    <div class="ecosystem-map">
      <svg class="ecosystem-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        ${svg}
      </svg>
    </div>`
}
