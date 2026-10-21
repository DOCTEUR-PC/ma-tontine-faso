const STORAGE_KEY = 'tontine_collecteur'
const API_BASE = import.meta.env.DEV ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || '')

export function getCollecteur() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCollecteur(collecteur) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collecteur))
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}

export function isLoggedIn() {
  return getCollecteur() !== null
}

export async function apiLogin(telephone, pin) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telephone, pin }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.detail || 'Téléphone ou PIN incorrect' }
    }
    const data = await res.json()
    return { success: true, collecteur: data }
  } catch {
    return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion.' }
  }
}

export async function apiRegister(nom, telephone, pin) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, telephone, pin }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.detail || 'Erreur lors de l\'inscription' }
    }
    const data = await res.json()
    return { success: true, collecteur: data }
  } catch {
    return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion.' }
  }
}
