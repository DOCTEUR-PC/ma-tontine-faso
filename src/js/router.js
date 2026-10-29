import { isLoggedIn } from './auth.js'

const routes = {}
let currentPage = null
const publicPages = ['login', 'register']
const navPages = ['accueil', 'groupes', 'tournee', 'membres', 'rapports']

export function register(name, renderFn) {
  routes[name] = renderFn
}

export function navigate(name, params = {}) {
  if (!publicPages.includes(name) && !isLoggedIn()) {
    name = 'login'
    params = {}
  }

  const app = document.getElementById('app')
  const renderFn = routes[name]
  if (!renderFn) return

  currentPage = name
  app.innerHTML = ''
  app.classList.remove('page-enter')
  void app.offsetWidth
  app.classList.add('page-enter')
  renderFn(app, params)
  updateNav(name)
  updateHeader(name, params)
  updateShell(name)
  window.scrollTo(0, 0)
}

function updateNav(name) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === name)
  })
}

const titles = {
  accueil: 'Ma Tontine Faso',
  groupes: 'Mes Groupes',
  tournee: 'Tournée',
  membres: 'Membres',
  rapports: 'Rapports',
  'groupe-detail': 'Groupe',
  'groupe-form': 'Nouveau groupe',
  'membre-form': 'Nouveau membre',
  'membre-detail': 'Fiche membre',
  calendrier: 'Calendrier des tours',
  journal: 'Journal d\'activité',
  login: 'Connexion',
  register: 'Inscription',
}

function updateHeader(name, params) {
  const titleEl = document.getElementById('page-title')
  const backBtn = document.getElementById('btn-back')
  const brand = document.getElementById('header-brand')
  const logo = brand.querySelector('img')
  const subPages = ['groupe-detail', 'groupe-form', 'membre-form', 'membre-detail', 'calendrier', 'journal']
  const isSub = subPages.includes(name)

  titleEl.textContent = params?.title || titles[name] || 'Tontine'
  backBtn.classList.toggle('hidden', !isSub)
  // Logo visible seulement sur l'accueil
  logo.classList.toggle('hidden', name !== 'accueil')
}

function updateShell(name) {
  const isAuth = publicPages.includes(name)
  document.getElementById('bottom-nav').classList.toggle('hidden', isAuth)
  document.querySelector('.app-header').classList.toggle('hidden', isAuth)
}

export function getCurrentPage() { return currentPage }
