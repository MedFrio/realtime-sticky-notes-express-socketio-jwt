// frontend/src/auth.js
function emitAuthChanged() {
  try {
    window.dispatchEvent(new Event('auth-changed'));
  } catch {}
}

export const auth = {
  tokenKey: 'rt_notes_token',

  get token() {
    return localStorage.getItem(this.tokenKey);
  },
  set token(v) {
    if (!v) localStorage.removeItem(this.tokenKey);
    else localStorage.setItem(this.tokenKey, v);
    emitAuthChanged();
  },

  get user() {
    if (!this.token) return null;
    const parts = this.token.split('.');
    if (parts.length !== 3) return null;
    try {
      const payload = JSON.parse(atob(parts[1]));
      return { id: payload.sub, username: payload.username };
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.user;
  },

  authHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  },

  initUI() {
    const regForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const whoami = document.getElementById('whoami');
    const authForms = document.getElementById('auth-forms');

    const refreshUI = () => {
      if (this.isLoggedIn()) {
        whoami.textContent = `Connecté : ${this.user.username} (#${this.user.id})`;
        userInfo.classList.remove('hidden');
        authForms.classList.add('hidden');
      } else {
        userInfo.classList.add('hidden');
        authForms.classList.remove('hidden');
      }
    };

    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value.trim();
      const password = document.getElementById('reg-password').value.trim();
      if (!username || !password) return;

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert('Inscription réussie, vous pouvez vous connecter.');
        regForm.reset();
      } else {
        alert(`Erreur inscription: ${data.message || res.status}`);
      }
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value.trim();

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.token) {
        this.token = data.token;        // déclenche auth-changed
        refreshUI();
      } else {
        alert(`Erreur login: ${data.message || res.status}`);
      }
    });

    logoutBtn.addEventListener('click', () => {
      this.token = null;                 // déclenche auth-changed
      refreshUI();
    });

    refreshUI();
  }
};
