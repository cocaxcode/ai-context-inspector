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
      items: result.mcpServers.slice(0, 6).map((s) => ({
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
      items: result.contextFiles.slice(0, 6).map((f) => ({
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
      items: result.skills.slice(0, 6).map((s) => ({
        name: s.name,
      })),
    },
    {
      id: 'section-agents',
      label: 'Agents',
      icon: '\uD83E\uDD16',
      count: summary.totalAgents,
      color: '#00e676',
      items: result.agents.slice(0, 6).map((a) => ({
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
      items: result.memories.slice(0, 6).map((m) => ({
        name: m.type,
        detail: m.status,
      })),
    },
  ]
}

// cocaxcode favicon SVG (inline, with unique gradient IDs)
const COCAXCODE_ICON = `<g transform="translate(-16,-16)">
  <defs>
    <linearGradient id="cxc-g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="cxc-g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0891b2"/>
      <stop offset="100%" stop-color="#0e7490"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" fill="#0a0a0c" rx="4"/>
  <rect x="9" y="7.5" width="16" height="18.5" rx="4" fill="url(#cxc-g2)" opacity="0.5"/>
  <rect x="8" y="6.5" width="16" height="18.5" rx="4" fill="url(#cxc-g1)"/>
  <path d="M11.5,11 L18,16 L11.5,21" fill="none" stroke="#0a0a0c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="19" y1="20" x2="21.5" y2="20" stroke="#0a0a0c" stroke-width="1.8" stroke-linecap="round">
    <animate attributeName="x1" values="19;21.5;19" dur="1.4s" repeatCount="indefinite"/>
    <animate attributeName="x2" values="21.5;24;21.5" dur="1.4s" repeatCount="indefinite"/>
  </line>
</g>`

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

  const W = 900
  const H = 480
  const cx = W / 2
  const cy = H / 2
  const catRadius = 165
  const itemRadius = 55
  const startAngle = -Math.PI / 2

  let defs = ''
  let connections = ''
  let itemNodes = ''
  let catNodes = ''

  // Defs: filters + gradients
  defs += `<defs>
    <filter id="eco-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="eco-glow-center" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="eco-bg-grad" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
    </radialGradient>
  </defs>`

  // Background
  let bg = `<rect width="${W}" height="${H}" fill="none"/>
    <circle cx="${cx}" cy="${cy}" r="280" fill="url(#eco-bg-grad)"/>`

  // Orbit rings (subtle)
  bg += `<circle cx="${cx}" cy="${cy}" r="${catRadius}" fill="none"
    stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4 8" opacity="0.4"/>`

  // Draw each category
  categories.forEach((cat, i) => {
    const angle = startAngle + (i / categories.length) * Math.PI * 2
    const x = cx + Math.cos(angle) * catRadius
    const y = cy + Math.sin(angle) * catRadius
    const dimmed = cat.count === 0
    const opacity = dimmed ? 0.2 : 1

    // Connection line center -> category (curved path)
    const midX = (cx + x) / 2
    const midY = (cy + y) / 2
    const perpX = -(y - cy) * 0.08
    const perpY = (x - cx) * 0.08

    connections += `<path d="M${cx},${cy} Q${midX + perpX},${midY + perpY} ${x},${y}"
      fill="none" stroke="${cat.color}" stroke-width="${dimmed ? 0.8 : 1.5}"
      opacity="${dimmed ? 0.15 : 0.35}"
      stroke-dasharray="${dimmed ? '3 6' : '6 4'}"
      ${!dimmed ? `style="animation: eco-dash 15s linear infinite; animation-delay: ${i * 0.5}s"` : ''}/>`

    // Item sub-nodes
    if (!dimmed && cat.items.length > 0) {
      const maxItems = Math.min(cat.items.length, 6)
      const arcSpread = Math.min(Math.PI * 0.6, maxItems * 0.25)

      cat.items.slice(0, maxItems).forEach((item, j) => {
        const itemAngle =
          angle - arcSpread / 2 + (maxItems > 1 ? (j / (maxItems - 1)) * arcSpread : 0)
        const ix = x + Math.cos(itemAngle) * itemRadius
        const iy = y + Math.sin(itemAngle) * itemRadius

        // Thin line to item
        connections += `<line x1="${x}" y1="${y}" x2="${ix}" y2="${iy}"
          stroke="${cat.color}" stroke-width="0.7" opacity="0.2"/>`

        // Item dot with tooltip
        const shortName =
          item.name.length > 15 ? item.name.slice(0, 13) + '..' : item.name
        itemNodes += `<g class="eco-item" data-tooltip="${esc(item.name)}${item.detail ? ' (' + esc(item.detail) + ')' : ''}">
          <circle cx="${ix}" cy="${iy}" r="4.5" fill="${cat.color}" opacity="0.5"
            class="eco-item-dot"/>
          <circle cx="${ix}" cy="${iy}" r="4.5" fill="transparent" stroke="${cat.color}"
            stroke-width="1" opacity="0.3"/>
          <title>${esc(item.name)}${item.detail ? ' \u2014 ' + esc(item.detail) : ''}</title>
        </g>`
      })

      // +N more indicator
      if (cat.count > maxItems) {
        const extra = cat.count - maxItems
        const moreAngle = angle + arcSpread / 2 + 0.35
        const mx = x + Math.cos(moreAngle) * (itemRadius * 0.85)
        const my = y + Math.sin(moreAngle) * (itemRadius * 0.85)
        itemNodes += `<text x="${mx}" y="${my}"
          font-family="var(--font-mono)" font-size="9" fill="${cat.color}"
          opacity="0.5" text-anchor="middle" dominant-baseline="middle">+${extra}</text>`
      }
    }

    // Category node — circle + label ABOVE
    const nodeR = dimmed ? 24 : 32
    const labelY = y - nodeR - 10

    catNodes += `<g class="eco-cat-node" data-section="${cat.id}"
      style="cursor:pointer;opacity:${opacity}" role="button" tabindex="0">
      <!-- Hit area -->
      <circle cx="${x}" cy="${y}" r="${nodeR + 8}" fill="transparent"/>
      <!-- Outer glow ring -->
      ${!dimmed ? `<circle cx="${x}" cy="${y}" r="${nodeR + 3}" fill="none"
        stroke="${cat.color}" stroke-width="1" opacity="0.15"
        style="animation: eco-pulse 3s ease-in-out infinite; animation-delay: ${i * 0.4}s"/>` : ''}
      <!-- Main circle -->
      <circle cx="${x}" cy="${y}" r="${nodeR}" fill="${cat.color}"
        opacity="${dimmed ? 0.08 : 0.12}" stroke="${cat.color}"
        stroke-width="${dimmed ? 1 : 2}" class="eco-cat-circle"
        ${!dimmed ? 'filter="url(#eco-glow)"' : ''}/>
      <!-- Count inside -->
      <text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="middle"
        font-family="var(--font-mono)" font-size="${dimmed ? 14 : 18}"
        font-weight="700" fill="${cat.color}" opacity="${dimmed ? 0.3 : 0.9}">${cat.count}</text>
      <!-- Label + icon ABOVE circle -->
      <text x="${x}" y="${labelY}" text-anchor="middle" dominant-baseline="auto"
        font-family="var(--font-mono)" font-size="11" font-weight="600"
        fill="${cat.color}" opacity="${dimmed ? 0.3 : 0.85}">${cat.icon} ${cat.label}</text>
    </g>`
  })

  // Center project node
  const projectName =
    result.project.name.length > 20
      ? result.project.name.slice(0, 18) + '..'
      : result.project.name

  const centerNode = `<g class="eco-center">
    <!-- Outer pulse ring -->
    <circle cx="${cx}" cy="${cy}" r="48" fill="none" stroke="var(--accent)"
      stroke-width="1" opacity="0.2"
      style="animation: eco-pulse 4s ease-in-out infinite"/>
    <!-- Main circle -->
    <circle cx="${cx}" cy="${cy}" r="42" fill="var(--bg-alt)" stroke="var(--accent)"
      stroke-width="2.5" filter="url(#eco-glow-center)"/>
    <!-- cocaxcode icon in center -->
    <g transform="translate(${cx},${cy - 8}) scale(0.85)">
      ${COCAXCODE_ICON}
    </g>
    <!-- Project name below icon -->
    <text x="${cx}" y="${cy + 20}" text-anchor="middle" dominant-baseline="auto"
      font-family="var(--font-mono)" font-size="10" font-weight="600"
      fill="var(--text-bright)" opacity="0.9">${esc(projectName)}</text>
    <!-- Total count -->
    <text x="${cx}" y="${cy + 32}" text-anchor="middle" dominant-baseline="auto"
      font-family="var(--font-mono)" font-size="8.5"
      fill="var(--text-dim)">${totalItems} elementos</text>
  </g>`

  // Tooltip element (positioned via JS)
  const tooltip = `<g id="eco-tooltip" style="display:none;pointer-events:none">
    <rect x="0" y="0" width="160" height="28" rx="4"
      fill="var(--bg-card)" stroke="var(--border)" stroke-width="1" opacity="0.95"/>
    <text x="80" y="18" text-anchor="middle" font-family="var(--font-mono)"
      font-size="10" fill="var(--text)" id="eco-tooltip-text"></text>
  </g>`

  // cocaxcode watermark bottom-right
  const watermark = `<text x="${W - 12}" y="${H - 10}" text-anchor="end"
    font-family="var(--font-mono)" font-size="9" fill="var(--text-dim)" opacity="0.3"
    letter-spacing="0.05em">cocaxcode</text>`

  const svgContent = `${defs}${bg}${connections}${itemNodes}${catNodes}${centerNode}${tooltip}${watermark}`

  return `
    <div class="ecosystem-map">
      <svg class="ecosystem-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
        role="img" aria-label="Mapa del ecosistema AI del proyecto">
        <style>
          @keyframes eco-dash { to { stroke-dashoffset: -80; } }
          @keyframes eco-pulse { 0%,100% { opacity: 0.15; transform-origin: center; } 50% { opacity: 0.4; } }
          .eco-cat-node:hover .eco-cat-circle { stroke-width: 3; opacity: 0.25; }
          .eco-cat-node:hover { filter: brightness(1.2); }
          .eco-cat-node:focus { outline: none; }
          .eco-cat-node:focus .eco-cat-circle { stroke-width: 3; stroke-dasharray: 4 2; }
          .eco-item-dot { transition: r 0.2s, opacity 0.2s; }
          .eco-item:hover .eco-item-dot { r: 7; opacity: 0.8; }
        </style>
        ${svgContent}
      </svg>
    </div>`
}
