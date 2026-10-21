import { db } from '../db.js'
import { navigate } from '../router.js'

export function renderMembreForm(container, params) {
  container.innerHTML = `
    <form id="membre-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
        <input type="text" name="nom" class="input-field" placeholder="Ex: Amadou Traoré" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
        <input type="tel" name="telephone" class="input-field" placeholder="Ex: 70123456" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
        <input type="text" name="quartier" class="input-field" placeholder="Ex: Bolomakoté" required />
      </div>
      <button type="submit" class="btn-primary">Ajouter le membre</button>
    </form>
  `

  document.getElementById('membre-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target
    await db.membres.add({
      nom: form.nom.value.trim(),
      telephone: form.telephone.value.trim(),
      quartier: form.quartier.value.trim(),
      groupe_id: params.groupe_id
    })
    navigate('groupe-detail', { id: params.groupe_id })
  })
}
