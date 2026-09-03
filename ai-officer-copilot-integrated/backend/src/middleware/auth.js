import jwt from 'jsonwebtoken';

function decodeToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
}

export function optionalAuth(req, _res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  if (!token) { req.user = { id: 'demo', name: 'Demo User' }; return next(); }
  try { req.user = decodeToken(token); return next(); }
  catch { req.user = { id: 'demo', name: 'Demo User' }; return next(); }
}

export function auth(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try { req.user = decodeToken(token); next(); }
  catch { return res.status(401).json({ message: 'Invalid or expired token' }); }
}

export function socketAuth(socket, next) {
  try {
    const t = socket.handshake.auth?.token;
    socket.user = t ? decodeToken(t) : { id: 'demo', name: 'Demo User' };
    next();
  } catch { next(new Error('Unauthorized')); }
}
