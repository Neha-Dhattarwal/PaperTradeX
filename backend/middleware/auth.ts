
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends ExpressRequest {
  user?: {
    id: string;
    email: string;
  };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  const authReq = req as any;
  const authRes = res as any;

  if (authReq.headers && authReq.headers.authorization && authReq.headers.authorization.startsWith('Bearer')) {
    token = authReq.headers.authorization.split(' ')[1];
  }

  if (!token) {
    authRes.status(401).json({ message: 'Not authorized, no token' });
    return;
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'tradepulse_secret_key_123';
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    authReq.user = decoded;
    next();
  } catch (error) {
    authRes.status(401).json({ message: 'Not authorized, token failed' });
  }
};
