import { apiLogin, setCollecteur } from '../auth.js'
import { navigate } from '../router.js'
import { logAction } from '../audit.js'

const MAX_TENTATIVES = 5
const LOCK_MS = 5 * 60 * 1000
const K_FAILS = 'tontine_login_fails'
const K_LOCK = 'tontine_login_lock'

function lockRemaining() {
  try {
    const until = Number(localStorage.getItem(K_LOCK) || 0)
    return Math.max(0, until - Date.now())
  } catch { return 0 }
}

export function renderLogin(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[75vh]">
      <img src="/logo.svg" alt="Ma Tontine Faso" class="w-24 h-24 mb-4" />
      <h2 class="text-2xl font-extrabold mb-1">Ma Tontine Faso</h2>
      <p class="text-sm text-muted mb-8">Connectez-vous pour continuer</p>

      <form id="login-form" class="w-full space-y-4">
        <div>
          <label class="form-label">Téléphone</label>
          <input type="tel" name="telephone" class="input-field" placeholder="Ex: 70000000" required />
        </div>
        <div>
          <label class="form-label">Code PIN</label>
          <input type="password" name="pin" class="input-field" placeholder="4 chiffres" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" required />
        </div>
        <div id="login-error" class="hidden text-red text-sm text-center"></div>
        <button type="submit" class="btn-primary" id="btn-login">Se connecter</button>
      </form>

      <p class="mt-8 text-sm text-muted">
        Pas encore de compte ?
        <button id="btn-go-register" class="text-green font-semibold">S'inscrire</button>
      </p>
    </div>
  `

  const form = document.getElementById('login-form')
  const btn = document.getElementById('btn-login')
  const errorEl = document.getElementById('login-error')

  let lockTimer = null
  function refreshLock() {
    const rem = lockRemaining()
    if (rem > 0) {
      const min = Math.floor(rem / 60000)
      const sec = Math.ceil((rem % 60000) / 1000)
      errorEl.textContent = `Trop de tentatives. Réessayez dans ${min}:${String(sec).padStart(2, '0')}.`
      errorEl.classList.remove('hidden')
      btn.disabled = true
      btn.textContent = 'Verrouillé'
      lockTimer = setTimeout(refreshLock, 1000)
    } else {
      btn.disabled = false
      btn.textContent = 'Se connecter'
      if (lockTimer) { clearTimeout(lockTimer); lockTimer = null }
    }
  }
  refreshLock()

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (lockRemaining() > 0) { refreshLock(); return }

    btn.disabled = true
    btn.textContent = 'Connexion...'
    errorEl.classList.add('hidden')

    const result = await apiLogin(form.telephone.value.trim(), form.pin.value)

    if (result.success) {
      try { localStorage.removeItem(K_FAILS); localStorage.removeItem(K_LOCK) } catch {}
      setCollecteur(result.collecteur)
      logAction('connexion', result.collecteur?.nom || '')
      navigate('accueil')
    } else {
      let fails = Number(localStorage.getItem(K_FAILS) || 0) + 1
      try { localStorage.setItem(K_FAILS, String(fails)) } catch {}
      if (fails >= MAX_TENTATIVES) {
        try { localStorage.setItem(K_LOCK, String(Date.now() + LOCK_MS)); localStorage.removeItem(K_FAILS) } catch {}
        refreshLock()
      } else {
        const reste = MAX_TENTATIVES - fails
        errorEl.textContent = `${result.error} (${reste} tentative${reste > 1 ? 's' : ''} restante${reste > 1 ? 's' : ''})`
        errorEl.classList.remove('hidden')
        btn.disabled = false
        btn.textContent = 'Se connecter'
      }
    }
  })

  document.getElementById('btn-go-register').addEventListener('click', () => {
    navigate('register')
  })
}
