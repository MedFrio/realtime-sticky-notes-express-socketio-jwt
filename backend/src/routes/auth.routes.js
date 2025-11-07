import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { usersService } from '../services/users.service.js';

const router = Router();

// POST /api/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'username et password requis' });

  const exists = await usersService.getByUsername(username);
  if (exists) return res.status(409).json({ message: 'username déjà utilisé' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await usersService.create({ username, passwordHash });
  return res.status(201).json({ id: user.id, username: user.username });
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'username et password requis' });

  const user = await usersService.getByUsername(username);
  if (!user) return res.status(401).json({ message: 'Identifiants invalides' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Identifiants invalides' });

  const token = jwt.sign(
    { sub: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  return res.json({ token });
});

export default router;
