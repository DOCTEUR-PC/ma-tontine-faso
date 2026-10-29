-- Schéma D1 (SQLite) pour Ma Tontine Faso
-- Upserts scopés par collecteur via (collecteur_id, client_id) pour éviter les doublons à chaque sync.

CREATE TABLE IF NOT EXISTS collecteurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groupes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  montant REAL NOT NULL,
  frequence TEXT NOT NULL,
  penalite REAL NOT NULL DEFAULT 0,
  commission REAL NOT NULL DEFAULT 0,
  date_creation TEXT DEFAULT CURRENT_TIMESTAMP,
  collecteur_id INTEGER,
  client_id INTEGER,
  UNIQUE(collecteur_id, client_id)
);

CREATE TABLE IF NOT EXISTS membres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  telephone TEXT,
  quartier TEXT,
  groupe_id INTEGER,
  collecteur_id INTEGER,
  client_id INTEGER,
  UNIQUE(collecteur_id, client_id)
);

CREATE TABLE IF NOT EXISTS paiements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membre_id INTEGER,
  groupe_id INTEGER,
  montant REAL NOT NULL,
  date TEXT,
  mode TEXT,
  statut TEXT DEFAULT 'paye',
  collecteur_id INTEGER,
  client_id INTEGER,
  UNIQUE(collecteur_id, client_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  action TEXT NOT NULL,
  details TEXT DEFAULT '',
  collecteur_id INTEGER,
  client_id INTEGER,
  UNIQUE(collecteur_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_groupes_collecteur ON groupes(collecteur_id);
CREATE INDEX IF NOT EXISTS idx_membres_groupe ON membres(groupe_id);
CREATE INDEX IF NOT EXISTS idx_paiements_groupe ON paiements(groupe_id);
