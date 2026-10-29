const KEY = 'tontine_theme'

function applyIcons(isDark) {
  const moon = document.getElementById('icon-moon')
  const sun = document.getElementById('icon-sun')
  if (!moon || !sun) return
  moon.classList.toggle('hidden', isDark)
  sun.classList.toggle('hidden', !isDark)
}

function isDarkNow() {
  const stored = localStorage.getItem(KEY)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function initTheme() {
  const stored = localStorage.getItem(KEY)
  if (stored) document.documentElement.setAttribute('data-theme', stored)
  applyIcons(isDarkNow())
}

export function toggleTheme() {
  const dark = !isDarkNow()
  const theme = dark ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem(KEY, theme) } catch {}
  applyIcons(dark)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#047857' : '#059669')
}
