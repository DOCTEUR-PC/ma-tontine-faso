// Graphiques SVG purs, sans librairie. Thème via variables CSS.

const money = (n) => Number(n).toLocaleString('fr-FR')

function niceCeil(value) {
  if (value <= 0) return 100
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const n = value / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

// data: [{ label, value }]
export function barChart(data, { height = 160 } = {}) {
  const n = data.length
  if (n === 0) return '<p class="text-muted text-center text-sm py-6">Aucune donnée</p>'

  const W = 320
  const H = height
  const padBottom = 24
  const padTop = 12
  const chartH = H - padBottom - padTop
  const max = niceCeil(Math.max(...data.map(d => d.value), 1))
  const slot = W / n
  const barW = Math.min(slot * 0.55, 36)
  const maxIndex = data.reduce((best, d, i) => d.value > data[best].value ? i : best, 0)

  const bars = data.map((d, i) => {
    const h = max > 0 ? (d.value / max) * chartH : 0
    const x = i * slot + (slot - barW) / 2
    const y = padTop + (chartH - h)
    const isMax = i === maxIndex && d.value > 0
    const fill = isMax ? 'var(--green-600)' : 'var(--green-500)'
    const opacity = d.value > 0 ? 1 : 0.25
    const valLabel = d.value > 0
      ? `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-secondary)">${d.value >= 1000 ? (d.value / 1000).toFixed(d.value % 1000 === 0 ? 0 : 1) + 'k' : d.value}</text>`
      : ''
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${Math.max(h, 2)}" rx="4" fill="${fill}" opacity="${opacity}"/>
      ${valLabel}
      <text x="${x + barW / 2}" y="${H - 8}" text-anchor="middle" font-size="9" fill="var(--text-muted)">${d.label}</text>
    `
  }).join('')

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" style="display:block">
      <line x1="0" y1="${padTop + chartH}" x2="${W}" y2="${padTop + chartH}" stroke="var(--border-color)" stroke-width="1"/>
      ${bars}
    </svg>
  `
}

// Agrège les paiements en séries temporelles selon la période.
export function aggregate(paiements, period) {
  const now = new Date()
  const buckets = []

  if (period === 'jour') {
    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      buckets.push({ key: d.toISOString().slice(0, 10), label: jours[d.getDay()], value: 0 })
    }
    const map = Object.fromEntries(buckets.map(b => [b.key, b]))
    paiements.forEach(p => {
      const k = new Date(p.date).toISOString().slice(0, 10)
      if (map[k]) map[k].value += p.montant
    })
  } else if (period === 'semaine') {
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i * 7)
      const { year, week } = isoWeek(d)
      buckets.push({ key: `${year}-W${week}`, label: 'S' + week, value: 0 })
    }
    const map = Object.fromEntries(buckets.map(b => [b.key, b]))
    paiements.forEach(p => {
      const { year, week } = isoWeek(new Date(p.date))
      const k = `${year}-W${week}`
      if (map[k]) map[k].value += p.montant
    })
  } else {
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: mois[d.getMonth()], value: 0 })
    }
    const map = Object.fromEntries(buckets.map(b => [b.key, b]))
    paiements.forEach(p => {
      const d = new Date(p.date)
      const k = `${d.getFullYear()}-${d.getMonth()}`
      if (map[k]) map[k].value += p.montant
    })
  }

  return buckets.map(b => ({ label: b.label, value: b.value }))
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return { year: d.getUTCFullYear(), week }
}

export { money }
