import { db } from '../db.js'
import { navigate } from '../router.js'
import { getCollecteur } from '../auth.js'
import { barChart, aggregate } from '../charts.js'

let allPaiements = []

export function renderAccueil(container) {
  const collecteur = getCollecteur()
  container.innerHTML = `
    <div class="mb-5">
      <p class="text-secondary text-sm">Bonjour,</p>
      <h2 class="text-xl font-bold">${collecteur?.nom || 'Collecteur'}</h2>
    </div>
    <div id="accueil-stats"></div>
  `
  loadStats()
}

async function loadStats() {
  const wrap = document.getElementById('accueil-stats')
  const collecteur = getCollecteur()
  const groupes = await db.groupes.where('collecteur_id').equals(collecteur.id).toArray()
  const groupeIds = new Set(groupes.map(g => g.id))

  const allMembres = (await db.membres.toArray()).filter(m => groupeIds.has(m.groupe_id))
  allPaiements = (await db.paiements.toArray()).filter(p => groupeIds.has(p.groupe_id))

  const today = new Date().toISOString().slice(0, 10)
  const paidToday = new Set(allPaiements.filter(p => p.date.slice(0, 10) === today).map(p => p.membre_id))
  const totalCollecte = allPaiements.reduce((s, p) => s + p.montant, 0)
  const retards = allMembres.length - paidToday.size

  // Commission collecteur = somme, par groupe, de (collecté du groupe × son %)
  const commissionTotale = groupes.reduce((sum, g) => {
    const collecteG = allPaiements.filter(p => p.groupe_id === g.id).reduce((s, p) => s + p.montant, 0)
    return sum + collecteG * (g.commission || 0) / 100
  }, 0)

  if (groupes.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <p class="empty-title">Bienvenue !</p>
        <p class="empty-desc mb-4">Créez votre premier groupe de tontine pour commencer.</p>
        <button id="btn-first-groupe" class="btn-primary" style="max-width:240px;margin:0 auto;">+ Créer un groupe</button>
      </div>
    `
    document.getElementById('btn-first-groupe').addEventListener('click', () => navigate('groupe-form'))
    return
  }

  wrap.innerHTML = `
    <div class="card mb-4" style="background:linear-gradient(135deg,#059669,#047857);border:none;color:white;">
      <p class="text-xs font-semibold uppercase tracking-wide" style="color:rgba(255,255,255,0.8)">Total collecté</p>
      <p class="text-3xl font-extrabold mt-1">${totalCollecte.toLocaleString('fr-FR')} <span class="text-lg font-semibold">FCFA</span></p>
      ${commissionTotale > 0 ? `<p class="text-sm mt-2 pt-2" style="color:rgba(255,255,255,0.9);border-top:1px solid rgba(255,255,255,0.2)">Votre commission : <span class="font-bold">${Math.round(commissionTotale).toLocaleString('fr-FR')} F</span></p>` : ''}
    </div>

    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="stat-card">
        <p class="stat-value text-green">${groupes.length}</p>
        <p class="stat-label">Groupes</p>
      </div>
      <div class="stat-card">
        <p class="stat-value" style="color:var(--text-primary)">${paidToday.size}</p>
        <p class="stat-label">Payés</p>
      </div>
      <div class="stat-card">
        <p class="stat-value ${retards > 0 ? 'text-red' : 'text-muted'}">${retards}</p>
        <p class="stat-label">Retards</p>
      </div>
    </div>

    <div class="card mb-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-sm">Collectes</h3>
        <div class="period-switch flex gap-1 p-1 rounded-lg" style="background:var(--bg-primary)">
          <button class="period-btn active" data-period="jour">Jour</button>
          <button class="period-btn" data-period="semaine">Semaine</button>
          <button class="period-btn" data-period="mois">Mois</button>
        </div>
      </div>
      <div id="chart-area">${barChart(aggregate(allPaiements, 'jour'))}</div>
    </div>

    <p class="section-title">Mes groupes</p>
    <div class="space-y-3" id="accueil-groupes"></div>

    <button id="btn-journal" class="btn-secondary mt-5 flex items-center justify-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      Journal d'activité
    </button>
  `

  wrap.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      document.getElementById('chart-area').innerHTML = barChart(aggregate(allPaiements, btn.dataset.period))
    })
  })

  const list = document.getElementById('accueil-groupes')
  const items = await Promise.all(groupes.map(async g => {
    const count = await db.membres.where('groupe_id').equals(g.id).count()
    const freq = { jour: 'Journalier', semaine: 'Hebdo', mois: 'Mensuel' }[g.frequence] || g.frequence
    return `
      <div class="card card-interactive groupe-card" data-id="${g.id}">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-bold">${g.nom}</h3>
            <p class="text-sm text-muted mt-0.5">${freq} · ${count} membre${count > 1 ? 's' : ''}</p>
          </div>
          <span class="font-bold text-green">${Number(g.montant).toLocaleString('fr-FR')} F</span>
        </div>
      </div>
    `
  }))
  list.innerHTML = items.join('')
  list.querySelectorAll('.groupe-card').forEach(card => {
    card.addEventListener('click', () => navigate('groupe-detail', { id: Number(card.dataset.id) }))
  })

  const btnJournal = document.getElementById('btn-journal')
  if (btnJournal) btnJournal.addEventListener('click', () => navigate('journal'))
}
