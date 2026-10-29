from pydantic import BaseModel
from datetime import datetime


class GroupeBase(BaseModel):
    nom: str
    montant: float
    frequence: str
    penalite: float = 0
    commission: float = 0


class GroupeCreate(GroupeBase):
    client_id: int | None = None
    collecteur_id: int | None = None


class GroupeOut(GroupeBase):
    id: int
    date_creation: datetime
    collecteur_id: int | None = None
    client_id: int | None = None
    model_config = {"from_attributes": True}


class MembreBase(BaseModel):
    nom: str
    telephone: str
    quartier: str
    groupe_id: int


class MembreCreate(MembreBase):
    client_id: int | None = None


class MembreOut(MembreBase):
    id: int
    client_id: int | None = None
    model_config = {"from_attributes": True}


class PaiementBase(BaseModel):
    membre_id: int
    groupe_id: int
    montant: float
    mode: str
    statut: str = "paye"


class PaiementCreate(PaiementBase):
    date: datetime | None = None
    client_id: int | None = None


class PaiementOut(PaiementBase):
    id: int
    date: datetime
    client_id: int | None = None
    model_config = {"from_attributes": True}


class CollecteurCreate(BaseModel):
    nom: str
    telephone: str
    pin: str


class CollecteurOut(BaseModel):
    id: int
    nom: str
    telephone: str
    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    telephone: str
    pin: str


class AuditLogCreate(BaseModel):
    date: datetime | None = None
    action: str
    details: str = ""
    collecteur_id: int | None = None
    client_id: int | None = None


class SyncPayload(BaseModel):
    groupes: list[GroupeCreate] = []
    membres: list[MembreCreate] = []
    paiements: list[PaiementCreate] = []
    audit_log: list[AuditLogCreate] = []


class SyncResponse(BaseModel):
    groupes: list[GroupeOut] = []
    membres: list[MembreOut] = []
    paiements: list[PaiementOut] = []
    id_map_groupes: dict[int, int] = {}
    id_map_membres: dict[int, int] = {}
