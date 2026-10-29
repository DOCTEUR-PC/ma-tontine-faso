import { apiRegister, setCollecteur } from '../auth.js'
import { navigate } from '../router.js'

export function renderRegister(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[75vh]">
      <img src="/logo.svg" alt="Ma Tontine Faso" class="w-20 h-20 mb-3" />
      <h2 class="text-2xl font-extrabold mb-1">Créer un compte</h2>
      <p class="text-sm text-muted mb-6">Inscription collecteur</p>

      <form id="register-form" class="w-full space-y-4">
        <div>
          <label class="form-label">Nom complet</label>
          <input type="text" name="nom" class="input-field" placeholder="Ex: Amadou Traoré" required />
        </div>
        <div>
          <label class="form-label">Téléphone</label>
          <input type="tel" name="telephone" class="input-field" placeholder="Ex: 70000000" required />
        </div>
        <div>
          <label class="form-label">Choisir un code PIN</label>
          <input type="password" name="pin" class="input-field" placeholder="4 chiffres" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" required />
        </div>
        <div>
          <label class="form-label">Confirmer le PIN</label>
          <input type="password" name="pin_confirm" class="input-field" placeholder="4 chiffres" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" required />
        </div>
        <div id="register-error" class="hidden text-red text-sm text-center"></div>
        <button type="submit" class="btn-primary" id="btn-register">S'inscrire</button>
      </form>

      <p class="mt-6 text-sm text-muted">
        Déjà un compte ?
        <button id="btn-go-login" class="text-green font-semibold">Se connecter</button>
      </p>
    </div>
  `

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target
    const btn = document.getElementById('btn-register')
    const errorEl = document.getElementById('register-error')

    errorEl.classList.add('hidden')

    if (form.pin.value !== form.pin_confirm.value) {
      errorEl.textContent = 'Les codes PIN ne correspondent pas'
      errorEl.classList.remove('hidden')
      return
    }

    if (form.pin.value.length !== 4) {
      errorEl.textContent = 'Le code PIN doit contenir 4 chiffres'
      errorEl.classList.remove('hidden')
      return
    }

    btn.disabled = true
    btn.textContent = 'Inscription...'

    const result = await apiRegister(
      form.nom.value.trim(),
      form.telephone.value.trim(),
      form.pin.value
    )

    if (result.success) {
      setCollecteur(result.collecteur)
      navigate('accueil')
    } else {
      errorEl.textContent = result.error
      errorEl.classList.remove('hidden')
      btn.disabled = false
      btn.textContent = "S'inscrire"
    }
  })

  document.getElementById('btn-go-login').addEventListener('click', () => {
    navigate('login')
  })
}
