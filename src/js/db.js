import Dexie from 'dexie'

export const db = new Dexie('TontineDB')

db.version(1).stores({
  groupes: '++id, nom, collecteur_id',
  membres: '++id, groupe_id, nom, telephone, quartier',
  paiements: '++id, membre_id, groupe_id, [groupe_id+date], date, statut, sync',
  tours: '++id, groupe_id, membre_id, numero',
  collecteurs: '++id, telephone, pin'
})
