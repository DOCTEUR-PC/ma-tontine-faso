import { db } from './db.js'

export function addPeriods(date, n, freq) {
  const d = new Date(date)
  if (freq === 'jour') d.setDate(d.getDate() + n)
  else if (freq === 'semaine') d.setDate(d.getDate() + n * 7)
  else d.setMonth(d.getMonth() + n)
  return d
}

// Garantit qu'un tour existe pour chaque membre du groupe. Ajoute les nouveaux à la fin.
export async function ensureTours(groupeId) {
  const membres = await db.membres.where('groupe_id').equals(groupeId).toArray()
  let tours = await db.tours.where('groupe_id').equals(groupeId).toArray()

  const membreIds = new Set(membres.map(m => m.id))
  // Retirer les tours de membres supprimés
  const orphans = tours.filter(t => !membreIds.has(t.membre_id))
  for (const o of orphans) await db.tours.delete(o.id)
  tours = tours.filter(t => membreIds.has(t.membre_id))

  // Ajouter les membres sans tour
  const covered = new Set(tours.map(t => t.membre_id))
  let maxNum = tours.reduce((max, t) => Math.max(max, t.numero), 0)
  for (const m of membres) {
    if (!covered.has(m.id)) {
      maxNum++
      const id = await db.tours.add({ groupe_id: groupeId, membre_id: m.id, numero: maxNum, leve: 0, date_levee: null })
      tours.push({ id, groupe_id: groupeId, membre_id: m.id, numero: maxNum, leve: 0, date_levee: null })
    }
  }

  return tours.sort((a, b) => a.numero - b.numero)
}

export async function swapTours(tourA, tourB) {
  await db.tours.update(tourA.id, { numero: tourB.numero })
  await db.tours.update(tourB.id, { numero: tourA.numero })
}

export async function toggleLevee(tour) {
  const leve = tour.leve ? 0 : 1
  await db.tours.update(tour.id, { leve, date_levee: leve ? new Date().toISOString() : null })
}
