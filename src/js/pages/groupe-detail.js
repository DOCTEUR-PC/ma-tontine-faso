import { db } from '../db.js'
import { navigate } from '../router.js'
import { logAction } from '../audit.js'

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
    <div class="card mb-4" style="background:linear-gradient(135deg,#059669,#047857);border:none;color:white;">
      <h2 class="font-bold text-lg">${groupe.nom}</h2>
      <p class="text-sm mt-1" style="color:rgba(255,255,255,0.85)">${freq} · ${Number(groupe.montant).toLocaleString('fr-FR')} FCFA</p>
    </div>

    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold">Membres (${membres.length})</h3>
      <button id="btn-add-membre" class="text-green text-sm font-semibold">+ Ajouter</button>
    </div>

    <div id="membres-list" class="space-y-2">
      ${membres.length === 0
        ? '<p class="text-muted text-center py-6 text-sm">Aucun membre dans ce groupe</p>'
        : membres.map(m => `
          <div class="card flex justify-between items-center py-3">
            <div>
              <p class="font-semibold">${m.nom}</p>
              <p class="text-xs text-muted">${m.quartier} · ${m.telephone}</p>
            </div>
            <button class="btn-delete-membre btn-danger text-xs" data-id="${m.id}">Supprimer</button>
          </div>
        `).join('')
      }
    </div>

    <div class="mt-6 space-y-2">
      <button id="btn-calendrier" class="btn-primary">Calendrier des tours</button>
      <button id="btn-edit-groupe" class="btn-secondary">Modifier le groupe</button>
      <button id="btn-delete-groupe" class="w-full btn-danger py-2">Supprimer ce groupe</button>
    </div>
  `

  container.querySelector('#btn-add-membre').addEventListener('click', () => {
    navigate('membre-form', { groupe_id: groupeId, title: groupe.nom })
  })

  container.querySelector('#btn-calendrier').addEventListener('click', () => {
    navigate('calendrier', { groupe_id: groupeId })
  })

  container.querySelector('#btn-edit-groupe').addEventListener('click', () => {
    navigate('groupe-form', { id: groupeId, title: 'Modifier le groupe' })
  })

  container.querySelector('#btn-delete-groupe').addEventListener('click', async () => {
    if (confirm('Supprimer ce groupe et tous ses membres ?')) {
      await db.membres.where('groupe_id').equals(groupeId).delete()
      await db.paiements.where('groupe_id').equals(groupeId).delete()
      await db.tours.where('groupe_id').equals(groupeId).delete()
      await db.groupes.delete(groupeId)
      logAction('groupe_supprime', groupe.nom)
      navigate('groupes')
    }
  })

  container.querySelectorAll('.btn-delete-membre').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mid = Number(btn.dataset.id)
      const m = await db.membres.get(mid)
      await db.membres.delete(mid)
      logAction('membre_supprime', m?.nom || '')
      loadDetail(container, groupeId)
    })
  })
}
