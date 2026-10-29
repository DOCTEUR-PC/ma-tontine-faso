// Construit un lien wa.me pré-rempli pour rappeler un retardataire.
export function rappelUrl(membre, groupe, statut, collecteurNom = '') {
  const phone = (membre.telephone || '').replace(/\D/g, '')
  const parts = [
    `Bonjour ${membre.nom},`,
    `Rappel de votre cotisation pour la tontine "${groupe?.nom || ''}".`,
  ]
  if (statut?.soldeDu > 0) {
    parts.push(`Montant dû : ${statut.soldeDu.toLocaleString('fr-FR')} FCFA.`)
    if (statut.penalites > 0) {
      parts.push(`(dont ${statut.penalites.toLocaleString('fr-FR')} F de pénalités)`)
    }
  }
  parts.push('Merci de régulariser dès que possible.')
  if (collecteurNom) parts.push(`— ${collecteurNom}`)
  const text = encodeURIComponent(parts.join('\n'))
  // Numéros locaux Burkina : préfixe 226 si 8 chiffres
  const full = phone.length === 8 ? '226' + phone : phone
  return `https://wa.me/${full}?text=${text}`
}
