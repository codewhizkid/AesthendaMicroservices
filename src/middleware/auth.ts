import { Request, Response, NextFunction } from 'express';

export interface AuthContext {
  tenantId: string;
  userId?: string;
  role?: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Demo implementation - in production would verify JWT token
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    // Mock user context
    req.user = {
      id: 'user-1',
      tenantId: 'tenant-1',
      roles: ['ADMIN']
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}; 