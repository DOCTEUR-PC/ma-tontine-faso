import { db } from '../db.js'
import { getCollecteur } from '../auth.js'

export function renderDashboard(container) {
  container.innerHTML = `
    <div id="dash-select-wrap" class="mb-4">
      <select id="dash-groupe-select" class="input-field">
        <option value="">-- Choisir un groupe --</option>
      </select>
    </div>
    <div id="dash-content"></div>
  `

  loadGroupeOptions()

  document.getElementById('dash-groupe-select').addEventListener('change', (e) => {
    const id = Number(e.target.value)
    if (id) loadDashboard(id)
    else document.getElementById('dash-content').innerHTML = ''
  })
}

async function loadGroupeOptions() {
  const collecteur = getCollecteur()
  const groupes = await db.groupes.where('collecteur_id').equals(collecteur.id).toArray()
  const select = document.getElementById('dash-groupe-select')
  groupes.forEach(g => {
    const opt = document.createElement('option')
    opt.value = g.id
    opt.textContent = g.nom
    select.appendChild(opt)
  })
}

async function loadDashboard(groupeId) {
  const content = document.getElementById('dash-content')
  const groupe = await db.groupes.get(groupeId)
  const membres = await db.membres.where('groupe_id').equals(groupeId).toArray()
  const paiements = await db.paiements.where('groupe_id').equals(groupeId).toArray()

  const today = new Date().toISOString().slice(0, 10)
  const paiementsToday = paiements.filter(p => p.date.slice(0, 10) === today)
  const paidTodayIds = new Set(paiementsToday.map(p => p.membre_id))

  const totalCollecte = paiements.reduce((sum, p) => sum + p.montant, 0)
  const payesAujourdhui = paidTodayIds.size
  const retards = membres.length - payesAujourdhui

  const tourIndex = membres.length > 0
    ? Math.floor(paiements.length / membres.length) % membres.length
    : 0
  const beneficiaire = membres[tourIndex]

  content.innerHTML = `
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="card text-center">
        <p class="text-2xl font-bold text-green-600">${payesAujourdhui}</p>
        <p class="text-xs text-gray-500 mt-1">Payés aujourd'hui</p>
      </div>
      <div class="card text-center">
        <p class="text-2xl font-bold ${retards > 0 ? 'text-red-500' : 'text-gray-400'}">${retards > 0 ? retards : '0'}</p>
        <p class="text-xs text-gray-500 mt-1">En retard</p>
      </div>
      <div class="card text-center col-span-2">
        <p class="text-2xl font-bold text-gray-800">${totalCollecte.toLocaleString('fr-FR')} F</p>
        <p class="text-xs text-gray-500 mt-1">Total collecté</p>
      </div>
    </div>

    ${beneficiaire ? `
      <div class="card bg-green-50 border-green-200">
        <p class="text-xs text-green-600 font-semibold uppercase tracking-wide">Prochain bénéficiaire</p>
        <p class="text-lg font-bold mt-1">${beneficiaire.nom}</p>
        <p class="text-sm text-gray-500">${beneficiaire.quartier} · ${beneficiaire.telephone}</p>
      </div>
    ` : ''}

    <h3 class="font-semibold mt-6 mb-3">Historique récent</h3>
    <div class="space-y-2">
      ${paiements.slice(-10).reverse().map(p => {
        const m = membres.find(m => m.id === p.membre_id)
        const date = new Date(p.date).toLocaleDateString('fr-FR')
        const mode = p.mode === 'orange_money' ? 'OM' : 'Espèce'
        return `
          <div class="card flex justify-between items-center py-2.5">
            <div>
              <p class="text-sm font-medium">${m?.nom || 'Inconnu'}</p>
              <p class="text-xs text-gray-400">${date} · ${mode}</p>
            </div>
            <span class="text-sm font-bold text-green-600">${Number(p.montant).toLocaleString('fr-FR')} F</span>
          </div>
        `
      }).join('') || '<p class="text-gray-400 text-center text-sm py-4">Aucun paiement</p>'}
    </div>
  `
}
