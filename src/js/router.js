import { isLoggedIn } from './auth.js'

const routes = {}
let currentPage = null
const publicPages = ['login', 'register']

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
  groupes: 'Mes Groupes',
  tournee: 'Tournée',
  dashboard: 'Tableau de bord',
  'groupe-detail': 'Groupe',
  'groupe-form': 'Nouveau groupe',
  'membre-form': 'Nouveau membre',
  login: 'Connexion',
  register: 'Inscription',
}

function updateHeader(name, params) {
  const titleEl = document.getElementById('page-title')
  const backBtn = document.getElementById('btn-back')
  const subPages = ['groupe-detail', 'groupe-form', 'membre-form']

  titleEl.textContent = params?.title || titles[name] || 'Tontine'
  backBtn.classList.toggle('hidden', !subPages.includes(name))
}

function updateShell(name) {
  const isAuth = publicPages.includes(name)
  document.getElementById('bottom-nav').classList.toggle('hidden', isAuth)
  document.querySelector('header').classList.toggle('hidden', isAuth)
}

export function getCurrentPage() { return currentPage }
