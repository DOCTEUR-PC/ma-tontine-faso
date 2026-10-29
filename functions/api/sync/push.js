import { json } from '../../_utils.js'

export async function onRequestPost({ request, env }) {
  const payload = await request.json()
  const groupes = payload.groupes || []
  const membres = payload.membres || []
  const paiements = payload.paiements || []
  const auditLog = payload.audit_log || []
  const db = env.DB

  const primaryCollecteur =
    groupes.find(g => g.collecteur_id != null)?.collecteur_id ??
    auditLog.find(a => a.collecteur_id != null)?.collecteur_id ?? null

  const idMapGroupes = {}
  const idMapMembres = {}
  const groupeCollecteur = {}

  for (const g of groupes) {
    const col = g.collecteur_id ?? primaryCollecteur
    const row = await db.prepare(
      `INSERT INTO groupes (nom, montant, frequence, penalite, commission, collecteur_id, client_id)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(collecteur_id, client_id) DO UPDATE SET
         nom=excluded.nom, montant=excluded.montant, frequence=excluded.frequence,
         penalite=excluded.penalite, commission=excluded.commission
       RETURNING id`
    ).bind(g.nom, g.montant, g.frequence, g.penalite ?? 0, g.commission ?? 0, col, g.client_id).first()
    idMapGroupes[g.client_id] = row.id
    groupeCollecteur[g.client_id] = col
  }

  for (const m of membres) {
    const col = groupeCollecteur[m.groupe_id] ?? primaryCollecteur
    const groupeId = idMapGroupes[m.groupe_id] ?? m.groupe_id
    const row = await db.prepare(
      `INSERT INTO membres (nom, telephone, quartier, groupe_id, collecteur_id, client_id)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(collecteur_id, client_id) DO UPDATE SET
         nom=excluded.nom, telephone=excluded.telephone, quartier=excluded.quartier, groupe_id=excluded.groupe_id
       RETURNING id`
    ).bind(m.nom, m.telephone ?? null, m.quartier ?? null, groupeId, col, m.client_id).first()
    idMapMembres[m.client_id] = row.id
  }

  for (const p of paiements) {
    const col = groupeCollecteur[p.groupe_id] ?? primaryCollecteur
    const groupeId = idMapGroupes[p.groupe_id] ?? p.groupe_id
    const membreId = idMapMembres[p.membre_id] ?? p.membre_id
    await db.prepare(
      `INSERT INTO paiements (membre_id, groupe_id, montant, date, mode, statut, collecteur_id, client_id)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(collecteur_id, client_id) DO UPDATE SET
         membre_id=excluded.membre_id, groupe_id=excluded.groupe_id, montant=excluded.montant,
         date=excluded.date, mode=excluded.mode, statut=excluded.statut`
    ).bind(membreId, groupeId, p.montant, p.date ?? null, p.mode ?? null, p.statut ?? 'paye', col, p.client_id).run()
  }

  for (const a of auditLog) {
    const col = a.collecteur_id ?? primaryCollecteur
    await db.prepare(
      `INSERT INTO audit_log (date, action, details, collecteur_id, client_id)
       VALUES (?,?,?,?,?)
       ON CONFLICT(collecteur_id, client_id) DO UPDATE SET
         date=excluded.date, action=excluded.action, details=excluded.details`
    ).bind(a.date ?? null, a.action, a.details ?? '', col, a.client_id).run()
  }

  const outGroupes = primaryCollecteur != null
    ? (await db.prepare('SELECT * FROM groupes WHERE collecteur_id = ?').bind(primaryCollecteur).all()).results
    : []
  const outMembres = primaryCollecteur != null
    ? (await db.prepare('SELECT * FROM membres WHERE collecteur_id = ?').bind(primaryCollecteur).all()).results
    : []
  const outPaiements = primaryCollecteur != null
    ? (await db.prepare('SELECT * FROM paiements WHERE collecteur_id = ?').bind(primaryCollecteur).all()).results
    : []

  return json({
    groupes: outGroupes,
    membres: outMembres,
    paiements: outPaiements,
    id_map_groupes: idMapGroupes,
    id_map_membres: idMapMembres,
  })
}
