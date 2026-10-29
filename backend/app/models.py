from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base


class Collecteur(Base):
    __tablename__ = "collecteurs"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    telephone = Column(String(20), nullable=False, unique=True)
    pin = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    groupes = relationship("Groupe", back_populates="collecteur")


class Groupe(Base):
    __tablename__ = "groupes"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    montant = Column(Float, nullable=False)
    frequence = Column(String(20), nullable=False)
    penalite = Column(Float, nullable=False, default=0)
    commission = Column(Float, nullable=False, default=0)
    date_creation = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    collecteur_id = Column(Integer, ForeignKey("collecteurs.id"))
    client_id = Column(Integer)

    collecteur = relationship("Collecteur", back_populates="groupes")
    membres = relationship("Membre", back_populates="groupe", cascade="all, delete-orphan")
    paiements = relationship("Paiement", back_populates="groupe", cascade="all, delete-orphan")


class Membre(Base):
    __tablename__ = "membres"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    telephone = Column(String(20), nullable=False)
    quartier = Column(String(100), nullable=False)
    groupe_id = Column(Integer, ForeignKey("groupes.id"))
    client_id = Column(Integer)

    groupe = relationship("Groupe", back_populates="membres")
    paiements = relationship("Paiement", back_populates="membre")


class Paiement(Base):
    __tablename__ = "paiements"

    id = Column(Integer, primary_key=True, index=True)
    membre_id = Column(Integer, ForeignKey("membres.id"))
    groupe_id = Column(Integer, ForeignKey("groupes.id"))
    montant = Column(Float, nullable=False)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    mode = Column(String(20), nullable=False)
    statut = Column(String(20), default="paye")
    client_id = Column(Integer)

    membre = relationship("Membre", back_populates="paiements")
    groupe = relationship("Groupe", back_populates="paiements")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    action = Column(String(40), nullable=False)
    details = Column(String(255), default="")
    collecteur_id = Column(Integer, ForeignKey("collecteurs.id"))
    client_id = Column(Integer)
