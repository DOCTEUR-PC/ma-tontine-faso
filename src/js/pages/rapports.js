import { db } from '../db.js'
import { getCollecteur } from '../auth.js'
import { statutMembre } from '../cotisation.js'
import { rapportPDF } from '../pdf.js'
import { rapportExcel } from '../excel.js'

const state = { groupeId: 0, periode: 'tout' }
const PERIODES = { tout: 'Depuis le début', mois: 'Ce mois-ci', semaine: '7 derniers jours' }

export function renderRapports(container) {
  container.innerHTML = `
    <div class="space-y-3 mb-4">
      <div>
        <label class="form-label">Groupe</label>
        <select id="rap-groupe" class="input-field"><option value="0">Tous les groupes</option></select>
      </div>
      <div>
        <label class="form-label">Période</label>
        <select id="rap-periode" class="input-field">
          <option value="tout">Depuis le début</option>
          <option value="mois">Ce mois-ci</option>
          <option value="semaine">7 derniers jours</option>
        </select>
      </div>
    </div>
    <div id="rap-content"></div>
  `
  initSelectors()
}

async function initSelectors() {
  const collecteur = getCollecteur()
  const groupes = await db.groupes.where('collecteur_id').equals(collecteur.id).toArray()
  const sel = document.getElementById('rap-groupe')
  groupes.forEach(g => {
    const o = document.createElement('option')
    o.value = g.id; o.textContent = g.nom
    sel.appendChild(o)
  })
  sel.value = String(state.groupeId)
  document.getElementById('rap-periode').value = state.periode

  sel.addEventListener('change', e => { state.groupeId = Number(e.target.value); loadRapport() })
  document.getElementById('rap-periode').addEventListener('change', e => { state.periode = e.target.value; loadRapport() })
  loadRapport()
}

function periodeStart(periode) {
  const now = new Date()
  if (periode === 'mois') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (periode === 'semaine') { const d = new Date(now); d.setDate(now.getDate() - 7); return d }
  return null
}

async function buildData() {
  const collecteur = getCollecteur()
  let groupes = await db.groupes.where('collecteur_id').equals(collecteur.id).toArray()
  if (state.groupeId) groupes = groupes.filter(g => g.id === state.groupeId)
  const groupesById = Object.fromEntries(groupes.map(g => [g.id, g]))
  const groupeIds = new Set(groupes.map(g => g.id))

  const membres = (await db.membres.toArray()).filter(m => groupeIds.has(m.groupe_id))
  const start = periodeStart(state.periode)

  const rows = []
  const totals = { totalCollecte: 0, commission: 0, retards: 0, soldeDu: 0 }

  for (const m of membres) {
    const g = groupesById[m.groupe_id]
    const allPaiements = await db.paiements.where('membre_id').equals(m.id).toArray()
    const periodPaiements = start ? allPaiements.filter(p => new Date(p.date) >= start) : allPaiements
    const st = statutMembre(m, g, allPaiements)
    const totalPaye = periodPaiements.reduce((s, p) => s + p.montant, 0)

    rows.push({
      nom: m.nom, groupe: g?.nom || '', quartier: m.quartier, telephone: m.telephone,
      payees: periodPaiements.length, totalPaye, retards: st.retards, soldeDu: st.soldeDu,
    })
    totals.totalCollecte += totalPaye
    totals.commission += totalPaye * (g?.commission || 0) / 100
    totals.retards += st.retards
    totals.soldeDu += st.soldeDu
  }

  rows.sort((a, b) => b.totalPaye - a.totalPaye)
  return { rows, totals, groupe: state.groupeId ? groupesById[state.groupeId] : null, collecteur }
}

async function loadRapport() {
  const content = document.getElementById('rap-content')
  content.innerHTML = '<p class="text-muted text-center py-6">Calcul...</p>'
  const { rows, totals, groupe, collecteur } = await buildData()
  const periodeLabel = PERIODES[state.periode]

  if (rows.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="empty-title">Aucune donnée</p>
        <p class="empty-desc">Ajoutez des membres et des paiements pour générer un rapport.</p>
      </div>
    `
    return
  }

  content.innerHTML = `
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div class="stat-card"><p class="stat-value text-green">${(totals.totalCollecte / 1000).toFixed(totals.totalCollecte % 1000 ? 1 : 0)}k</p><p class="stat-label">Collecté</p></div>
      <div class="stat-card"><p class="stat-value" style="color:var(--text-primary)">${Math.round(totals.commission).toLocaleString('fr-FR')}</p><p class="stat-label">Commission (F)</p></div>
      <div class="stat-card"><p class="stat-value ${totals.retards ? 'text-red' : 'text-muted'}">${totals.retards}</p><p class="stat-label">Retards</p></div>
      <div class="stat-card"><p class="stat-value ${totals.soldeDu ? 'text-red' : 'text-muted'}">${(totals.soldeDu / 1000).toFixed(totals.soldeDu % 1000 ? 1 : 0)}k</p><p class="stat-label">Solde dû (F)</p></div>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-4">
      <button id="btn-pdf" class="btn-primary flex items-center justify-center gap-2" style="padding:12px">Export PDF</button>
      <button id="btn-excel" class="btn-secondary flex items-center justify-center gap-2" style="padding:12px">Export Excel</button>
    </div>

    <p class="section-title">${groupe ? groupe.nom : 'Tous les groupes'} · ${periodeLabel}</p>
    <div class="space-y-2">
      ${rows.map(r => `
        <div class="card flex justify-between items-center py-2.5">
          <div class="min-w-0">
            <p class="font-semibold truncate">${r.nom}</p>
            <p class="text-xs text-muted truncate">${r.groupe} · ${r.payees} paiement${r.payees > 1 ? 's' : ''}${r.retards ? ` · <span class="text-red">${r.retards} retard${r.retards > 1 ? 's' : ''}</span>` : ''}</p>
          </div>
          <span class="font-bold text-green flex-shrink-0">${r.totalPaye.toLocaleString('fr-FR')} F</span>
        </div>
      `).join('')}
    </div>
  `

  document.getElementById('btn-pdf').addEventListener('click', async (e) => {
    const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Génération...'
    try { await rapportPDF({ groupe, collecteur, rows, totals, periodeLabel }) }
    finally { btn.disabled = false; btn.textContent = 'Export PDF' }
  })
  document.getElementById('btn-excel').addEventListener('click', async (e) => {
    const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Génération...'
    try { await rapportExcel({ groupe, rows, totals, periodeLabel }) }
    finally { btn.disabled = false; btn.textContent = 'Export Excel' }
  })
}
