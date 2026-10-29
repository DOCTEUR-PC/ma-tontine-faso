import { json } from '../../_utils.js'

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const collecteurId = url.searchParams.get('collecteur_id')
  const db = env.DB

  if (!collecteurId) {
    return json({ groupes: [], membres: [], paiements: [] })
  }

  const groupes = (await db.prepare('SELECT * FROM groupes WHERE collecteur_id = ?').bind(collecteurId).all()).results
  const membres = (await db.prepare('SELECT * FROM membres WHERE collecteur_id = ?').bind(collecteurId).all()).results
  const paiements = (await db.prepare('SELECT * FROM paiements WHERE collecteur_id = ?').bind(collecteurId).all()).results

  return json({ groupes, membres, paiements })
}
