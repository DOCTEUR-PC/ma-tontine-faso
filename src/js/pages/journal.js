import { db } from '../db.js'
import { getCollecteur } from '../auth.js'
import { ACTIONS } from '../audit.js'

const ICONS = {
  cash: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m9-5a9 9 0 11-18 0 9 9 0 0118 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  group: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
}

export function renderJournal(container) {
  container.innerHTML = '<p class="text-muted text-center py-8">Chargement...</p>'
  load(container)
}

async function load(container) {
  const collecteur = getCollecteur()
  const entries = (await db.audit_log.toArray())
    .filter(e => e.collecteur_id == null || e.collecteur_id === collecteur?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="empty-title">Journal vide</p>
        <p class="empty-desc">Les actions apparaîtront ici au fur et à mesure.</p>
      </div>
    `
    return
  }

  // Groupement par jour
  const groups = {}
  for (const e of entries) {
    const day = new Date(e.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!groups[day]) groups[day] = []
    groups[day].push(e)
  }

  const colorVar = { green: 'var(--green-600)', red: 'var(--red-500)', yellow: 'var(--yellow-500)' }

  container.innerHTML = Object.entries(groups).map(([day, items]) => `
    <p class="section-title" style="margin-top:8px">${day}</p>
    <div class="space-y-2 mb-4">
      ${items.map(e => {
        const meta = ACTIONS[e.action] || { label: e.action, icon: 'check', color: 'green' }
        const time = new Date(e.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        const bg = meta.color === 'red' ? 'var(--red-50)' : meta.color === 'yellow' ? 'var(--yellow-50)' : 'var(--green-50)'
        return `
          <div class="card flex items-center gap-3 py-2.5">
            <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style="background:${bg}">
              <svg class="w-4 h-4" fill="none" stroke="${colorVar[meta.color]}" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="${ICONS[meta.icon]}"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold">${meta.label}</p>
              ${e.details ? `<p class="text-xs text-muted truncate">${e.details}</p>` : ''}
            </div>
            <span class="text-xs text-muted flex-shrink-0">${time}</span>
          </div>
        `
      }).join('')}
    </div>
  `).join('')
}
