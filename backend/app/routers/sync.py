from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.post("/push", response_model=schemas.SyncResponse)
def sync_push(payload: schemas.SyncPayload, db: Session = Depends(get_db)):
    """Reçoit les données offline du client et les insère côté serveur.
    Retourne les IDs serveur mappés aux IDs client."""

    id_map_groupes = {}
    id_map_membres = {}

    for g_data in payload.groupes:
        client_id = g_data.client_id
        g = models.Groupe(
            nom=g_data.nom,
            montant=g_data.montant,
            frequence=g_data.frequence,
            penalite=g_data.penalite,
            commission=g_data.commission,
            collecteur_id=g_data.collecteur_id,
            client_id=client_id,
        )
        db.add(g)
        db.flush()
        if client_id is not None:
            id_map_groupes[client_id] = g.id

    for m_data in payload.membres:
        client_id = m_data.client_id
        groupe_id = m_data.groupe_id
        if groupe_id in id_map_groupes:
            groupe_id = id_map_groupes[groupe_id]

        m = models.Membre(
            nom=m_data.nom,
            telephone=m_data.telephone,
            quartier=m_data.quartier,
            groupe_id=groupe_id,
            client_id=client_id,
        )
        db.add(m)
        db.flush()
        if client_id is not None:
            id_map_membres[client_id] = m.id

    for p_data in payload.paiements:
        membre_id = p_data.membre_id
        groupe_id = p_data.groupe_id
        if membre_id in id_map_membres:
            membre_id = id_map_membres[membre_id]
        if groupe_id in id_map_groupes:
            groupe_id = id_map_groupes[groupe_id]

        p = models.Paiement(
            membre_id=membre_id,
            groupe_id=groupe_id,
            montant=p_data.montant,
            date=p_data.date or datetime.now(timezone.utc),
            mode=p_data.mode,
            statut=p_data.statut,
            client_id=p_data.client_id,
        )
        db.add(p)

    for a_data in payload.audit_log:
        db.add(models.AuditLog(
            date=a_data.date or datetime.now(timezone.utc),
            action=a_data.action,
            details=a_data.details,
            collecteur_id=a_data.collecteur_id,
            client_id=a_data.client_id,
        ))

    db.commit()

    groupes = db.query(models.Groupe).all()
    membres = db.query(models.Membre).all()
    paiements = db.query(models.Paiement).all()

    return schemas.SyncResponse(
        groupes=groupes,
        membres=membres,
        paiements=paiements,
        id_map_groupes=id_map_groupes,
        id_map_membres=id_map_membres,
    )


@router.get("/pull", response_model=schemas.SyncResponse)
def sync_pull(collecteur_id: int | None = None, db: Session = Depends(get_db)):
    """Retourne toutes les données pour le client."""
    q_g = db.query(models.Groupe)
    if collecteur_id:
        q_g = q_g.filter(models.Groupe.collecteur_id == collecteur_id)
    groupes = q_g.all()

    groupe_ids = [g.id for g in groupes]
    membres = db.query(models.Membre).filter(
        models.Membre.groupe_id.in_(groupe_ids)
    ).all() if groupe_ids else []
    paiements = db.query(models.Paiement).filter(
        models.Paiement.groupe_id.in_(groupe_ids)
    ).all() if groupe_ids else []

    return schemas.SyncResponse(
        groupes=groupes,
        membres=membres,
        paiements=paiements,
    )
