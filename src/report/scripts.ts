export const JS_SCRIPTS = `
document.addEventListener('DOMContentLoaded', () => {
  // Section collapse/expand
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.section').classList.toggle('collapsed')
    })
  })

  // Preview toggle
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

  // Global search
  const searchInput = document.getElementById('search-input')
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim()
      document.querySelectorAll('[data-searchable]').forEach(el => {
        const text = el.getAttribute('data-searchable').toLowerCase()
        el.style.display = (!query || text.includes(query)) ? '' : 'none'
      })
    })
  }
})
`
