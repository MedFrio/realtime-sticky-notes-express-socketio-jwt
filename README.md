# Realtime Sticky Notes — Express + Socket.IO + JWT

Application de tableau de notes collaborative en temps réel. Lecture publique. Écriture réservée aux utilisateurs connectés. Chaque note appartient à son auteur et seul l’auteur peut la modifier ou la supprimer.

## Démarrage rapide
- Prérequis: Node.js 18+, npm
- Installation:
  - cd backend
  - cp .env.example .env
  - npm install
  - npm run dev
- Ouvre http://localhost:3000

## Variables d’environnement (backend/.env)
- PORT=3000
- JWT_SECRET=change_me_in_production
- JWT_EXPIRES_IN=1h
- PERSIST_TO_JSON=true

## Structure utile
- backend/src/server.js
- backend/src/routes/auth.routes.js
- backend/src/routes/notes.routes.js
- backend/src/middleware/authJwt.js
- backend/src/services/{users,notes}.service.js
- backend/src/sockets/notes.events.js
- backend/store/{users.json,notes.json}
- frontend/public/{index.html,style.css}
- frontend/src/{app.js,auth.js}

## Usage côté client
- Page unique: http://localhost:3000
- Inscription puis connexion
- Création de note via le champ en haut
- Modification et suppression visibles uniquement pour l’auteur
- Mise à jour en temps réel via Socket.IO

## API résumé
- POST /api/register { username, password } → 201
- POST /api/login { username, password } → { token }
- GET /api/notes → liste des notes
- POST /api/notes (Bearer) { content } → 201
- PUT /api/notes/:id (Bearer + propriétaire) { content } → 200
- DELETE /api/notes/:id (Bearer + propriétaire) → 204

## Sécurité en bref
- Authentification par JWT signé avec secret .env et expiration
- Mot de passe haché avec bcrypt
- Middleware authJwt pour POST/PUT/DELETE
- Vérification stricte de la propriété: note.authorId == req.userId
- Socket.IO peut recevoir le token dans handshake.auth.token, mêmes règles côté événements

## Limites connues
- Persistance simple en JSON pour le TP
- Décodage du JWT côté frontend utilisé seulement pour l’affichage

## Scripts utiles (backend)
- npm run dev → démarrer en développement
- npm start → démarrer en production simple
