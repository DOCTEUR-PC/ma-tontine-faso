from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/paiements", tags=["paiements"])


@router.get("/", response_model=list[schemas.PaiementOut])
def list_paiements(groupe_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Paiement)
    if groupe_id:
        q = q.filter(models.Paiement.groupe_id == groupe_id)
    return q.order_by(models.Paiement.date.desc()).all()


@router.post("/", response_model=schemas.PaiementOut, status_code=201)
def create_paiement(data: schemas.PaiementCreate, db: Session = Depends(get_db)):
    p = models.Paiement(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
