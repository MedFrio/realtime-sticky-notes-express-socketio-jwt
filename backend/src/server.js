import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';
import { registerNotesSocket } from './sockets/notes.events.js';
import { setIO } from './sockets/bus.js';
import { getUsersStorePath } from './services/users.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

// brancher le bus socket pour le broadcast depuis les routes REST
setIO(io);

// middlewares
app.use(cors());
app.use(express.json());

// statiques frontend
const frontendPublic = path.join(__dirname, '../../frontend/public');
const frontendSrc = path.join(__dirname, '../../frontend/src');
app.use(express.static(frontendPublic));
app.use('/src', express.static(frontendSrc));

// santé
app.get('/health', (_req, res) => res.json({ ok: true }));

// --- ROUTES API (doivent venir AVANT le fallback) ---
app.use('/api', authRoutes);
app.use('/api', notesRoutes);


console.log('Routes API montées: /api/register, /api/login, /api/notes');

app.get('/api/_debug/users-path', (_req, res) => {
  res.json({ usersStorePath: getUsersStorePath() });
});



// 404 JSON dédié aux API inconnues (après toutes les routes /api)
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// socket.io
io.on('connection', (socket) => {
  registerNotesSocket(io, socket);
});

// --- FALLBACK SPA : uniquement pour les navigations HTML ---
// si Accept contient text/html, on renvoie index.html, sinon 404
app.get('*', (req, res) => {
  const accept = req.headers.accept || '';
  const wantsHtml = accept.includes('text/html');
  if (wantsHtml) {
    return res.sendFile(path.join(frontendPublic, 'index.html'));
  }
  return res.status(404).end();
});

// start
server.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
