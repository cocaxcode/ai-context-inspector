import type {
  ProjectInfo,
  ContextFileResult,
  McpServerResult,
  SkillResult,
  MemoryResult,
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
  totalMemories: number
}

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
        <span class="badge badge--accent">${summary.totalMemories} memorias</span>
      </div>
    </header>`
}

export function renderMcpServers(servers: McpServerResult[]): string {
  if (servers.length === 0) return ''

  const cards = servers
    .map((s) => {
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

      const configHtml = s.config.command
        ? `<div class="card-meta">${esc(s.config.command)} ${esc((s.config.args ?? []).join(' '))}</div>`
        : s.config.url
          ? `<div class="card-meta">${esc(s.config.url)}</div>`
          : ''

      return `
        <div class="card" data-searchable="${esc(s.name + ' ' + (intro?.serverInfo?.name ?? ''))}">
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
    <div class="section">
      <div class="section-header">
        <h2>MCP Servers</h2>
        <div>
          <span class="count">${servers.length} servers &middot; ${totalTools} tools</span>
          <span class="arrow">&#9660;</span>
        </div>
      </div>
      <div class="section-content">${cards}</div>
    </div>`
}

export function renderContextFiles(files: ContextFileResult[]): string {
  if (files.length === 0) return ''

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
      .map((f) => {
        const previewHtml = f.preview
          ? `<button class="preview-toggle">Ver contenido</button><div class="preview">${esc(f.preview)}</div>`
          : ''
        const errorHtml = f.error
          ? `<span class="status status--error">${f.error}</span>`
          : ''
        const sizeStr = f.size > 0 ? formatBytes(f.size) : ''
        const typeIcon = f.type === 'directory' ? '&#128193;' : '&#128196;'
        const childrenHtml =
          f.children && f.children.length > 0
            ? `<div class="card-meta" style="margin-top:0.3rem">${f.children.length} archivos dentro</div>`
            : ''

        return `
          <div class="card" data-searchable="${esc(f.path + ' ' + tool)}">
            <div class="card-title">${typeIcon} ${esc(f.path)} ${errorHtml}</div>
            <div class="card-meta">${sizeStr} &middot; <span class="scope-badge scope-badge--${f.scope}">${f.scope}</span></div>
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
    <div class="section">
      <div class="section-header">
        <h2>Archivos de Contexto</h2>
        <div>
          <span class="count">${files.length} archivos &middot; ${groups.size} herramientas</span>
          <span class="arrow">&#9660;</span>
        </div>
      </div>
      <div class="section-content">${groupsHtml}</div>
    </div>`
}

export function renderSkills(skills: SkillResult[]): string {
  if (skills.length === 0) return ''

  const items = skills
    .map((s) => {
      const triggersHtml = s.triggers
        ? `<div class="card-meta">${s.triggers.map((t) => esc(t)).join(', ')}</div>`
        : ''
      return `
        <div class="card" data-searchable="${esc(s.name + ' ' + (s.description ?? ''))}">
          <div class="card-title">
            ${esc(s.name)}
            <span class="scope-badge scope-badge--${s.scope}">${s.scope}</span>
          </div>
          ${s.description ? `<div class="card-meta">${esc(s.description)}</div>` : ''}
          ${triggersHtml}
        </div>`
    })
    .join('')

  return `
    <div class="section">
      <div class="section-header">
        <h2>Skills</h2>
        <div>
          <span class="count">${skills.length}</span>
          <span class="arrow">&#9660;</span>
        </div>
      </div>
      <div class="section-content">${items}</div>
    </div>`
}

export function renderMemories(memories: MemoryResult[]): string {
  if (memories.length === 0) return ''

  const items = memories
    .map((m) => {
      const detailsHtml = m.details
        ? `<div class="card-meta">${Object.entries(m.details)
            .map(([k, v]) => `${esc(k)}: ${esc(String(v))}`)
            .join(' &middot; ')}</div>`
        : ''
      return `
        <div class="card" data-searchable="${esc(m.type)}">
          <div class="card-title">
            ${esc(m.type)}
            <span class="status status--${m.status}">${m.status}</span>
          </div>
          <div class="card-meta">${m.source}${m.path ? ` &middot; ${esc(m.path)}` : ''}</div>
          ${detailsHtml}
        </div>`
    })
    .join('')

  return `
    <div class="section">
      <div class="section-header">
        <h2>Memorias</h2>
        <div>
          <span class="count">${memories.length}</span>
          <span class="arrow">&#9660;</span>
        </div>
      </div>
      <div class="section-content">${items}</div>
    </div>`
}

export function renderEmptyState(): string {
  return `
    <div class="empty-state">
      <h3>No se encontró configuración AI en este proyecto</h3>
      <p>Este proyecto no tiene archivos de configuración de herramientas AI.</p>
      <p style="margin-top:1rem;font-size:0.85rem">
        Herramientas soportadas: Claude, Cursor, Windsurf, Copilot, Gemini,
        Codex, Aider, Cline, Continue, Amazon Q, Augment, Replit, Firebase Studio
      </p>
    </div>`
}
