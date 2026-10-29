import { json, error, hashPin } from '../../_utils.js'

export async function onRequestPost({ request, env }) {
  const { telephone, pin } = await request.json()
  if (!telephone || !pin) return error('Téléphone ou PIN incorrect', 401)

  const pinHash = await hashPin(pin)
  const row = await env.DB.prepare(
    'SELECT id, nom, telephone FROM collecteurs WHERE telephone = ? AND pin = ?'
  ).bind(telephone, pinHash).first()

  if (!row) return error('Téléphone ou PIN incorrect', 401)
  return json(row)
}
