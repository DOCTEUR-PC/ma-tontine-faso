import { db } from './db.js'
import { getCollecteur } from './auth.js'

// Enregistre une action dans le journal local. Jamais bloquant.
export async function logAction(action, details = '') {
  try {
    const c = getCollecteur()
    await db.audit_log.add({
      date: new Date().toISOString(),
      action,
      details,
      collecteur_id: c?.id ?? null,
      collecteur_nom: c?.nom ?? '',
      sync: 0,
    })
  } catch {
    // le journal ne doit jamais interrompre l'action principale
  }
}

export const ACTIONS = {
  paiement: { label: 'Paiement encaissé', icon: 'cash', color: 'green' },
  membre_ajoute: { label: 'Membre ajouté', icon: 'user', color: 'green' },
  membre_supprime: { label: 'Membre supprimé', icon: 'user', color: 'red' },
  groupe_cree: { label: 'Groupe créé', icon: 'group', color: 'green' },
  groupe_modifie: { label: 'Groupe modifié', icon: 'group', color: 'yellow' },
  groupe_supprime: { label: 'Groupe supprimé', icon: 'group', color: 'red' },
  levee: { label: 'Tour levé', icon: 'check', color: 'green' },
  levee_annulee: { label: 'Levée annulée', icon: 'check', color: 'yellow' },
  connexion: { label: 'Connexion', icon: 'lock', color: 'green' },
}
