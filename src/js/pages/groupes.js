import { db } from '../db.js'
import { navigate } from '../router.js'
import { getCollecteur } from '../auth.js'

export function renderGroupes(container) {
  container.innerHTML = `
    <div class="space-y-3" id="groupes-list"></div>
    <button id="btn-new-groupe" class="btn-primary mt-4">+ Nouveau groupe</button>
  `

  loadGroupes()

  container.querySelector('#btn-new-groupe').addEventListener('click', () => {
    navigate('groupe-form')
  })
}

async function loadGroupes() {
  const list = document.getElementById('groupes-list')
  const collecteur = getCollecteur()
  const groupes = await db.groupes
    .where('collecteur_id').equals(collecteur.id)
    .toArray()

  if (groupes.length === 0) {
    list.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <svg class="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
        <p class="font-medium">Aucun groupe</p>
        <p class="text-sm mt-1">Créez votre premier groupe de tontine</p>
      </div>
    `
    return
  }

  const items = await Promise.all(groupes.map(async g => {
    const count = await db.membres.where('groupe_id').equals(g.id).count()
    const freq = { jour: 'Journalier', semaine: 'Hebdomadaire', mois: 'Mensuel' }[g.frequence] || g.frequence
    return `
      <div class="card cursor-pointer groupe-card" data-id="${g.id}">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-base">${g.nom}</h3>
            <p class="text-sm text-gray-500 mt-0.5">${freq} · ${count} membre${count > 1 ? 's' : ''}</p>
          </div>
          <span class="text-green-600 font-bold text-lg">${Number(g.montant).toLocaleString('fr-FR')} F</span>
        </div>
      </div>
    `
  }))

  list.innerHTML = items.join('')

  list.querySelectorAll('.groupe-card').forEach(card => {
    card.addEventListener('click', () => {
      navigate('groupe-detail', { id: Number(card.dataset.id) })
    })
  })
}
