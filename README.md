# 💌 Faire-Part Numérique avec RSVP Automatique

Système élégant de faire-part numérique permettant aux invités de confirmer leur présence en ligne, avec un dashboard administrateur pour suivre les réponses en temps réel.

## ✨ Fonctionnalités

- **Page d'invitation élégante** : Design chic et responsive (tons dorés/crème)
- **RSVP automatique** : Les invités confirment leur présence avec option +1
- **Dashboard admin** : Statistiques en temps réel, liste filtrable, export CSV
- **Persistance SQLite** : Base de données légère, facile à sauvegarder
- **Prêt pour Docker** : Déploiement simplifié sur tout serveur

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation

```bash
# Cloner le projet
cd faire-part-numerique

# Installer les dépendances backend
cd server && npm install && cd ..

# Installer les dépendances frontend
cd client && npm install && cd ..
```

### Développement Local

```bash
# Terminal 1 - Backend API
cd server
cp .env.example .env
npm start

# Terminal 2 - Frontend React
cd client
npm run dev
```

Accédez à :
- **Invitation** : http://localhost:5173
- **Dashboard Admin** : http://localhost:5173/admin (mot de passe: `admin123`)

## 🐳 Déploiement Docker

### Build et lancement

```bash
cd docker

# Créer le dossier de données persistantes
mkdir -p data

# Optionnel : personnaliser le mot de passe admin
echo "ADMIN_PASSWORD=VotreMotDePasseSecurise" > .env

# Builder et démarrer
docker-compose up -d --build
```

L'application sera accessible sur `http://votre-serveur:3001`

### Arrêt et mise à jour

```bash
# Arrêter
docker-compose down

# Mettre à jour après modification du code
git pull
docker-compose up -d --build
```

### Sauvegarde de la base de données

La base SQLite est stockée dans `docker/data/rsvp.db`. Pour sauvegarder :

```bash
cp docker/data/rsvp.db backup_$(date +%Y%m%d).db
```

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur API | `3001` |
| `ADMIN_PASSWORD` | Mot de passe dashboard admin | `admin123` |
| `DB_PATH` | Chemin de la base SQLite | `./data/rsvp.db` |
| `NODE_ENV` | Environnement (development/production) | `development` |

### Personnaliser l'événement

Via le dashboard admin ou directement dans la base de données (`settings` table) :
- `event_title` : Titre de l'événement
- `event_date` : Date et heure (format ISO)
- `event_location` : Lieu de l'événement

## 📁 Structure du Projet

```
faire-part-numerique/
├── server/              # Backend Node.js/Express
│   ├── src/
│   │   ├── db.js       # Configuration SQLite
│   │   └── index.js    # Routes API
│   ├── data/           # Base de données (gitignored)
│   └── .env.example
├── client/             # Frontend React/Vite
│   ├── src/
│   │   ├── pages/      # Pages Invitation & Dashboard
│   │   └── index.css   # Styles globaux
│   └── dist/           # Build production
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
└── README.md
```

## 🔒 Sécurité

- **Changez le mot de passe admin** avant la mise en production
- Utilisez HTTPS en production (reverse proxy Nginx/Caddy recommandé)
- La base SQLite contient des données personnelles ; sécurisez les backups

## 🛠️ Technologies

- **Backend** : Node.js, Express, better-sqlite3
- **Frontend** : React, Vite, Framer Motion, Lucide Icons
- **Base de données** : SQLite (WAL mode)
- **Déploiement** : Docker, Docker Compose

## 📝 License

MIT - Libre d'utilisation pour vos événements personnels
