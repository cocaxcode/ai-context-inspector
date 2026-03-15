export const CSS_STYLES = `
/* ══════════════════════════════════════════
   AI Context Inspector — Dashboard Styles
   ══════════════════════════════════════════ */

:root {
  --bg: #0a0a0f;
  --bg-alt: #0e0e16;
  --bg-card: #12121a;
  --bg-card-hover: #1a1a25;
  --border: #2a2a3a;
  --border-hover: #3a3a4a;
  --text: #e0e0e8;
  --text-dim: #8888a0;
  --text-bright: #ffffff;
  --accent: #00d4ff;
  --accent-dim: #0099bb;
  --accent-glow: #00d4ff30;
  --green: #00e676;
  --red: #ff5252;
  --orange: #ffab40;
  --purple: #b388ff;
  --pink: #ff80ab;
  --blue: #4285f4;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  --font-sans: system-ui, -apple-system, sans-serif;
  --radius: 10px;
  --radius-sm: 6px;
  --shadow: 0 2px 12px rgba(0,0,0,0.3);
  --shadow-hover: 0 4px 20px rgba(0,212,255,0.1);
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg: #f5f5f8;
    --bg-alt: #eeeef3;
    --bg-card: #ffffff;
    --bg-card-hover: #f0f0f5;
    --border: #d0d0dd;
    --border-hover: #b0b0c0;
    --text: #2a2a3a;
    --text-dim: #666680;
    --text-bright: #000000;
    --accent: #0088cc;
    --accent-dim: #006699;
    --accent-glow: #0088cc20;
    --shadow: 0 2px 12px rgba(0,0,0,0.08);
    --shadow-hover: 0 4px 20px rgba(0,136,204,0.1);
  }
}

[data-theme="light"] {
  --bg: #f5f5f8;
  --bg-alt: #eeeef3;
  --bg-card: #ffffff;
  --bg-card-hover: #f0f0f5;
  --border: #d0d0dd;
  --border-hover: #b0b0c0;
  --text: #2a2a3a;
  --text-dim: #666680;
  --text-bright: #000000;
  --accent: #0088cc;
  --accent-dim: #006699;
  --accent-glow: #0088cc20;
  --shadow: 0 2px 12px rgba(0,0,0,0.08);
  --shadow-hover: 0 4px 20px rgba(0,136,204,0.1);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  line-height: 1.6;
  min-height: 100vh;
}

/* ── Nav Bar ── */
.nav-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 0.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.nav-links {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  align-items: center;
}

.nav-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-right: 0.3rem;
}

.nav-separator {
  width: 1px;
  height: 16px;
  background: var(--border);
  margin: 0 0.4rem;
}

.nav-link {
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--text-dim);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition);
  border: 1px solid transparent;
}

.nav-link:hover {
  color: var(--accent);
  background: var(--accent-glow);
  border-color: var(--accent);
}

.nav-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-dim);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font-mono);
}

.nav-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-glow);
}

/* ── Container ── */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* ── Header ── */
.header {
  text-align: center;
  padding: 2.5rem 0 2rem;
  margin-bottom: 2rem;
}

.header h1 {
  font-family: var(--font-mono);
  font-size: 1.8rem;
  color: var(--accent);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.header .subtitle {
  color: var(--text-dim);
  font-size: 0.85rem;
  font-family: var(--font-mono);
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
.badge--blue { border-color: var(--blue); color: var(--blue); }
.badge--pink { border-color: var(--pink); color: var(--pink); }

/* ── Stats Grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  margin: 2rem 0;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.2rem 1rem;
  text-align: center;
  transition: all var(--transition);
  cursor: default;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--stat-color, var(--accent));
  opacity: 0.8;
}

.stat-card:hover {
  border-color: var(--stat-color, var(--accent));
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.3rem;
  display: block;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--stat-color, var(--accent));
  line-height: 1.1;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-mono);
  margin-top: 0.3rem;
}

/* ── Ecosystem Map ── */
.ecosystem-map {
  margin: 2rem 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-alt);
  overflow: hidden;
  position: relative;
}

.ecosystem-svg {
  width: 100%;
  height: auto;
  display: block;
}

.eco-connection {
  stroke: var(--border);
  stroke-width: 1.5;
  fill: none;
  stroke-dasharray: 6 4;
  animation: dashFlow 20s linear infinite;
}

.eco-connection--active {
  stroke: var(--accent);
  stroke-width: 2;
  opacity: 0.6;
}

@keyframes dashFlow {
  to { stroke-dashoffset: -100; }
}

.eco-node {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.eco-node:hover {
  transform: scale(1.1);
}

.eco-node-circle {
  transition: all 0.2s ease;
}

.eco-node:hover .eco-node-circle {
  filter: brightness(1.3);
}

.eco-center-circle {
  filter: drop-shadow(0 0 12px var(--accent-glow));
}

.eco-label {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--text);
  text-anchor: middle;
  pointer-events: none;
}

.eco-label--center {
  font-size: 14px;
  font-weight: 700;
  fill: var(--text-bright);
}

.eco-label--count {
  font-size: 10px;
  fill: var(--text-dim);
}

.eco-item-circle {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.eco-item-circle:hover {
  opacity: 1;
}

.eco-dimmed {
  opacity: 0.2;
}

/* ── Search ── */
.search-bar {
  position: sticky;
  top: 45px;
  z-index: 10;
  background: color-mix(in srgb, var(--bg) 90%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 0.75rem 0;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-bar input {
  flex: 1;
  padding: 0.65rem 1rem 0.65rem 2.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  outline: none;
  transition: all var(--transition);
}

.search-bar input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  color: var(--text-dim);
  font-size: 0.9rem;
  pointer-events: none;
}

.search-bar-inner {
  position: relative;
  flex: 1;
}

.search-results-count {
  font-size: 0.75rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.search-kbd {
  font-size: 0.65rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.6;
}

/* ── Sections ── */
.section {
  margin-bottom: 1.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  animation: fadeInUp 0.4s ease both;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.2rem;
  background: var(--bg-card);
  cursor: pointer;
  user-select: none;
  transition: background var(--transition);
  gap: 1rem;
}

.section-header:hover {
  background: var(--bg-card-hover);
}

.section-header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.section-icon {
  font-size: 1.1rem;
}

.section-header h2 {
  font-size: 1rem;
  font-family: var(--font-mono);
  color: var(--text-bright);
}

.section-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-header .count {
  font-size: 0.8rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.section-header .arrow {
  transition: transform var(--transition);
  color: var(--text-dim);
  font-size: 0.7rem;
}

.section-content {
  max-height: 8000px;
  overflow: hidden;
  transition: max-height 0.4s ease, opacity 0.3s ease, padding 0.3s ease;
  opacity: 1;
  padding: 1rem 1.2rem;
  border-top: 1px solid var(--border);
}

.section.collapsed .section-content {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-top-color: transparent;
}

.section.collapsed .arrow {
  transform: rotate(-90deg);
}

/* ── Cards ── */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.2rem;
  margin-bottom: 0.75rem;
  transition: all var(--transition);
  animation: fadeInUp 0.3s ease both;
  position: relative;
}

.card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-hover);
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
  flex-wrap: wrap;
}

.card-meta {
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}

/* ── Copy Button ── */
.copy-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font-mono);
  opacity: 0;
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.card:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.copy-btn--copied {
  color: var(--green) !important;
  border-color: var(--green) !important;
}

/* ── Size Bar ── */
.size-bar {
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  margin-top: 0.3rem;
  overflow: hidden;
}

.size-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--accent-dim), var(--accent));
  transition: width 0.6s ease;
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
.tool-badge--opencode { background: #22c55e20; color: #22c55e; border: 1px solid #22c55e40; }
.tool-badge--roo { background: #06b6d420; color: #06b6d4; border: 1px solid #06b6d440; }
.tool-badge--tabnine { background: #e8596820; color: #e85968; border: 1px solid #e8596840; }
.tool-badge--sourcegraph { background: #a112ff20; color: #a112ff; border: 1px solid #a112ff40; }
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
.status--detected { background: #b388ff20; color: var(--purple); }

/* ── Tool list ── */
.tool-list {
  list-style: none;
  margin-top: 0.5rem;
}

.tool-list li {
  padding: 0.35rem 0;
  font-size: 0.8rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.tool-list li:last-child {
  border-bottom: none;
}

.tool-name {
  font-family: var(--font-mono);
  color: var(--accent);
  white-space: nowrap;
  font-size: 0.8rem;
}

.tool-desc {
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.78rem;
}

/* ── Preview ── */
.preview {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  margin-top: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.73rem;
  color: var(--text-dim);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  display: none;
  line-height: 1.5;
}

.preview.open {
  display: block;
  animation: fadeIn 0.2s ease;
}

.preview-toggle {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.75rem;
  cursor: pointer;
  font-family: var(--font-mono);
  padding: 0;
  transition: color var(--transition);
}

.preview-toggle:hover {
  color: var(--accent-dim);
  text-decoration: underline;
}

/* ── Groups ── */
.tool-group {
  margin-bottom: 1.2rem;
}

.tool-group:last-child {
  margin-bottom: 0;
}

.tool-group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--border);
}

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-dim);
}

.empty-state-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: var(--text);
  font-family: var(--font-mono);
}

/* ── Scope badge ── */
.scope-badge {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.scope-badge--project { background: var(--accent); color: var(--bg); }
.scope-badge--user { background: var(--purple); color: var(--bg); }
.scope-badge--vscode { background: #007acc; color: #fff; }
.scope-badge--desktop { background: var(--orange); color: var(--bg); }

/* ── Warnings ── */
.warning-card {
  background: var(--bg-card);
  border: 1px solid var(--orange);
  border-left: 4px solid var(--orange);
  border-radius: var(--radius);
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.warning-card:last-child { margin-bottom: 0; }

.warning-scanner {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--orange);
  margin-bottom: 0.2rem;
}

/* ── Footer ── */
.footer {
  text-align: center;
  padding: 2rem 0;
  margin-top: 2rem;
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.footer a {
  color: var(--accent);
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

/* ── Animations ── */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .container { padding: 1rem; }
  .nav-bar { padding: 0.5rem 1rem; flex-wrap: wrap; }
  .nav-links { display: none; }
  .badges { gap: 0.5rem; }
  .badge { font-size: 0.7rem; padding: 0.2rem 0.6rem; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
  .stat-number { font-size: 1.5rem; }
  .header h1 { font-size: 1.3rem; }
  .ecosystem-map { display: none; }
  .section-content { padding: 0.75rem; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .nav-actions { gap: 0.3rem; }
}

/* ── Print ── */
@media print {
  .nav-bar, .search-bar, .ecosystem-map, .nav-btn, .copy-btn, .preview-toggle { display: none !important; }
  body { background: #fff; color: #000; }
  .container { max-width: 100%; padding: 1rem; }
  .card, .section { break-inside: avoid; box-shadow: none; border-color: #ccc; }
  .section-content { max-height: none !important; opacity: 1 !important; }
  .header h1 { color: #000; }
  .stat-card { border-color: #ccc; }
  .stat-number { color: #333; }
}
`
