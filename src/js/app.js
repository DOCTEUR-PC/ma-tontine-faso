import { register, navigate } from './router.js'
import { setupAutoSync } from './sync.js'
import { isLoggedIn, logout, getCollecteur } from './auth.js'
import { renderLogin } from './pages/login.js'
import { renderRegister } from './pages/register.js'
import { renderGroupes } from './pages/groupes.js'
import { renderGroupeForm } from './pages/groupe-form.js'
import { renderGroupeDetail } from './pages/groupe-detail.js'
import { renderMembreForm } from './pages/membre-form.js'
import { renderTournee } from './pages/tournee.js'
import { renderDashboard } from './pages/dashboard.js'

register('login', renderLogin)
register('register', renderRegister)
register('groupes', renderGroupes)
register('groupe-form', renderGroupeForm)
register('groupe-detail', renderGroupeDetail)
register('membre-form', renderMembreForm)
register('tournee', renderTournee)
register('dashboard', renderDashboard)

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.page))
})

document.getElementById('btn-back').addEventListener('click', () => {
  navigate('groupes')
})

document.getElementById('btn-logout').addEventListener('click', () => {
  logout()
  navigate('login')
})

if (isLoggedIn()) {
  navigate('groupes')
  setupAutoSync()
} else {
  navigate('login')
}
