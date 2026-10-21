import { db } from '../db.js'
import { getCollecteur } from '../auth.js'

export function renderTournee(container) {
  container.innerHTML = `
    <div id="groupe-select-wrap" class="mb-4">
      <select id="groupe-select" class="input-field">
        <option value="">-- Choisir un groupe --</option>
      </select>
    </div>
    <div id="tournee-content"></div>
  `

  loadGroupeSelect()

  document.getElementById('groupe-select').addEventListener('change', (e) => {
    const id = Number(e.target.value)
    if (id) loadTournee(id)
    else document.getElementById('tournee-content').innerHTML = ''
  })
}

async function loadGroupeSelect() {
  const collecteur = getCollecteur()
  const groupes = await db.groupes.where('collecteur_id').equals(collecteur.id).toArray()
  const select = document.getElementById('groupe-select')
  groupes.forEach(g => {
    const opt = document.createElement('option')
    opt.value = g.id
    opt.textContent = `${g.nom} (${Number(g.montant).toLocaleString('fr-FR')} F)`
    select.appendChild(opt)
  })
}

async function loadTournee(groupeId) {
  const content = document.getElementById('tournee-content')
  const groupe = await db.groupes.get(groupeId)
  const membres = await db.membres.where('groupe_id').equals(groupeId).toArray()

  if (membres.length === 0) {
    content.innerHTML = '<p class="text-gray-400 text-center py-8">Aucun membre dans ce groupe</p>'
    return
  }

  const today = new Date().toISOString().slice(0, 10)
  const paiementsToday = await db.paiements
    .where('[groupe_id+date]')
    .between([groupeId, today], [groupeId, today + '￿'])
    .toArray()

  const paidIds = new Set(paiementsToday.map(p => p.membre_id))

  const byQuartier = {}
  membres.forEach(m => {
    if (!byQuartier[m.quartier]) byQuartier[m.quartier] = []
    byQuartier[m.quartier].push(m)
  })

  const quartiers = Object.keys(byQuartier).sort()

  content.innerHTML = `
    <p class="text-sm text-gray-500 mb-3">${paidIds.size}/${membres.length} payés aujourd'hui</p>
    ${quartiers.map(q => `
      <div class="mb-4">
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">${q}</h3>
        <div class="space-y-2">
          ${byQuartier[q].map(m => {
            const paid = paidIds.has(m.id)
            return `
              <div class="card flex justify-between items-center py-3 ${paid ? 'bg-green-50 border-green-200' : ''}">
                <div>
                  <p class="font-medium">${m.nom}</p>
                  <p class="text-xs text-gray-500">${m.telephone}</p>
                </div>
                ${paid
                  ? '<span class="badge-paid">Payé ✓</span>'
                  : `<div class="flex gap-2">
                      <button class="btn-pay bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium" data-membre="${m.id}" data-mode="espece">Espèce</button>
                      <button class="btn-pay bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium" data-membre="${m.id}" data-mode="orange_money">OM</button>
                    </div>`
                }
              </div>
            `
          }).join('')}
        </div>
      </div>
    `).join('')}
  `

  content.querySelectorAll('.btn-pay').forEach(btn => {
    btn.addEventListener('click', async () => {
      const membreId = Number(btn.dataset.membre)
      const mode = btn.dataset.mode

      await db.paiements.add({
        membre_id: membreId,
        groupe_id: groupeId,
        montant: groupe.montant,
        date: new Date().toISOString(),
        mode,
        statut: 'paye',
        sync: 0
      })

      loadTournee(groupeId)
      showRecuOption(membreId, groupe)
    })
  })
}

async function showRecuOption(membreId, groupe) {
  const membre = await db.membres.get(membreId)
  if (!membre) return

  const date = new Date().toLocaleDateString('fr-FR')
  const text = `Reçu de paiement\nGroupe: ${groupe.nom}\nMembre: ${membre.nom}\nMontant: ${Number(groupe.montant).toLocaleString('fr-FR')} FCFA\nDate: ${date}\nMerci !`
  const encoded = encodeURIComponent(text)
  const phone = membre.telephone.replace(/\s/g, '')
  const waLink = `https://wa.me/226${phone}?text=${encoded}`

  const toast = document.createElement('div')
  toast.className = 'fixed bottom-20 left-4 right-4 bg-white border border-gray-200 shadow-lg rounded-xl p-4 z-50 flex items-center justify-between'
  toast.innerHTML = `
    <span class="text-sm font-medium text-green-700">Paiement enregistré ✓</span>
    <a href="${waLink}" target="_blank" rel="noopener" class="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium">Envoyer reçu WhatsApp</a>
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 5000)
}
