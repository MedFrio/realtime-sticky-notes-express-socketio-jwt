import jwt from 'jsonwebtoken';
import { notesService } from '../services/notes.service.js';

// Authentifie le socket (optionnel mais recommandé)
function authenticateSocket(socket) {

  const token = socket.handshake.auth?.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.sub;
  } catch {
    return null;
  }
}

export function registerNotesSocket(io, socket) {
  // Lecture publique : pas besoin d’être loggé pour recevoir notes_updated
  // Auth optionnelle pour actions en temps réel
  const userId = authenticateSocket(socket);
  if (userId) {
    socket.data.userId = userId;
  }

  // Exemples d’événements si tu veux piloter CRUD via sockets
  socket.on('create_note', async (payload, cb) => {
    if (!socket.data.userId) return cb?.({ ok: false, error: '401' });
    const content = (payload?.content || '').trim();
    if (!content) return cb?.({ ok: false, error: 'content requis' });
    const note = await notesService.create({ content, authorId: socket.data.userId });
    io.emit('notes_updated', await notesService.getAll());
    cb?.({ ok: true, note });
  });

  socket.on('update_note', async (payload, cb) => {
    if (!socket.data.userId) return cb?.({ ok: false, error: '401' });
    const { id, content } = payload || {};
    const note = await notesService.getById(id);
    if (!note) return cb?.({ ok: false, error: '404' });
    if (note.authorId !== socket.data.userId) return cb?.({ ok: false, error: '403' });
    const updated = await notesService.update(id, { content: (content || '').trim() });
    io.emit('notes_updated', await notesService.getAll());
    cb?.({ ok: true, note: updated });
  });

  socket.on('delete_note', async (payload, cb) => {
    if (!socket.data.userId) return cb?.({ ok: false, error: '401' });
    const { id } = payload || {};
    const note = await notesService.getById(id);
    if (!note) return cb?.({ ok: false, error: '404' });
    if (note.authorId !== socket.data.userId) return cb?.({ ok: false, error: '403' });
    await notesService.remove(id);
    io.emit('notes_updated', await notesService.getAll());
    cb?.({ ok: true });
  });
}
