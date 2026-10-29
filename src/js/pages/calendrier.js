import { db } from '../db.js'
import { ensureTours, addPeriods, swapTours, toggleLevee } from '../tourLogic.js'
import { logAction } from '../audit.js'

export function renderCalendrier(container, params) {
  container.innerHTML = '<p class="text-muted text-center py-8">Chargement...</p>'
  load(container, params.groupe_id)
}

async function load(container, groupeId) {
  const groupe = await db.groupes.get(groupeId)
  if (!groupe) {
    container.innerHTML = '<p class="text-red text-center py-8">Groupe introuvable</p>'
    return
  }

  const tours = await ensureTours(groupeId)
  const membres = Object.fromEntries((await db.membres.where('groupe_id').equals(groupeId).toArray()).map(m => [m.id, m]))

  if (tours.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        <p class="empty-title">Aucun membre</p>
        <p class="empty-desc">Ajoutez des membres au groupe pour définir l'ordre des tours.</p>
      </div>
    `
    return
  }

  const freqLabel = { jour: 'jour', semaine: 'semaine', mois: 'mois' }[groupe.frequence]
  const dateDebut = new Date(groupe.date_creation || Date.now())
  const prochainNum = (tours.find(t => !t.leve) || {}).numero

  container.innerHTML = `
    <div class="card mb-4" style="background:linear-gradient(135deg,#059669,#047857);border:none;color:white;">
      <p class="text-xs font-semibold uppercase tracking-wide" style="color:rgba(255,255,255,0.8)">Calendrier des tours</p>
      <p class="font-bold text-lg mt-0.5">${groupe.nom}</p>
      <p class="text-sm mt-1" style="color:rgba(255,255,255,0.85)">1 bénéficiaire par ${freqLabel} · ${Number(groupe.montant).toLocaleString('fr-FR')} F × ${tours.length} = ${(groupe.montant * tours.length).toLocaleString('fr-FR')} F</p>
    </div>

    <p class="section-title">Ordre des bénéficiaires</p>
    <div class="space-y-2" id="tours-list"></div>
  `

  const list = container.querySelector('#tours-list')
  renderList()

  function renderList() {
    list.innerHTML = tours.map((t, i) => {
      const m = membres[t.membre_id]
      const date = addPeriods(dateDebut, i, groupe.frequence)
      const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      const isNext = t.numero === prochainNum && !t.leve
      const statut = t.leve
        ? '<span class="badge badge-paid">Levé ✓</span>'
        : isNext
          ? '<span class="badge badge-pending">Prochain</span>'
          : ''
      return `
        <div class="card flex items-center gap-3 py-3" ${isNext ? 'style="border-color:var(--yellow-500)"' : ''}>
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${t.leve ? 'text-white' : ''}" style="background:${t.leve ? 'var(--green-600)' : 'var(--bg-primary)'};color:${t.leve ? '#fff' : 'var(--text-secondary)'}">${t.numero}</div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">${m?.nom || 'Inconnu'}</p>
            <p class="text-xs text-muted">${dateStr}</p>
          </div>
          ${statut}
          <div class="flex flex-col gap-0.5 flex-shrink-0">
            <button class="btn-up text-muted" data-i="${i}" ${i === 0 ? 'disabled style="opacity:.3"' : ''} aria-label="Monter">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>
            </button>
            <button class="btn-down text-muted" data-i="${i}" ${i === tours.length - 1 ? 'disabled style="opacity:.3"' : ''} aria-label="Descendre">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
          </div>
          <button class="btn-levee btn-sm ${t.leve ? 'btn-secondary' : 'btn-green'} flex-shrink-0" data-id="${t.id}" style="width:auto;padding:6px 10px">${t.leve ? 'Annuler' : 'Lever'}</button>
        </div>
      `
    }).join('')

    list.querySelectorAll('.btn-up').forEach(btn => btn.addEventListener('click', () => reorder(Number(btn.dataset.i), -1)))
    list.querySelectorAll('.btn-down').forEach(btn => btn.addEventListener('click', () => reorder(Number(btn.dataset.i), 1)))
    list.querySelectorAll('.btn-levee').forEach(btn => btn.addEventListener('click', () => doLevee(Number(btn.dataset.id))))
  }

  async function reorder(i, dir) {
    const j = i + dir
    if (j < 0 || j >= tours.length) return
    await swapTours(tours[i], tours[j])
    const tmp = tours[i].numero
    tours[i].numero = tours[j].numero
    tours[j].numero = tmp
    tours.sort((a, b) => a.numero - b.numero)
    load(container, groupeId)
  }

  async function doLevee(tourId) {
    const tour = tours.find(t => t.id === tourId)
    const m = membres[tour.membre_id]
    await toggleLevee(tour)
    logAction(tour.leve ? 'levee_annulee' : 'levee', `${m?.nom || ''} · ${groupe.nom}`)
    load(container, groupeId)
  }
}
