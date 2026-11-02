const Database = require('better-sqlite3');
const path = require('path');

// Initialisation de la base SQLite
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'rsvp.db');
const db = new Database(dbPath);

// Activation du mode WAL pour de meilleures performances concurrentes
db.pragma('journal_mode = WAL');

// Création des tables si elles n'existent pas
db.exec(`
  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    attending INTEGER DEFAULT 0, -- 0: non répondu, 1: présent, 2: absent
    plus_one INTEGER DEFAULT 0,   -- 0: seul, 1: avec +1
    plus_one_name TEXT,
    dietary_restrictions TEXT,    -- Restrictions alimentaires
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Migration : ajouter la colonne dietary_restrictions si elle n'existe pas
try {
  db.exec(`ALTER TABLE guests ADD COLUMN dietary_restrictions TEXT`);
  console.log('✅ Migration: colonne dietary_restrictions ajoutée');
} catch (e) {
  // La colonne existe déjà, c'est normal
}

// Insertion des paramètres par défaut si absents
const upsertSetting = db.prepare(`
  INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

upsertSetting.run('event_title', 'Mariage de Amine & Mehrinaz');
upsertSetting.run('event_date', '2026-12-19T18:00:00');
upsertSetting.run('event_location', 'Espace Royal, 6 rue de Valmy, Montreuil');
upsertSetting.run('admin_password', process.env.ADMIN_PASSWORD || 'admin123');

module.exports = db;
