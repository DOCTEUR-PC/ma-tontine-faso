import { db } from '../db.js'
import { navigate } from '../router.js'
import { getCollecteur } from '../auth.js'
import { logAction } from '../audit.js'

export function renderGroupeForm(container, params = {}) {
  const editing = params.id != null

  container.innerHTML = `
    <form id="groupe-form" class="space-y-4">
      <div>
        <label class="form-label">Nom du groupe</label>
        <input type="text" name="nom" class="input-field" placeholder="Ex: Tontine du marché" required />
      </div>
      <div>
        <label class="form-label">Montant de la cotisation (FCFA)</label>
        <input type="number" name="montant" class="input-field" placeholder="Ex: 1000" min="1" required />
      </div>
      <div>
        <label class="form-label">Fréquence</label>
        <select name="frequence" class="input-field" required>
          <option value="jour">Journalier</option>
          <option value="semaine">Hebdomadaire</option>
          <option value="mois">Mensuel</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Pénalité retard (F)</label>
          <input type="number" name="penalite" class="input-field" placeholder="0" min="0" value="0" />
        </div>
        <div>
          <label class="form-label">Commission (%)</label>
          <input type="number" name="commission" class="input-field" placeholder="0" min="0" max="100" step="0.5" value="0" />
        </div>
      </div>
      <p class="text-xs text-muted">La pénalité s'ajoute au solde dû par retard. La commission est votre part sur les collectes.</p>
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
      form.penalite.value = g.penalite || 0
      form.commission.value = g.commission || 0
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
      penalite: Number(form.penalite.value) || 0,
      commission: Number(form.commission.value) || 0,
      date_creation: new Date().toISOString(),
      collecteur_id: collecteur.id
    }

    if (editing) {
      await db.groupes.update(params.id, data)
      logAction('groupe_modifie', data.nom)
    } else {
      await db.groupes.add(data)
      logAction('groupe_cree', data.nom)
    }

    navigate('groupes')
  })
}
