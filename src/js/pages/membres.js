import { db } from '../db.js'
import { navigate } from '../router.js'
import { getCollecteur } from '../auth.js'
import { statutMembre } from '../cotisation.js'

export function renderMembres(container) {
  container.innerHTML = `
    <div class="mb-4">
      <input id="membre-search" type="search" class="input-field" placeholder="Rechercher un membre..." />
    </div>
    <div id="membres-list" class="space-y-2"></div>
  `
  loadMembres()
  document.getElementById('membre-search').addEventListener('input', (e) => {
    loadMembres(e.target.value.trim().toLowerCase())
  })
}

async function loadMembres(query = '') {
  const list = document.getElementById('membres-list')
  const collecteur = getCollecteur()
  const groupes = await db.groupes.where('collecteur_id').equals(collecteur.id).toArray()
  const groupeIds = new Set(groupes.map(g => g.id))
  const groupeNames = Object.fromEntries(groupes.map(g => [g.id, g.nom]))

  let membres = (await db.membres.toArray()).filter(m => groupeIds.has(m.groupe_id))
  if (query) membres = membres.filter(m => m.nom.toLowerCase().includes(query))

  if (membres.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <p class="empty-title">${query ? 'Aucun résultat' : 'Aucun membre'}</p>
        <p class="empty-desc">${query ? 'Essayez un autre nom' : 'Ajoutez des membres dans vos groupes'}</p>
      </div>
    `
    return
  }

  membres.sort((a, b) => a.nom.localeCompare(b.nom))
  const groupesById = Object.fromEntries((await db.groupes.toArray()).map(g => [g.id, g]))
  const rows = await Promise.all(membres.map(async m => {
    const initiales = m.nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    const paiements = await db.paiements.where('membre_id').equals(m.id).toArray()
    const st = statutMembre(m, groupesById[m.groupe_id], paiements)
    const avatar = m.photo
      ? `<img src="${m.photo}" alt="" class="w-11 h-11 rounded-full object-cover flex-shrink-0" />`
      : `<div class="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style="background:var(--green-600)">${initiales}</div>`
    return `
      <div class="card card-interactive flex items-center gap-3 membre-card" data-id="${m.id}">
        ${avatar}
        <div class="flex-1 min-w-0">
          <p class="font-semibold truncate">${m.nom}</p>
          <p class="text-xs text-muted truncate">${groupeNames[m.groupe_id] || ''} · ${m.quartier}</p>
        </div>
        ${st.retards > 0 ? `<span class="badge badge-late flex-shrink-0">${st.retards} retard${st.retards > 1 ? 's' : ''}</span>` : ''}
        <svg class="w-5 h-5 text-muted flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </div>
    `
  }))
  list.innerHTML = rows.join('')

  list.querySelectorAll('.membre-card').forEach(card => {
    card.addEventListener('click', () => navigate('membre-detail', { id: Number(card.dataset.id) }))
  })
}
