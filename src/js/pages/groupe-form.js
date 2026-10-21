import { db } from '../db.js'
import { navigate } from '../router.js'
import { getCollecteur } from '../auth.js'

export function renderGroupeForm(container, params = {}) {
  const editing = params.id != null

  container.innerHTML = `
    <form id="groupe-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nom du groupe</label>
        <input type="text" name="nom" class="input-field" placeholder="Ex: Tontine du marché" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Montant de la cotisation (FCFA)</label>
        <input type="number" name="montant" class="input-field" placeholder="Ex: 1000" min="1" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Fréquence</label>
        <select name="frequence" class="input-field" required>
          <option value="jour">Journalier</option>
          <option value="semaine">Hebdomadaire</option>
          <option value="mois">Mensuel</option>
        </select>
      </div>
      <button type="submit" class="btn-primary">${editing ? 'Modifier' : 'Créer le groupe'}</button>
    </form>
  `

  if (editing) {
    db.groupes.get(params.id).then(g => {
      if (!g) return
      const form = document.getElementById('groupe-form')
      form.nom.value = g.nom
      form.montant.value = g.montant
      form.frequence.value = g.frequence
    })
  }

  document.getElementById('groupe-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target
    const collecteur = getCollecteur()
    const data = {
      nom: form.nom.value.trim(),
      montant: Number(form.montant.value),
      frequence: form.frequence.value,
      date_creation: new Date().toISOString(),
      collecteur_id: collecteur.id
    }

    if (editing) {
      await db.groupes.update(params.id, data)
    } else {
      await db.groupes.add(data)
    }

    navigate('groupes')
  })
}
