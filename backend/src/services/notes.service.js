import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { newId } from '../utils/id.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.join(__dirname, '../../store/notes.json');
const persist = (process.env.PERSIST_TO_JSON || 'true').toLowerCase() === 'true';

let notes = [];

async function load() {
  try {
    const raw = await fs.readFile(storePath, 'utf-8');
    notes = JSON.parse(raw);
  } catch {
    notes = [];
  }
}
async function save() {
  if (!persist) return;
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(notes, null, 2), 'utf-8');
}

await load();

export const notesService = {
  async getAll() {
    return notes;
  },
  async getById(id) {
    return notes.find(n => n.id === id) || null;
  },
  async create({ content, authorId }) {
    const note = { id: newId(), content, authorId, createdAt: new Date().toISOString(), updatedAt: null };
    notes.push(note);
    await save();
    return note;
  },
  async update(id, { content }) {
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    notes[idx] = { ...notes[idx], content, updatedAt: new Date().toISOString() };
    await save();
    return notes[idx];
  },
  async remove(id) {
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return false;
    notes.splice(idx, 1);
    await save();
    return true;
  }
};
