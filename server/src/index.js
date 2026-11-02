const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== ROUTES PUBLIQUES (INVITÉS) ====================

// Récupérer les informations de l'événement
app.get('/api/event', (req, res) => {
  const settings = db.prepare('SELECT key, value FROM settings').all();
  const event = {};
  settings.forEach(s => event[s.key] = s.value);
  res.json(event);
});

// Soumettre une réponse RSVP
app.post('/api/rsvp', (req, res) => {
  const { firstName, lastName, email, attending, plusOne, plusOneName, dietaryRestrictions, message } = req.body;

  // Validation basique
  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'Le prénom et le nom sont obligatoires' });
  }

  // Vérifier si l'invité existe déjà (par nom)
  const existing = db.prepare(
    'SELECT id FROM guests WHERE LOWER(first_name) = LOWER(?) AND LOWER(last_name) = LOWER(?)'
  ).get(firstName, lastName);

  if (existing) {
    // Mise à jour
    db.prepare(`
      UPDATE guests SET 
        email = ?, attending = ?, plus_one = ?, plus_one_name = ?, 
        dietary_restrictions = ?, message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(email || null, attending ? 1 : 2, plusOne ? 1 : 0, plusOneName || null, dietaryRestrictions || null, message || null, existing.id);
    
    return res.json({ success: true, message: 'Votre réponse a été mise à jour', id: existing.id });
  } else {
    // Nouvelle entrée
    const result = db.prepare(`
      INSERT INTO guests (first_name, last_name, email, attending, plus_one, plus_one_name, dietary_restrictions, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(firstName, lastName, email || null, attending ? 1 : 2, plusOne ? 1 : 0, plusOneName || null, dietaryRestrictions || null, message || null);
    
    return res.json({ success: true, message: 'Merci pour votre réponse !', id: result.lastInsertRowid });
  }
});

// Vérifier si un invité a déjà répondu (optionnel, pour pré-remplir)
app.get('/api/guest/check', (req, res) => {
  const { firstName, lastName } = req.query;
  if (!firstName || !lastName) return res.json({ exists: false });

  const guest = db.prepare(
    'SELECT * FROM guests WHERE LOWER(first_name) = LOWER(?) AND LOWER(last_name) = LOWER(?)'
  ).get(firstName, lastName);

  res.json({ exists: !!guest, guest: guest || null });
});

// ==================== ROUTES ADMIN (DASHBOARD) ====================

// Authentification admin simple
const authMiddleware = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (password !== adminPass) {
    return res.status(401).json({ error: 'Accès non autorisé' });
  }
  next();
};

// Récupérer tous les invités
app.get('/api/admin/guests', authMiddleware, (req, res) => {
  const guests = db.prepare('SELECT * FROM guests ORDER BY updated_at DESC').all();
  res.json(guests);
});

// Statistiques du dashboard
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM guests').get().count;
  const attending = db.prepare('SELECT COUNT(*) as count FROM guests WHERE attending = 1').get().count;
  const declining = db.prepare('SELECT COUNT(*) as count FROM guests WHERE attending = 2').get().count;
  const pending = db.prepare('SELECT COUNT(*) as count FROM guests WHERE attending = 0').get().count;
  const plusOnes = db.prepare('SELECT SUM(plus_one) as count FROM guests WHERE attending = 1').get().count || 0;

  res.json({
    total,
    attending,
    declining,
    pending,
    plusOnes,
    totalAttendees: attending + plusOnes
  });
});

// Supprimer un invité
app.delete('/api/admin/guests/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM guests WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Mettre à jour les paramètres de l'événement
app.put('/api/admin/settings', authMiddleware, (req, res) => {
  const updates = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  const transaction = db.transaction((settings) => {
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, value);
    }
  });
  
  transaction(updates);
  res.json({ success: true });
});

// ==================== SERVIR LE FRONTEND EN PRODUCTION ====================

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDistPath));
  
  // Toutes les routes non-API renvoient index.html (SPA routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur Faire-Part démarré sur http://localhost:${PORT}`);
  console.log(`📊 Dashboard admin: http://localhost:${PORT}/admin`);
  console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
