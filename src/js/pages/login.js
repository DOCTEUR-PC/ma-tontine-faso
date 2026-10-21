import { apiLogin, setCollecteur } from '../auth.js'
import { navigate } from '../router.js'

export function renderLogin(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[70vh]">
      <div class="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mb-4">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h2 class="text-xl font-bold mb-1">Ma Tontine Faso</h2>
      <p class="text-sm text-gray-500 mb-6">Connectez-vous pour continuer</p>

      <form id="login-form" class="w-full space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input type="tel" name="telephone" class="input-field" placeholder="Ex: 70000000" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Code PIN</label>
          <input type="password" name="pin" class="input-field" placeholder="4 chiffres" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" required />
        </div>
        <div id="login-error" class="hidden text-red-600 text-sm text-center"></div>
        <button type="submit" class="btn-primary" id="btn-login">Se connecter</button>
      </form>

      <p class="mt-6 text-sm text-gray-500">
        Pas encore de compte ?
        <button id="btn-go-register" class="text-green-600 font-semibold">S'inscrire</button>
      </p>
    </div>
  `

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target
    const btn = document.getElementById('btn-login')
    const errorEl = document.getElementById('login-error')

    btn.disabled = true
    btn.textContent = 'Connexion...'
    errorEl.classList.add('hidden')

    const result = await apiLogin(form.telephone.value.trim(), form.pin.value)

    if (result.success) {
      setCollecteur(result.collecteur)
      navigate('groupes')
    } else {
      errorEl.textContent = result.error
      errorEl.classList.remove('hidden')
      btn.disabled = false
      btn.textContent = 'Se connecter'
    }
  })

  document.getElementById('btn-go-register').addEventListener('click', () => {
    navigate('register')
  })
}
