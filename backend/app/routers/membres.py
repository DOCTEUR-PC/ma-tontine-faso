from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/membres", tags=["membres"])


@router.get("/", response_model=list[schemas.MembreOut])
def list_membres(groupe_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Membre)
    if groupe_id:
        q = q.filter(models.Membre.groupe_id == groupe_id)
    return q.all()


@router.post("/", response_model=schemas.MembreOut, status_code=201)
def create_membre(data: schemas.MembreCreate, db: Session = Depends(get_db)):
    m = models.Membre(**data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{membre_id}", status_code=204)
def delete_membre(membre_id: int, db: Session = Depends(get_db)):
    m = db.get(models.Membre, membre_id)
    if not m:
        raise HTTPException(404, "Membre introuvable")
    db.delete(m)
    db.commit()
