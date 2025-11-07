// frontend/src/app.js
import { auth } from './auth.js';

export const app = {
  socket: null,

  api: {
    async listNotes() {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error(`GET /api/notes: ${res.status}`);
      return res.json();
    },
    async createNote(content) {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify({ content })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `POST /api/notes: ${res.status}`);
      return data;
    },
    async updateNote(id, content) {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify({ content })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `PUT /api/notes/${id}: ${res.status}`);
      return data;
    },
    async deleteNote(id) {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { ...auth.authHeader() }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `DELETE /api/notes/${id}: ${res.status}`);
      }
      return true;
    }
  },

async renderNotes() {
  const notes = await this.api.listNotes();
  const ul = document.getElementById('notes');
  ul.innerHTML = '';

  const me = auth.user;

  // 1) Tes notes d'abord (pour que leurs boutons soient visibles en haut)
  notes.sort((a, b) => {
    const aMine = me && a.authorId === me.id ? 1 : 0;
    const bMine = me && b.authorId === me.id ? 1 : 0;
    if (aMine !== bMine) return bMine - aMine; // d'abord les tiennes
    // puis tri décroissant par date
    const da = new Date(a.createdAt || 0).getTime();
    const db = new Date(b.createdAt || 0).getTime();
    return db - da;
  });

  for (const n of notes) {
    const li = document.createElement('li');
    li.className = 'note';

    const text = document.createElement('div');
    text.textContent = n.content;

    const meta = document.createElement('small');
    const created = new Date(n.createdAt || Date.now()).toLocaleString();
    meta.textContent = `#${n.id} • auteur: ${n.authorId ?? 'anonyme'} • créé: ${created}`;

    const actions = document.createElement('div');
    actions.className = 'note-actions';

    const canEdit = me && n.authorId === me.id;

    if (canEdit) {
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Modifier';
      editBtn.addEventListener('click', async () => {
        const val = prompt('Nouveau contenu', n.content);
        if (val == null) return;
        try {
          await this.api.updateNote(n.id, val);
          await this.renderNotes();
        } catch (e) {
          alert(e.message);
        }
      });

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Supprimer';
      delBtn.addEventListener('click', async () => {
        if (!confirm('Supprimer cette note ?')) return;
        try {
          await this.api.deleteNote(n.id);
          await this.renderNotes();
        } catch (e) {
          alert(e.message);
        }
      });

      actions.append(editBtn, delBtn);
    } else {
      // 3) Badge explicite pour éviter l’impression de bug
      const badge = document.createElement('span');
      badge.textContent = 'lecture seule';
      badge.style.opacity = '0.7';
      badge.style.fontSize = '12px';
      actions.append(badge);
    }

    li.append(text, meta, actions);
    ul.appendChild(li);
  }
},


  connectSocket() {
    if (this.socket) {
      try { this.socket.disconnect(); } catch {}
      this.socket = null;
    }

    // eslint-disable-next-line no-undef
    this.socket = io('/', {
      auth: auth.token ? { token: auth.token } : {}
    });

    this.socket.on('notes_updated', async () => {
      await this.renderNotes();
    });
  },

  async start() {
    // formulaire création
    const form = document.getElementById('create-form');
    const input = document.getElementById('note-content');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;

      try {
        await this.api.createNote(val);
        input.value = '';
        await this.renderNotes(); // fallback local
      } catch (e2) {
        alert(e2.message);
      }
    });

    // première connexion socket
    this.connectSocket();

    // re-auth dans le même onglet (login/logout)
    window.addEventListener('auth-changed', () => {
      this.connectSocket();
      this.renderNotes();
    });

    // re-auth entre onglets (storage)
    window.addEventListener('storage', (ev) => {
      if (ev.key === auth.tokenKey) {
        this.connectSocket();
        this.renderNotes();
      }
    });

    // premier rendu
    await this.renderNotes();
  }
};
