// Génération de PDF côté client. jsPDF chargé dynamiquement (hors bundle initial).

const GREEN = [5, 150, 105]
const DARK = [15, 23, 42]

let logoCache = null
async function loadLogo() {
  if (logoCache !== null) return logoCache
  try {
    const res = await fetch('/icons/icon-192.png')
    const blob = await res.blob()
    logoCache = await new Promise((resolve) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = () => resolve(null)
      r.readAsDataURL(blob)
    })
  } catch {
    logoCache = null
  }
  return logoCache
}

async function newDoc() {
  const { jsPDF } = await import('jspdf')
  return new jsPDF({ unit: 'mm', format: 'a4' })
}

async function header(doc, sousTitre) {
  const logo = await loadLogo()
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, 210, 30, 'F')
  if (logo) doc.addImage(logo, 'PNG', 12, 6, 18, 18)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Ma Tontine Faso', logo ? 34 : 12, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(sousTitre, logo ? 34 : 12, 22)
  doc.setTextColor(...DARK)
}

function money(n) {
  return Number(n).toLocaleString('fr-FR') + ' FCFA'
}

export async function recuPDF({ membre, groupe, montant, date, mode, collecteur }) {
  const doc = await newDoc()
  await header(doc, 'Reçu de cotisation')

  const d = new Date(date)
  const numero = 'REC-' + d.getTime().toString().slice(-8)
  const modeLabel = mode === 'orange_money' ? 'Orange Money' : 'Espèce'

  doc.setFontSize(11)
  let y = 45
  doc.setFont('helvetica', 'bold')
  doc.text('Reçu N° ' + numero, 12, y)
  doc.setFont('helvetica', 'normal')
  doc.text(d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), 198, y, { align: 'right' })

  y += 12
  const lignes = [
    ['Membre', membre.nom],
    ['Téléphone', membre.telephone || '—'],
    ['Groupe', groupe?.nom || '—'],
    ['Mode de paiement', modeLabel],
    ['Collecteur', collecteur?.nom || '—'],
  ]
  doc.setDrawColor(226, 232, 240)
  lignes.forEach(([k, v]) => {
    doc.setTextColor(100, 116, 139)
    doc.text(k, 12, y)
    doc.setTextColor(...DARK)
    doc.setFont('helvetica', 'bold')
    doc.text(String(v), 198, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.line(12, y + 2, 198, y + 2)
    y += 10
  })

  y += 6
  doc.setFillColor(236, 253, 245)
  doc.roundedRect(12, y, 186, 20, 3, 3, 'F')
  doc.setTextColor(...GREEN)
  doc.setFontSize(10)
  doc.text('MONTANT PAYÉ', 18, y + 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(money(montant), 192, y + 12, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text('Merci pour votre cotisation. — Ma Tontine Faso, DOCTEUR PC', 105, 285, { align: 'center' })

  doc.save(`recu-${membre.nom.replace(/\s+/g, '-')}-${d.toISOString().slice(0, 10)}.pdf`)
}

export async function rapportPDF({ groupe, collecteur, rows, totals, periodeLabel }) {
  const doc = await newDoc()
  await header(doc, 'Rapport de collecte')
  const { default: autoTable } = await import('jspdf-autotable')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(groupe ? groupe.nom : 'Tous les groupes', 12, 42)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Période : ${periodeLabel}`, 12, 48)
  doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')} par ${collecteur?.nom || ''}`, 198, 48, { align: 'right' })

  autoTable(doc, {
    startY: 54,
    head: [['Membre', 'Groupe', 'Paiements', 'Total payé', 'Retards', 'Solde dû']],
    body: rows.map(r => [r.nom, r.groupe, r.payees, money(r.totalPaye), r.retards, money(r.soldeDu)]),
    theme: 'striped',
    headStyles: { fillColor: GREEN, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 3: { halign: 'right' }, 5: { halign: 'right' } },
  })

  let y = doc.lastAutoTable.finalY + 10
  doc.setFillColor(236, 253, 245)
  doc.roundedRect(12, y, 186, 26, 3, 3, 'F')
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`Total collecté : ${money(totals.totalCollecte)}`, 18, y + 9)
  doc.text(`Commission : ${money(Math.round(totals.commission))}`, 18, y + 17)
  doc.text(`Retards : ${totals.retards}`, 150, y + 9)
  doc.text(`Solde dû total : ${money(totals.soldeDu)}`, 110, y + 17)

  doc.save(`rapport-${(groupe?.nom || 'tous').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
