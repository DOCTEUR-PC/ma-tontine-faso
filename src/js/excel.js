// Export Excel via SheetJS, chargé dynamiquement.
export async function rapportExcel({ groupe, rows, totals, periodeLabel }) {
  const XLSX = await import('xlsx')

  const data = rows.map(r => ({
    'Membre': r.nom,
    'Groupe': r.groupe,
    'Quartier': r.quartier,
    'Téléphone': r.telephone,
    'Paiements': r.payees,
    'Total payé (F)': r.totalPaye,
    'Retards': r.retards,
    'Solde dû (F)': r.soldeDu,
  }))

  data.push({})
  data.push({
    'Membre': 'TOTAL',
    'Total payé (F)': totals.totalCollecte,
    'Retards': totals.retards,
    'Solde dû (F)': totals.soldeDu,
  })
  data.push({ 'Membre': 'Commission collecteur (F)', 'Total payé (F)': Math.round(totals.commission) })

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 9 }, { wch: 12 }]

  const wb = XLSX.utils.book_new()
  const sheetName = (groupe?.nom || 'Tous').slice(0, 28)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `rapport-${(groupe?.nom || 'tous').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
