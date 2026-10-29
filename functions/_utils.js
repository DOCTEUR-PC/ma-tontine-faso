export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function error(detail, status) {
  return json({ detail }, status)
}

// Hash PIN en SHA-256 (meilleur que le stockage en clair).
export async function hashPin(pin) {
  const data = new TextEncoder().encode(String(pin))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}
