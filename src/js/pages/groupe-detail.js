import { db } from '../db.js'
import { navigate } from '../router.js'

export function renderGroupeDetail(container, params) {
  container.innerHTML = '<p class="text-gray-400 text-center py-8">Chargement...</p>'
  loadDetail(container, params.id)
}

async function loadDetail(container, groupeId) {
  const groupe = await db.groupes.get(groupeId)
  if (!groupe) {
    container.innerHTML = '<p class="text-red-500">Groupe introuvable</p>'
    return
  }

  const membres = await db.membres.where('groupe_id').equals(groupeId).toArray()
  const freq = { jour: 'Journalier', semaine: 'Hebdomadaire', mois: 'Mensuel' }[groupe.frequence]

  container.innerHTML = `
    <div class="card mb-4">
      <h2 class="font-bold text-lg">${groupe.nom}</h2>
      <p class="text-sm text-gray-500 mt-1">${freq} · ${Number(groupe.montant).toLocaleString('fr-FR')} FCFA</p>
    </div>

    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold">Membres (${membres.length})</h3>
      <button id="btn-add-membre" class="text-green-600 text-sm font-semibold">+ Ajouter</button>
    </div>

    <div id="membres-list" class="space-y-2">
      ${membres.length === 0
        ? '<p class="text-gray-400 text-center py-6 text-sm">Aucun membre dans ce groupe</p>'
        : membres.map(m => `
          <div class="card flex justify-between items-center py-3">
            <div>
              <p class="font-medium">${m.nom}</p>
              <p class="text-xs text-gray-500">${m.quartier} · ${m.telephone}</p>
            </div>
            <button class="btn-delete-membre text-red-400 text-xs" data-id="${m.id}">Supprimer</button>
          </div>
        `).join('')
      }
    </div>

    <div class="mt-6 space-y-2">
      <button id="btn-edit-groupe" class="btn-secondary">Modifier le groupe</button>
      <button id="btn-delete-groupe" class="w-full text-red-500 text-sm py-2">Supprimer ce groupe</button>
    </div>
  `

  container.querySelector('#btn-add-membre').addEventListener('click', () => {
    navigate('membre-form', { groupe_id: groupeId, title: groupe.nom })
  })

  container.querySelector('#btn-edit-groupe').addEventListener('click', () => {
    navigate('groupe-form', { id: groupeId, title: 'Modifier le groupe' })
  })

  container.querySelector('#btn-delete-groupe').addEventListener('click', async () => {
    if (confirm('Supprimer ce groupe et tous ses membres ?')) {
      await db.membres.where('groupe_id').equals(groupeId).delete()
      await db.paiements.where('groupe_id').equals(groupeId).delete()
      await db.groupes.delete(groupeId)
      navigate('groupes')
    }
  })

  container.querySelectorAll('.btn-delete-membre').forEach(btn => {
    btn.addEventListener('click', async () => {
      await db.membres.delete(Number(btn.dataset.id))
      loadDetail(container, groupeId)
    })
  })
}
