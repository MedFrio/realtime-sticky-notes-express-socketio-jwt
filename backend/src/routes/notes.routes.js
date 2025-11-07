// backend/src/routes/notes.routes.js
import { Router } from 'express';
import { notesService } from '../services/notes.service.js';
import { authJwt } from '../middleware/authJwt.js';
import { broadcastNotesUpdated } from '../sockets/bus.js';

const router = Router();

// GET /api/notes (public)
router.get('/notes', async (_req, res) => {
  const notes = await notesService.getAll();
  res.json(notes);
});

// POST /api/notes (auth)
router.post('/notes', authJwt, async (req, res) => {
  const { content } = req.body || {};
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ message: 'content requis' });
  }
  const note = await notesService.create({ content: content.trim(), authorId: req.userId });
  const all = await notesService.getAll();
  await broadcastNotesUpdated(all);
  res.status(201).json(note);
});

// PUT /api/notes/:id (auth + propriétaire)
router.put('/notes/:id', authJwt, async (req, res) => {
  const id = req.params.id;
  const { content } = req.body || {};
  const note = await notesService.getById(id);
  if (!note) return res.status(404).json({ message: 'Note introuvable' });
  if (note.authorId !== req.userId) return res.status(403).json({ message: 'Interdit' });

  const updated = await notesService.update(id, { content: (content || '').trim() });
  const all = await notesService.getAll();
  await broadcastNotesUpdated(all);
  res.json(updated);
});

// DELETE /api/notes/:id (auth + propriétaire)
router.delete('/notes/:id', authJwt, async (req, res) => {
  const id = req.params.id;
  const note = await notesService.getById(id);
  if (!note) return res.status(404).json({ message: 'Note introuvable' });
  if (note.authorId !== req.userId) return res.status(403).json({ message: 'Interdit' });

  await notesService.remove(id);
  const all = await notesService.getAll();
  await broadcastNotesUpdated(all);
  res.status(204).end();
});

export default router;
