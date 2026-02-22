
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'papertradex-prod-secret-991';

export const authenticate = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
};
