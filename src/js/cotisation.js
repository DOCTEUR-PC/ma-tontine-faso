// Calcule le statut de cotisation d'un membre : périodes attendues, payées, retards, solde dû.

function periodsBetween(from, to, frequence) {
  const ms = to - from
  if (ms < 0) return 0
  const day = 86400000
  if (frequence === 'jour') return Math.floor(ms / day)
  if (frequence === 'semaine') return Math.floor(ms / (day * 7))
  // mois : différence de mois calendaires
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

export function statutMembre(membre, groupe, paiements) {
  const now = new Date()
  const join = new Date(membre.date_adhesion || groupe?.date_creation || paiements[0]?.date || now)
  const freq = groupe?.frequence || 'jour'

  // Nombre de périodes écoulées depuis l'adhésion (inclus la période courante)
  const attendues = periodsBetween(join, now, freq) + 1
  const payees = paiements.length
  const retards = Math.max(0, attendues - payees)
  const montant = groupe?.montant || 0
  const penaliteUnit = groupe?.penalite || 0
  const penalites = retards * penaliteUnit
  const soldeDu = retards * montant + penalites
  const totalPaye = paiements.reduce((s, p) => s + p.montant, 0)

  return { attendues, payees, retards, penalites, soldeDu, totalPaye, aJour: retards === 0 }
}
