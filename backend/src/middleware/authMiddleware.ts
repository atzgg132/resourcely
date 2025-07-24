import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// Extend the Express Request type to include the user payload from the JWT
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  // The token is expected in the format "Bearer <token>"
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token format is invalid, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { user: { id: string; role: Role } };
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

// Middleware to check for specific admin roles
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPERADMIN') {
        return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    next();
};