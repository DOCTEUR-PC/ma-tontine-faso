import { db } from '../db.js'
import { getCollecteur } from '../auth.js'
import { statutMembre } from '../cotisation.js'
import { rappelUrl } from '../rappel.js'
import { recuPDF } from '../pdf.js'
import { logAction } from '../audit.js'

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
    content.innerHTML = '<p class="text-muted text-center py-8">Aucun membre dans ce groupe</p>'
    return
  }

  const today = new Date().toISOString().slice(0, 10)
  const paiementsToday = await db.paiements
    .where('[groupe_id+date]')
    .between([groupeId, today], [groupeId, today + '￿'])
    .toArray()

  const paidIds = new Set(paiementsToday.map(p => p.membre_id))
  const retardataires = membres.filter(m => !paidIds.has(m.id))

  const byQuartier = {}
  membres.forEach(m => {
    if (!byQuartier[m.quartier]) byQuartier[m.quartier] = []
    byQuartier[m.quartier].push(m)
  })

  const quartiers = Object.keys(byQuartier).sort()

  content.innerHTML = `
    <div class="card mb-4 flex items-center justify-between">
      <span class="text-sm font-medium">Progression du jour</span>
      <span class="badge badge-paid">${paidIds.size}/${membres.length} payés</span>
    </div>
    ${retardataires.length > 0 ? `
      <button id="btn-rappel-tous" class="btn-secondary mb-4 flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 012.41 5.82c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.24-8.24z"/></svg>
        Rappeler les retardataires (${retardataires.length})
      </button>
    ` : ''}
    ${quartiers.map(q => `
      <div class="mb-4">
        <h3 class="section-title">${q}</h3>
        <div class="space-y-2">
          ${byQuartier[q].map(m => {
            const paid = paidIds.has(m.id)
            return `
              <div class="card flex justify-between items-center py-3" ${paid ? 'style="background:var(--green-50);border-color:var(--green-500)"' : ''}>
                <div>
                  <p class="font-semibold">${m.nom}</p>
                  <p class="text-xs text-muted">${m.telephone}</p>
                </div>
                ${paid
                  ? '<span class="badge badge-paid">Payé ✓</span>'
                  : `<div class="flex gap-2 items-center">
                      <button class="btn-rappel w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" data-membre="${m.id}" style="background:var(--green-50);color:var(--green-600)" aria-label="Rappel WhatsApp">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 012.41 5.82c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.24-8.24zM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74 2.07.9 2.49.72 2.94.68.45-.04 1.45-.59 1.66-1.17.2-.57.2-1.07.14-1.17-.06-.1-.22-.16-.47-.28-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.85-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/></svg>
                      </button>
                      <button class="btn-pay btn-sm btn-green" data-membre="${m.id}" data-mode="espece">Espèce</button>
                      <button class="btn-pay btn-sm btn-orange" data-membre="${m.id}" data-mode="orange_money">OM</button>
                    </div>`
                }
              </div>
            `
          }).join('')}
        </div>
      </div>
    `).join('')}
  `

  const collecteur = getCollecteur()
  async function openRappel(membreId) {
    const m = await db.membres.get(membreId)
    const paiements = await db.paiements.where('membre_id').equals(membreId).toArray()
    const st = statutMembre(m, groupe, paiements)
    window.open(rappelUrl(m, groupe, st, collecteur?.nom), '_blank', 'noopener')
  }

  content.querySelectorAll('.btn-rappel').forEach(btn => {
    btn.addEventListener('click', () => openRappel(Number(btn.dataset.membre)))
  })

  const btnTous = content.querySelector('#btn-rappel-tous')
  if (btnTous) btnTous.addEventListener('click', () => showRappelSheet(retardataires, groupe, collecteur))

  content.querySelectorAll('.btn-pay').forEach(btn => {
    btn.addEventListener('click', async () => {
      const membreId = Number(btn.dataset.membre)
      const mode = btn.dataset.mode

      const dateIso = new Date().toISOString()
      await db.paiements.add({
        membre_id: membreId,
        groupe_id: groupeId,
        montant: groupe.montant,
        date: dateIso,
        mode,
        statut: 'paye',
        sync: 0
      })

      const membrePaye = await db.membres.get(membreId)
      logAction('paiement', `${membrePaye?.nom || ''} · ${Number(groupe.montant).toLocaleString('fr-FR')} F · ${groupe.nom}`)

      loadTournee(groupeId)
      showRecuOption(membreId, groupe, mode, dateIso)
    })
  })
}

async function showRappelSheet(retardataires, groupe, collecteur) {
  // Précalcule le statut de chaque retardataire
  const rows = await Promise.all(retardataires.map(async m => {
    const paiements = await db.paiements.where('membre_id').equals(m.id).toArray()
    const st = statutMembre(m, groupe, paiements)
    return { m, st, url: rappelUrl(m, groupe, st, collecteur?.nom) }
  }))

  const overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold">Rappeler les retardataires</h3>
        <button id="sheet-close" class="text-muted text-sm font-semibold">Fermer</button>
      </div>
      <p class="text-xs text-muted mb-3">Chaque rappel ouvre WhatsApp avec un message pré-rempli.</p>
      <div class="space-y-2" style="max-height:50vh;overflow-y:auto">
        ${rows.map(({ m, st, url }) => `
          <div class="card flex items-center justify-between py-2.5">
            <div class="min-w-0">
              <p class="font-semibold truncate">${m.nom}</p>
              <p class="text-xs text-muted">${st.soldeDu > 0 ? st.soldeDu.toLocaleString('fr-FR') + ' F dû' : 'À relancer'}</p>
            </div>
            <a href="${url}" target="_blank" rel="noopener" class="btn-sm btn-green flex-shrink-0">Rappeler</a>
          </div>
        `).join('')}
      </div>
    </div>
  `
  document.body.appendChild(overlay)
  const close = () => overlay.remove()
  overlay.querySelector('#sheet-close').addEventListener('click', close)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
}

async function showRecuOption(membreId, groupe, mode, dateIso) {
  const membre = await db.membres.get(membreId)
  if (!membre) return

  const date = new Date(dateIso).toLocaleDateString('fr-FR')
  const text = `Reçu de paiement\nGroupe: ${groupe.nom}\nMembre: ${membre.nom}\nMontant: ${Number(groupe.montant).toLocaleString('fr-FR')} FCFA\nDate: ${date}\nMerci !`
  const encoded = encodeURIComponent(text)
  const phone = membre.telephone.replace(/\s/g, '')
  const waLink = `https://wa.me/226${phone}?text=${encoded}`

  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.innerHTML = `
    <span class="text-sm font-semibold text-green">Paiement enregistré ✓</span>
    <div class="flex gap-2">
      <button class="btn-recu-pdf btn-sm btn-secondary" style="width:auto;padding:6px 10px">PDF</button>
      <a href="${waLink}" target="_blank" rel="noopener" class="btn-sm btn-green">WhatsApp</a>
    </div>
  `
  document.body.appendChild(toast)
  const timer = setTimeout(() => toast.remove(), 6000)
  toast.querySelector('.btn-recu-pdf').addEventListener('click', async () => {
    clearTimeout(timer)
    await recuPDF({ membre, groupe, montant: groupe.montant, date: dateIso, mode, collecteur: getCollecteur() })
    toast.remove()
  })
}
