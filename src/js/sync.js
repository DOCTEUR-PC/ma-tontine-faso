import { db } from './db.js'
import { getCollecteur } from './auth.js'

const API_BASE = import.meta.env.DEV ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || '')

export async function isOnline() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

export async function syncPush() {
  const online = await isOnline()
  if (!online) return { success: false, reason: 'offline' }

  const unsyncedPaiements = await db.paiements.where('sync').equals(0).toArray()
  if (unsyncedPaiements.length === 0) return { success: true, reason: 'nothing_to_sync' }

  const collecteur = getCollecteur()
  const groupes = await db.groupes.where('collecteur_id').equals(collecteur.id).toArray()
  const groupeIds = new Set(groupes.map(g => g.id))
  const membres = (await db.membres.toArray()).filter(m => groupeIds.has(m.groupe_id))

  const payload = {
    groupes: groupes.map(g => ({
      nom: g.nom,
      montant: g.montant,
      frequence: g.frequence,
      client_id: g.id,
      collecteur_id: g.collecteur_id || null,
    })),
    membres: membres.map(m => ({
      nom: m.nom,
      telephone: m.telephone,
      quartier: m.quartier,
      groupe_id: m.groupe_id,
      client_id: m.id,
    })),
    paiements: unsyncedPaiements.map(p => ({
      membre_id: p.membre_id,
      groupe_id: p.groupe_id,
      montant: p.montant,
      date: p.date,
      mode: p.mode,
      statut: p.statut,
      client_id: p.id,
    })),
  }

  try {
    const res = await fetch(`${API_BASE}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) return { success: false, reason: 'server_error' }

    const data = await res.json()

    await db.paiements.where('sync').equals(0).modify({ sync: 1 })

    return { success: true, data }
  } catch {
    return { success: false, reason: 'network_error' }
  }
}

export async function syncPull() {
  const online = await isOnline()
  if (!online) return { success: false, reason: 'offline' }

  try {
    const collecteur = getCollecteur()
    const res = await fetch(`${API_BASE}/api/sync/pull?collecteur_id=${collecteur.id}`)
    if (!res.ok) return { success: false, reason: 'server_error' }

    const data = await res.json()
    return { success: true, data }
  } catch {
    return { success: false, reason: 'network_error' }
  }
}

export function setupAutoSync(intervalMs = 30000) {
  async function trySync() {
    const indicator = document.getElementById('sync-status')
    if (!indicator) return

    const online = await isOnline()
    if (!online) {
      indicator.textContent = 'Hors ligne'
      indicator.className = 'text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600'
      return
    }

    indicator.textContent = 'Sync...'
    indicator.className = 'text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600'

    const result = await syncPush()
    if (result.success) {
      indicator.textContent = 'En ligne'
      indicator.className = 'text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600'
    } else {
      indicator.textContent = 'Erreur sync'
      indicator.className = 'text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600'
    }
  }

  trySync()
  setInterval(trySync, intervalMs)

  window.addEventListener('online', trySync)
}
