import { db } from '../db.js'
import { navigate } from '../router.js'
import { logAction } from '../audit.js'

export function renderMembreForm(container, params) {
  container.innerHTML = `
    <form id="membre-form" class="space-y-4">
      <div>
        <label class="form-label">Nom complet</label>
        <input type="text" name="nom" class="input-field" placeholder="Ex: Amadou Traoré" required />
      </div>
      <div>
        <label class="form-label">Téléphone</label>
        <input type="tel" name="telephone" class="input-field" placeholder="Ex: 70123456" required />
      </div>
      <div>
        <label class="form-label">Quartier</label>
        <input type="text" name="quartier" class="input-field" placeholder="Ex: Bolomakoté" required />
      </div>
      <button type="submit" class="btn-primary">Ajouter le membre</button>
    </form>
  `

  document.getElementById('membre-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target
    const nom = form.nom.value.trim()
    await db.membres.add({
      nom,
      telephone: form.telephone.value.trim(),
      quartier: form.quartier.value.trim(),
      groupe_id: params.groupe_id,
      date_adhesion: new Date().toISOString()
    })
    logAction('membre_ajoute', nom)
    navigate('groupe-detail', { id: params.groupe_id })
  })
}
