from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/groupes", tags=["groupes"])


@router.get("/", response_model=list[schemas.GroupeOut])
def list_groupes(collecteur_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Groupe)
    if collecteur_id:
        q = q.filter(models.Groupe.collecteur_id == collecteur_id)
    return q.all()


@router.get("/{groupe_id}", response_model=schemas.GroupeOut)
def get_groupe(groupe_id: int, db: Session = Depends(get_db)):
    g = db.get(models.Groupe, groupe_id)
    if not g:
        raise HTTPException(404, "Groupe introuvable")
    return g


@router.post("/", response_model=schemas.GroupeOut, status_code=201)
def create_groupe(data: schemas.GroupeCreate, db: Session = Depends(get_db)):
    g = models.Groupe(**data.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


@router.put("/{groupe_id}", response_model=schemas.GroupeOut)
def update_groupe(groupe_id: int, data: schemas.GroupeCreate, db: Session = Depends(get_db)):
    g = db.get(models.Groupe, groupe_id)
    if not g:
        raise HTTPException(404, "Groupe introuvable")
    for k, v in data.model_dump().items():
        setattr(g, k, v)
    db.commit()
    db.refresh(g)
    return g


@router.delete("/{groupe_id}", status_code=204)
def delete_groupe(groupe_id: int, db: Session = Depends(get_db)):
    g = db.get(models.Groupe, groupe_id)
    if not g:
        raise HTTPException(404, "Groupe introuvable")
    db.delete(g)
    db.commit()
