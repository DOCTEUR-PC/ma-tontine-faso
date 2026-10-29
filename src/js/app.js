import { register, navigate } from './router.js'
import { setupAutoSync } from './sync.js'
import { isLoggedIn, logout } from './auth.js'
import { initTheme, toggleTheme } from './theme.js'
import { renderLogin } from './pages/login.js'
import { renderRegister } from './pages/register.js'
import { renderAccueil } from './pages/accueil.js'
import { renderGroupes } from './pages/groupes.js'
import { renderGroupeForm } from './pages/groupe-form.js'
import { renderGroupeDetail } from './pages/groupe-detail.js'
import { renderMembres } from './pages/membres.js'
import { renderMembreForm } from './pages/membre-form.js'
import { renderMembreDetail } from './pages/membre-detail.js'
import { renderTournee } from './pages/tournee.js'
import { renderCalendrier } from './pages/calendrier.js'
import { renderRapports } from './pages/rapports.js'
import { renderJournal } from './pages/journal.js'

register('login', renderLogin)
register('register', renderRegister)
register('accueil', renderAccueil)
register('groupes', renderGroupes)
register('groupe-form', renderGroupeForm)
register('groupe-detail', renderGroupeDetail)
register('membres', renderMembres)
register('membre-form', renderMembreForm)
register('membre-detail', renderMembreDetail)
register('tournee', renderTournee)
register('calendrier', renderCalendrier)
register('rapports', renderRapports)
register('journal', renderJournal)

initTheme()

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.page))
})

document.getElementById('btn-back').addEventListener('click', () => {
  window.history.length > 1 ? navigate('groupes') : navigate('accueil')
})

document.getElementById('btn-theme').addEventListener('click', toggleTheme)

document.getElementById('btn-logout').addEventListener('click', () => {
  if (confirm('Se déconnecter ?')) {
    logout()
    navigate('login')
  }
})

if (isLoggedIn()) {
  navigate('accueil')
  setupAutoSync()
} else {
  navigate('login')
}
