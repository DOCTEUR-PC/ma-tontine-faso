from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.CollecteurOut, status_code=201)
def register(data: schemas.CollecteurCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Collecteur).filter(
        models.Collecteur.telephone == data.telephone
    ).first()
    if existing:
        raise HTTPException(400, "Ce numéro est déjà enregistré")
    c = models.Collecteur(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.post("/login", response_model=schemas.CollecteurOut)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    c = db.query(models.Collecteur).filter(
        models.Collecteur.telephone == data.telephone,
        models.Collecteur.pin == data.pin
    ).first()
    if not c:
        raise HTTPException(401, "Téléphone ou PIN incorrect")
    return c
