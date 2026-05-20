import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      const reason = err.name === 'TokenExpiredError' ? 'Token expired' : err.name === 'JsonWebTokenError' ? 'Invalid token' : 'Invalid or expired token';
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[auth] JWT verify failed:', err.message);
      }
      return res.status(403).json({ error: reason, code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID' });
    }
    req.user = user;
    next();
  });
};

export { AuthRequest };