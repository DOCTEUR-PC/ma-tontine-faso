import { json, error, hashPin } from '../../_utils.js'

export async function onRequestPost({ request, env }) {
  const { nom, telephone, pin } = await request.json()
  if (!nom || !telephone || !pin) return error('Champs manquants', 400)

  const existing = await env.DB.prepare('SELECT id FROM collecteurs WHERE telephone = ?')
    .bind(telephone).first()
  if (existing) return error('Ce numéro est déjà enregistré', 400)

  const pinHash = await hashPin(pin)
  const row = await env.DB.prepare(
    'INSERT INTO collecteurs (nom, telephone, pin) VALUES (?, ?, ?) RETURNING id, nom, telephone'
  ).bind(nom, telephone, pinHash).first()

  return json(row, 201)
}
