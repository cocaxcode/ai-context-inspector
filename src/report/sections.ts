import type {
  ProjectInfo,
  ContextFileResult,
  McpServerResult,
  SkillResult,
  AgentResult,
  MemoryResult,
  ScanWarning,
  AiTool,
} from '../scanner/types.js'

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface ScanSummary {
  totalMcpServers: number
  totalTools: number
  totalFiles: number
  totalSkills: number
  totalAgents: number
  totalMemories: number
}

// ── Nav Bar ──

export function renderNavBar(summary: ScanSummary): string {
  const links: { id: string; label: string; count: number }[] = [
    { id: 'section-mcp', label: 'MCP', count: summary.totalMcpServers },
    { id: 'section-context', label: 'Contexto', count: summary.totalFiles },
    { id: 'section-skills', label: 'Skills', count: summary.totalSkills },
    { id: 'section-agents', label: 'Agents', count: summary.totalAgents },
    { id: 'section-memories', label: 'Memorias', count: summary.totalMemories },
  ]

  const navLinks = links
    .filter((l) => l.count > 0)
    .map(
      (l) =>
        `<a class="nav-link" data-target="${l.id}">${l.label} (${l.count})</a>`,
    )
    .join('')

  return `
    <nav class="nav-bar">
      <div class="nav-links">
        <span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--accent);margin-right:0.5rem">&gt;_</span>
        ${navLinks}
      </div>
      <div class="nav-actions">
        <button class="nav-btn" id="theme-toggle" title="Cambiar tema">&#9790;</button>
        <button class="nav-btn" id="export-btn" title="Exportar JSON">&#128203;</button>
      </div>
    </nav>`
}

// ── Header ──

export function renderHeader(
  project: ProjectInfo,
  summary: ScanSummary,
  scanDuration: number,
): string {
  const date = new Date(project.scannedAt).toLocaleString()
  return `
    <header class="header">
      <h1>&gt; ai-context-inspector</h1>
      <div class="subtitle">${esc(project.name)} &mdash; ${date} &mdash; ${scanDuration}ms</div>
      <div class="badges">
        <span class="badge badge--accent">${summary.totalMcpServers} MCPs</span>
        <span class="badge badge--green">${summary.totalTools} tools</span>
        <span class="badge badge--purple">${summary.totalFiles} archivos</span>
        <span class="badge badge--orange">${summary.totalSkills} skills</span>
        <span class="badge badge--blue">${summary.totalAgents} agents</span>
        <span class="badge badge--pink">${summary.totalMemories} memorias</span>
      </div>
    </header>`
}

// ── Stats Grid ──

export function renderStatsGrid(summary: ScanSummary): string {
  const stats = [
    {
      icon: '\u2699\uFE0F',
      value: summary.totalMcpServers,
      label: 'MCP Servers',
      color: '#00d4ff',
    },
    {
      icon: '\uD83D\uDEE0\uFE0F',
      value: summary.totalTools,
      label: 'MCP Tools',
      color: '#00e676',
    },
    {
      icon: '\uD83D\uDCC4',
      value: summary.totalFiles,
      label: 'Archivos AI',
      color: '#b388ff',
    },
    {
      icon: '\u26A1',
      value: summary.totalSkills,
      label: 'Skills',
      color: '#ffab40',
    },
    {
      icon: '\uD83E\uDD16',
      value: summary.totalAgents,
      label: 'Agents',
      color: '#4285f4',
    },
    {
      icon: '\uD83E\uDDE0',
      value: summary.totalMemories,
      label: 'Memorias',
      color: '#ff80ab',
    },
  ]

  const cards = stats
    .map(
      (s) => `
      <div class="stat-card" style="--stat-color: ${s.color}">
        <span class="stat-icon">${s.icon}</span>
        <span class="stat-number" data-target="${s.value}">0</span>
        <span class="stat-label">${s.label}</span>
      </div>`,
    )
    .join('')

  return `<div class="stats-grid">${cards}</div>`
}

// ── MCP Servers ──

export function renderMcpServers(servers: McpServerResult[]): string {
  if (servers.length === 0) return ''

  const cards = servers
    .map((s, i) => {
      const intro = s.introspection
      const statusClass = intro
        ? `status--${intro.status}`
        : 'status--configured'
      const statusText = intro
        ? intro.status === 'ok'
          ? 'OK'
          : intro.status === 'timeout'
            ? 'Timeout'
            : 'Error'
        : 'No introspectado'

      let toolsHtml = ''
      if (intro && intro.tools.length > 0) {
        const items = intro.tools
          .map(
            (t) =>
              `<li data-searchable="${esc(t.name + ' ' + (t.description ?? ''))}"><span class="tool-name">${esc(t.name)}</span><span class="tool-desc">${esc(t.description ?? '')}</span></li>`,
          )
          .join('')
        toolsHtml = `<div class="card-meta">${intro.tools.length} tools</div><ul class="tool-list">${items}</ul>`
      }

      let resourcesHtml = ''
      if (intro && intro.resources.length > 0) {
        resourcesHtml = `<div class="card-meta" style="margin-top:0.5rem">${intro.resources.length} resources</div>`
      }

      let promptsHtml = ''
      if (intro && intro.prompts.length > 0) {
        promptsHtml = `<div class="card-meta" style="margin-top:0.5rem">${intro.prompts.length} prompts</div>`
      }

      const serverVersion = intro?.serverInfo
        ? ` v${esc(intro.serverInfo.version)}`
        : ''

      const errorHtml =
        intro?.error
          ? `<div class="card-meta" style="color:var(--red)">${esc(intro.error)}</div>`
          : ''

      const cmdStr = s.config.command
        ? `${s.config.command} ${(s.config.args ?? []).join(' ')}`
        : s.config.url ?? ''

      const configHtml = cmdStr
        ? `<div class="card-meta">${esc(cmdStr)}</div>`
        : ''

      const copyData = cmdStr || s.name

      return `
        <div class="card" data-searchable="${esc(s.name + ' ' + (intro?.serverInfo?.name ?? ''))}"
          style="animation-delay: ${i * 0.05}s">
          <button class="copy-btn" data-copy="${esc(copyData)}">copiar</button>
          <div class="card-title">
            <span>${esc(s.name)}${serverVersion}</span>
            <span class="status ${statusClass}">${statusText}</span>
            <span class="scope-badge scope-badge--${s.source}">${s.source}</span>
          </div>
          ${configHtml}
          ${errorHtml}
          ${toolsHtml}
          ${resourcesHtml}
          ${promptsHtml}
        </div>`
    })
    .join('')

  const totalTools = servers.reduce(
    (sum, s) => sum + (s.introspection?.tools.length ?? 0),
    0,
  )

  return `
    <div class="section" id="section-mcp">
      <div class="section-header">
        <div class="section-header-left">
          <span class="section-icon">\u2699\uFE0F</span>
          <h2>MCP Servers</h2>
        </div>
        <div class="section-header-right">
          <span class="count">${servers.length} servers &middot; ${totalTools} tools</span>
          <span class="arrow">&#9660;</span>
        </div>
      </div>
      <div class="section-content">${cards}</div>
    </div>`
}

// ── Context Files ──

export function renderContextFiles(files: ContextFileResult[]): string {
  if (files.length === 0) return ''

  const maxSize = Math.max(...files.map((f) => f.size), 1)

  // Group by tool
  const groups = new Map<AiTool, ContextFileResult[]>()
  for (const f of files) {
    const existing = groups.get(f.tool) ?? []
    existing.push(f)
    groups.set(f.tool, existing)
  }

  let groupsHtml = ''
  for (const [tool, toolFiles] of groups) {
    const items = toolFiles
      .map((f, i) => {
        const previewHtml = f.preview
          ? `<button class="preview-toggle">Ver contenido</button><div class="preview">${esc(f.preview)}</div>`
          : ''
        const errorHtml = f.error
          ? `<span class="status status--error">${esc(f.error)}</span>`
          : ''
        const sizeStr = f.size > 0 ? formatBytes(f.size) : ''
        const typeIcon = f.type === 'directory' ? '\uD83D\uDCC1' : '\uD83D\uDCC4'
        const sizePercent = f.size > 0 ? Math.max(3, (f.size / maxSize) * 100) : 0
        const sizeBar =
          f.size > 0
            ? `<div class="size-bar"><div class="size-bar-fill" style="width:${sizePercent}%"></div></div>`
            : ''
        const childrenHtml =
          f.children && f.children.length > 0
            ? `<div class="card-meta" style="margin-top:0.3rem">${f.children.length} archivos dentro</div>`
            : ''

        return `
          <div class="card" data-searchable="${esc(f.path + ' ' + tool)}"
            style="animation-delay: ${i * 0.04}s">
            <button class="copy-btn" data-copy="${esc(f.path)}">copiar</button>
            <div class="card-title">${typeIcon} ${esc(f.path)} ${errorHtml}</div>
            <div class="card-meta">${sizeStr} &middot; <span class="scope-badge scope-badge--${f.scope}">${f.scope}</span></div>
            ${sizeBar}
            ${childrenHtml}
            ${previewHtml}
          </div>`
      })
      .join('')

    groupsHtml += `
      <div class="tool-group">
        <div class="tool-group-header">
          <span class="tool-badge tool-badge--${tool}">${tool}</span>
          <span class="count">${toolFiles.length} archivos</span>
        </div>
        ${items}
      </div>`
  }

  return `
    <div class="section" id="section-context">
      <div class="section-header">
        <div class="section-header-left">
          <span class="section-icon">\uD83D\uDCC4</span>
          <h2>Archivos de Contexto</h2>
        </div>
        <div class="section-header-right">
          <span class="count">${files.length} archivos &middot; ${groups.size} herramientas</span>
          <span class="arrow">&#9660;</span>
        </div>
      </div>
      <div class="section-content">${groupsHtml}</div>
    </div>`
}

// ── Skills ──

export function renderSkills(skills: SkillResult[]): string {
  if (skills.length === 0) return ''

  const items = skills
    .map((s, i) => {
      const triggersHtml = s.triggers
        ? `<div class="card-meta">${s.triggers.map((t) => esc(t)).join(', ')}</div>`
        : ''
      return `
        <div class="card" data-searchable="${esc(s.name + ' ' + (s.description ?? ''))}"
          style="animation-delay: ${i * 0.04}s">
          <div class="card-title">
            \u26A1 ${esc(s.name)}
            <span class="scope-badge scope-badge--${s.scope}">${s.scope}</span>
          </div>
          ${s.description ? `<div class="card-meta">${esc(s.description)}</div>` : ''}
          ${triggersHtml}
        </div>`
    })
    .join('')

  return `
    <div class="section" id="section-skills">
      <div class="section-header">
        <div class="section-header-left">
          <span class="section-icon">\u26A1</span>
          <h2>Skills</h2>
        </div>
        <div class="section-header-right">
          <span class="count">${skills.length}</span>
          <span class="arrow">&#9660;</span>
        </div>
      </div>
      <div class="section-content">${items}</div>
    </div>`
}

// ── Agents ──

export function renderAgents(agents: AgentResult[]): string {
  if (agents.length === 0) return ''

  const items = agents
    .map((a, i) => {
      const modelHtml = a.model
        ? `<span class="badge badge--green" style="font-size:0.65rem;padding:0.1rem 0.5rem">${esc(a.model)}</span>`
        : ''
      const memoryHtml = a.hasMemory
        ? '<span class="badge badge--pink" style="font-size:0.65rem;padding:0.1rem 0.5rem">\uD83E\uDDE0 memoria</span>'
        : ''
      return `
        <div class="card" data-searchable="${esc(a.name + ' ' + (a.description ?? ''))}"
          style="animation-delay: ${i * 0.04}s">
          <div class="card-title">
            \uD83E\uDD16 ${esc(a.name)}
            ${modelHtml}
            ${memoryHtml}
            <span class="scope-badge scope-badge--${a.scope}">${a.scope}</span>
          </div>
          ${a.description ? `<div class="card-meta">${esc(a.description)}</div>` : ''}
        </div>`
    })
    .join('')

  return `
    <div class="section" id="section-agents">
      <div class="section-header">
        <div class="section-header-left">
          <span class="section-icon">\uD83E\uDD16</span>
          <h2>Agents</h2>
        </div>
        <div class="section-header-right">
          <span class="count">${agents.length}</span>
          <span class="arrow">&#9660;</span>
        </div>
      </div>
      <div class="section-content">${items}</div>
    </div>`
}

// ── Memories ──

export function renderMemories(memories: MemoryResult[]): string {
  if (memories.length === 0) return ''

  const items = memories
    .map((m, i) => {
      const detailEntries = m.details
        ? Object.entries(m.details).filter(
            ([k]) => k !== 'preview',
          )
        : []
      const detailsHtml =
        detailEntries.length > 0
          ? `<div class="card-meta">${detailEntries
              .map(([k, v]) => `${esc(k)}: ${esc(String(v))}`)
              .join(' &middot; ')}</div>`
          : ''

      const previewVal =
        m.details && typeof m.details.preview === 'string'
          ? m.details.preview
          : null
      const previewHtml = previewVal
        ? `<button class="preview-toggle">Ver contenido</button><div class="preview">${esc(previewVal)}</div>`
        : ''

      return `
        <div class="card" data-searchable="${esc(m.type + ' ' + (m.path ?? ''))}"
          style="animation-delay: ${i * 0.04}s">
          <div class="card-title">
            \uD83E\uDDE0 ${esc(m.type)}
            <span class="status status--${m.status}">${m.status}</span>
          </div>
          <div class="card-meta">${m.source}${m.path ? ` &middot; ${esc(m.path)}` : ''}</div>
          ${detailsHtml}
          ${previewHtml}
        </div>`
    })
    .join('')

  return `
    <div class="section" id="section-memories">
      <div class="section-header">
        <div class="section-header-left">
          <span class="section-icon">\uD83E\uDDE0</span>
          <h2>Memorias</h2>
        </div>
        <div class="section-header-right">
          <span class="count">${memories.length}</span>
          <span class="arrow">&#9660;</span>
        </div>
      </div>
      <div class="section-content">${items}</div>
    </div>`
}

// ── Warnings ──

export function renderWarnings(warnings: ScanWarning[]): string {
  if (warnings.length === 0) return ''

  const items = warnings
    .map(
      (w) => `
      <div class="warning-card">
        <div class="warning-scanner">${esc(w.scanner)}${w.path ? ` &mdash; ${esc(w.path)}` : ''}</div>
        <div>${esc(w.message)}</div>
      </div>`,
    )
    .join('')

  return `
    <div class="section" id="section-warnings">
      <div class="section-header">
        <div class="section-header-left">
          <span class="section-icon">\u26A0\uFE0F</span>
          <h2>Advertencias</h2>
        </div>
        <div class="section-header-right">
          <span class="count">${warnings.length}</span>
          <span class="arrow">&#9660;</span>
        </div>
      </div>
      <div class="section-content">${items}</div>
    </div>`
}

// ── Empty State ──

export function renderEmptyState(): string {
  return `
    <div class="empty-state">
      <span class="empty-state-icon">\uD83D\uDD0D</span>
      <h3>No se encontr\u00F3 configuraci\u00F3n AI en este proyecto</h3>
      <p>Este proyecto no tiene archivos de configuraci\u00F3n de herramientas AI.</p>
      <p style="margin-top:1rem;font-size:0.85rem;color:var(--text-dim)">
        Herramientas soportadas: Claude, Cursor, Windsurf, Copilot, Gemini,
        Codex, OpenCode, Aider, Cline, Roo, Continue, Amazon Q, Augment,
        Replit, Firebase Studio, Tabnine, Sourcegraph
      </p>
    </div>`
}
