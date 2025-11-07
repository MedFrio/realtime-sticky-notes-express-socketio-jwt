import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { newId } from '../utils/id.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.join(__dirname, '../../store/users.json');

let users = [];

export function getUsersStorePath() {
  return storePath;
}

async function load() {
  try {
    const raw = await fs.readFile(storePath, 'utf-8');
    users = JSON.parse(raw);
    console.log('[users.service] load OK from', storePath, '→', users.length, 'users');
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('[users.service] no file yet, start empty at', storePath);
    } else {
      console.error('[users.service] load error:', e.message, 'path=', storePath);
    }
    users = [];
  }
}

async function save() {
  try {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    const data = JSON.stringify(users, null, 2);
    await fs.writeFile(storePath, data, 'utf-8');
    console.log('[users.service] save OK to', storePath, '→', users.length, 'users');
  } catch (e) {
    console.error('[users.service] save error:', e.message, 'path=', storePath);
  }
}

await load();

export const usersService = {
  async getAll() {
    return users;
  },
  async getById(id) {
    return users.find(u => u.id === id) || null;
  },
  async getByUsername(username) {
    return users.find(u => u.username === username) || null;
  },
  async create({ username, passwordHash }) {
    const user = { id: newId(), username, passwordHash };
    users.push(user);
    await save();
    return { id: user.id, username: user.username };
  }
};
