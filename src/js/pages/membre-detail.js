import { db } from '../db.js'
import { statutMembre } from '../cotisation.js'
import { compressImage } from '../photo.js'
import { rappelUrl } from '../rappel.js'
import { getCollecteur } from '../auth.js'

export function renderMembreDetail(container, params) {
  container.innerHTML = '<p class="text-muted text-center py-8">Chargement...</p>'
  loadDetail(container, params.id)
}

function avatarHtml(membre) {
  const initiales = membre.nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  if (membre.photo) {
    return `<img src="${membre.photo}" alt="" class="w-24 h-24 rounded-full object-cover mx-auto" />`
  }
  return `<div class="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl text-white mx-auto" style="background:var(--green-600)">${initiales}</div>`
}

async function loadDetail(container, membreId) {
  const membre = await db.membres.get(membreId)
  if (!membre) {
    container.innerHTML = '<p class="text-red text-center py-8">Membre introuvable</p>'
    return
  }

  const groupe = await db.groupes.get(membre.groupe_id)
  const paiements = (await db.paiements.where('membre_id').equals(membreId).toArray())
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const st = statutMembre(membre, groupe, paiements)
  const rappel = rappelUrl(membre, groupe, st, getCollecteur()?.nom)

  container.innerHTML = `
    <div class="card text-center mb-4">
      <div class="relative inline-block mb-3">
        ${avatarHtml(membre)}
        <button id="btn-photo" class="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md" style="background:var(--green-600);border:2px solid var(--bg-card)" aria-label="Changer la photo">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </button>
        <input id="photo-input" type="file" accept="image/*" capture="environment" class="hidden" />
      </div>
      <h2 class="text-xl font-bold">${membre.nom}</h2>
      <p class="text-sm text-muted mt-1">${membre.quartier} · ${membre.telephone}</p>
      <div class="flex items-center justify-center gap-2 mt-2">
        ${groupe ? `<span class="badge badge-paid">${groupe.nom}</span>` : ''}
        <span class="badge ${st.aJour ? 'badge-paid' : 'badge-late'}">${st.aJour ? 'À jour' : st.retards + ' retard' + (st.retards > 1 ? 's' : '')}</span>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-4">
      <div class="stat-card">
        <p class="stat-value text-green">${st.totalPaye >= 1000 ? (st.totalPaye / 1000).toFixed(st.totalPaye % 1000 ? 1 : 0) + 'k' : st.totalPaye}</p>
        <p class="stat-label">Total payé</p>
      </div>
      <div class="stat-card">
        <p class="stat-value" style="color:var(--text-primary)">${st.payees}</p>
        <p class="stat-label">Paiements</p>
      </div>
      <div class="stat-card">
        <p class="stat-value ${st.retards > 0 ? 'text-red' : 'text-muted'}">${st.retards}</p>
        <p class="stat-label">Retards</p>
      </div>
    </div>

    ${st.soldeDu > 0 ? `
      <div class="card mb-4" style="background:var(--red-50);border-color:var(--red-400)">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-red">Solde dû</p>
            <p class="text-lg font-extrabold text-red mt-0.5">${st.soldeDu.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <a href="${rappel}" target="_blank" rel="noopener" class="btn-sm btn-green">Rappel WhatsApp</a>
        </div>
        ${st.penalites > 0 ? `<p class="text-xs text-red mt-2" style="opacity:.85">Dont ${st.penalites.toLocaleString('fr-FR')} F de pénalités (${st.retards} × ${(groupe.penalite).toLocaleString('fr-FR')} F)</p>` : ''}
      </div>
    ` : ''}

    <p class="section-title">Historique des paiements</p>
    <div class="space-y-2">
      ${paiements.length === 0
        ? '<p class="text-muted text-center py-6 text-sm">Aucun paiement enregistré</p>'
        : paiements.map(p => {
            const date = new Date(p.date).toLocaleDateString('fr-FR')
            const mode = p.mode === 'orange_money' ? 'Orange Money' : 'Espèce'
            return `
              <div class="card flex justify-between items-center py-3">
                <div>
                  <p class="text-sm font-medium">${date}</p>
                  <p class="text-xs text-muted">${mode}</p>
                </div>
                <span class="font-bold text-green">${Number(p.montant).toLocaleString('fr-FR')} F</span>
              </div>
            `
          }).join('')
      }
    </div>
  `

  const input = container.querySelector('#photo-input')
  container.querySelector('#btn-photo').addEventListener('click', () => input.click())
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const dataUrl = await compressImage(file)
      await db.membres.update(membreId, { photo: dataUrl })
      loadDetail(container, membreId)
    } catch {
      alert('Impossible de charger cette image.')
    }
  })
}
