export const CSS_STYLES = `
:root {
  --bg: #0a0a0f;
  --bg-card: #12121a;
  --bg-card-hover: #1a1a25;
  --border: #2a2a3a;
  --text: #e0e0e8;
  --text-dim: #8888a0;
  --text-bright: #ffffff;
  --accent: #00d4ff;
  --accent-dim: #0099bb;
  --green: #00e676;
  --red: #ff5252;
  --orange: #ffab40;
  --purple: #b388ff;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  --font-sans: system-ui, -apple-system, sans-serif;
  --radius: 8px;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg: #f5f5f8;
    --bg-card: #ffffff;
    --bg-card-hover: #f0f0f5;
    --border: #d0d0dd;
    --text: #2a2a3a;
    --text-dim: #666680;
    --text-bright: #000000;
    --accent: #0088cc;
    --accent-dim: #006699;
  }
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  line-height: 1.6;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* ── Header ── */
.header {
  text-align: center;
  padding: 2rem 0 1.5rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.5rem;
}

.header h1 {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  color: var(--accent);
  margin-bottom: 0.5rem;
}

.header .subtitle {
  color: var(--text-dim);
  font-size: 0.85rem;
}

.badges {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: var(--font-mono);
  background: var(--bg-card);
  border: 1px solid var(--border);
}

.badge--accent { border-color: var(--accent); color: var(--accent); }
.badge--green { border-color: var(--green); color: var(--green); }
.badge--purple { border-color: var(--purple); color: var(--purple); }
.badge--orange { border-color: var(--orange); color: var(--orange); }

/* ── Search ── */
.search-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg);
  padding: 0.75rem 0;
  margin-bottom: 1rem;
}

.search-bar input {
  width: 100%;
  padding: 0.6rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-bar input:focus {
  border-color: var(--accent);
}

/* ── Sections ── */
.section {
  margin-bottom: 1.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.section-header:hover {
  background: var(--bg-card-hover);
}

.section-header h2 {
  font-size: 1rem;
  font-family: var(--font-mono);
  color: var(--text-bright);
}

.section-header .count {
  font-size: 0.8rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.section-header .arrow {
  transition: transform 0.2s;
  color: var(--text-dim);
}

.section.collapsed .section-content {
  display: none;
}

.section.collapsed .arrow {
  transform: rotate(-90deg);
}

.section-content {
  padding: 1rem;
  border-top: 1px solid var(--border);
}

/* ── Cards ── */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: var(--accent-dim);
}

.card:last-child {
  margin-bottom: 0;
}

.card-title {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--accent);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-meta {
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}

/* ── Tool badges ── */
.tool-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tool-badge--claude { background: #d4760020; color: #d47600; border: 1px solid #d4760040; }
.tool-badge--cursor { background: #00a2ff20; color: #00a2ff; border: 1px solid #00a2ff40; }
.tool-badge--windsurf { background: #00c48020; color: #00c480; border: 1px solid #00c48040; }
.tool-badge--copilot { background: #8b5cf620; color: #8b5cf6; border: 1px solid #8b5cf640; }
.tool-badge--gemini { background: #4285f420; color: #4285f4; border: 1px solid #4285f440; }
.tool-badge--codex { background: #10a37f20; color: #10a37f; border: 1px solid #10a37f40; }
.tool-badge--aider { background: #ff6b6b20; color: #ff6b6b; border: 1px solid #ff6b6b40; }
.tool-badge--cline { background: #e91e6320; color: #e91e63; border: 1px solid #e91e6340; }
.tool-badge--continue { background: #ff980020; color: #ff9800; border: 1px solid #ff980040; }
.tool-badge--amazonq { background: #ff990020; color: #ff9900; border: 1px solid #ff990040; }
.tool-badge--augment { background: #9c27b020; color: #9c27b0; border: 1px solid #9c27b040; }
.tool-badge--replit { background: #f2620020; color: #f26200; border: 1px solid #f2620040; }
.tool-badge--firebase { background: #ffca2820; color: #ffca28; border: 1px solid #ffca2840; }
.tool-badge--vscode { background: #007acc20; color: #007acc; border: 1px solid #007acc40; }
.tool-badge--universal { background: #78909c20; color: #78909c; border: 1px solid #78909c40; }

/* ── Status ── */
.status {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status--ok { background: #00e67620; color: var(--green); }
.status--timeout { background: #ffab4020; color: var(--orange); }
.status--error { background: #ff525220; color: var(--red); }
.status--active { background: #00e67620; color: var(--green); }
.status--configured { background: #00d4ff20; color: var(--accent); }

/* ── Tool list ── */
.tool-list {
  list-style: none;
  margin-top: 0.5rem;
}

.tool-list li {
  padding: 0.3rem 0;
  font-size: 0.8rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 0.5rem;
}

.tool-list li:last-child {
  border-bottom: none;
}

.tool-name {
  font-family: var(--font-mono);
  color: var(--accent);
  white-space: nowrap;
}

.tool-desc {
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Preview ── */
.preview {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.5rem;
  margin-top: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-dim);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow-y: auto;
  display: none;
}

.preview.open {
  display: block;
}

.preview-toggle {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.75rem;
  cursor: pointer;
  font-family: var(--font-mono);
  padding: 0;
}

.preview-toggle:hover {
  text-decoration: underline;
}

/* ── Groups ── */
.tool-group {
  margin-bottom: 1rem;
}

.tool-group:last-child {
  margin-bottom: 0;
}

.tool-group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid var(--border);
}

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-dim);
}

.empty-state h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: var(--text);
}

/* ── Scope badge ── */
.scope-badge {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
}

.scope-badge--project { background: var(--accent); color: var(--bg); }
.scope-badge--user { background: var(--purple); color: var(--bg); }

/* ── Footer ── */
.footer {
  text-align: center;
  padding: 1.5rem 0;
  margin-top: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .container { padding: 1rem; }
  .badges { gap: 0.5rem; }
  .badge { font-size: 0.7rem; padding: 0.2rem 0.6rem; }
}
`
