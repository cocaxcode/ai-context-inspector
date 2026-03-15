export const JS_SCRIPTS = `
document.addEventListener('DOMContentLoaded', () => {

  // ── Animated Counters ──
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseInt(el.getAttribute('data-target') || '0')
    if (target === 0) { el.textContent = '0'; return }
    let current = 0
    const step = Math.max(1, Math.ceil(target / 25))
    const interval = setInterval(() => {
      current = Math.min(current + step, target)
      el.textContent = current
      if (current >= target) clearInterval(interval)
    }, 35)
  })

  // ── Section Collapse/Expand ──
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.section')
      if (!section) return
      const content = section.querySelector('.section-content')
      if (!content) return

      if (section.classList.contains('collapsed')) {
        // Expand
        section.classList.remove('collapsed')
        content.style.maxHeight = content.scrollHeight + 'px'
        setTimeout(() => { content.style.maxHeight = '' }, 400)
      } else {
        // Collapse
        content.style.maxHeight = content.scrollHeight + 'px'
        requestAnimationFrame(() => {
          content.style.maxHeight = '0px'
          section.classList.add('collapsed')
        })
      }
    })
  })

  // ── Preview Toggle ──
  document.querySelectorAll('.preview-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const preview = btn.nextElementSibling
      if (preview && preview.classList.contains('preview')) {
        preview.classList.toggle('open')
        btn.textContent = preview.classList.contains('open') ? 'Ocultar' : 'Ver contenido'
      }
    })
  })

  // ── Global Search ──
  const searchInput = document.getElementById('search-input')
  const resultsCount = document.querySelector('.search-results-count')
  const searchKbd = document.querySelector('.search-kbd')

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim()
      let visible = 0
      let total = 0

      document.querySelectorAll('[data-searchable]').forEach(el => {
        const text = el.getAttribute('data-searchable').toLowerCase()
        const match = !query || text.includes(query)
        el.style.display = match ? '' : 'none'
        total++
        if (match) visible++
      })

      if (resultsCount) {
        resultsCount.textContent = query ? visible + ' / ' + total : ''
      }
      if (searchKbd) {
        searchKbd.style.display = query ? 'none' : ''
      }
    })

    searchInput.addEventListener('focus', () => {
      if (searchKbd) searchKbd.style.display = 'none'
    })

    searchInput.addEventListener('blur', () => {
      if (searchKbd && !searchInput.value) searchKbd.style.display = ''
    })
  }

  // ── Keyboard Shortcuts ──
  document.addEventListener('keydown', (e) => {
    // Ignore when typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') {
        e.target.value = ''
        e.target.dispatchEvent(new Event('input'))
        e.target.blur()
      }
      return
    }

    if (e.key === '/') {
      e.preventDefault()
      if (searchInput) searchInput.focus()
    }
  })

  // ── Nav Links (scroll to section) ──
  document.querySelectorAll('.nav-link[data-target]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const targetId = link.getAttribute('data-target')
      const target = document.getElementById(targetId)
      if (target) {
        // Expand if collapsed
        if (target.classList.contains('collapsed')) {
          target.classList.remove('collapsed')
          const content = target.querySelector('.section-content')
          if (content) {
            content.style.maxHeight = content.scrollHeight + 'px'
            setTimeout(() => { content.style.maxHeight = '' }, 400)
          }
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })

  // ── Ecosystem Map (click to scroll) ──
  document.querySelectorAll('.eco-node[data-section]').forEach(node => {
    node.addEventListener('click', () => {
      const targetId = node.getAttribute('data-section')
      const target = document.getElementById(targetId)
      if (target) {
        if (target.classList.contains('collapsed')) {
          target.classList.remove('collapsed')
          const content = target.querySelector('.section-content')
          if (content) {
            content.style.maxHeight = content.scrollHeight + 'px'
            setTimeout(() => { content.style.maxHeight = '' }, 400)
          }
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })

  // ── Theme Toggle ──
  const themeToggle = document.getElementById('theme-toggle')
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const html = document.documentElement
      const current = html.getAttribute('data-theme')
      const next = current === 'light' ? 'dark' : 'light'
      html.setAttribute('data-theme', next)
      themeToggle.innerHTML = next === 'light' ? '&#9728;' : '&#9790;'
    })
  }

  // ── Export JSON ──
  const exportBtn = document.getElementById('export-btn')
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataEl = document.getElementById('scan-data')
      if (!dataEl) return
      const text = dataEl.textContent || ''
      const fallback = () => {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(fallback)
      } else {
        fallback()
      }
      const orig = exportBtn.innerHTML
      exportBtn.textContent = '\\u2713'
      setTimeout(() => { exportBtn.innerHTML = orig }, 1500)
    })
  }

  // ── Copy Buttons ──
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const text = btn.getAttribute('data-copy') || ''
      const fallback = () => {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(fallback)
      } else {
        fallback()
      }
      btn.classList.add('copy-btn--copied')
      btn.textContent = '\\u2713'
      setTimeout(() => {
        btn.classList.remove('copy-btn--copied')
        btn.textContent = 'copiar'
      }, 1500)
    })
  })

})
`
