# Build stage pour le frontend React
FROM node:20-alpine AS frontend-build

WORKDIR /app/client

# Copier les fichiers de dépendances
COPY client/package*.json ./
RUN npm ci

# Copier le source et builder
COPY client/ ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Installer les dépendances de production du backend
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copier le code backend
COPY server/src ./server/src

# Copier les assets buildés du frontend
COPY --from=frontend-build /app/client/dist ./client/dist

# Créer le dossier de données persistantes
RUN mkdir -p /app/server/data

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/server/data/rsvp.db

# Exposer le port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/event || exit 1

# Démarrer le serveur
CMD ["node", "server/src/index.js"]
