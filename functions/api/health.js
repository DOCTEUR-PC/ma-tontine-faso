import { json } from '../_utils.js'

export function onRequestGet() {
  return json({ status: 'ok' })
}
