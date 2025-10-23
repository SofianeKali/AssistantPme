import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the authenticated user has admin role
 * Must be used after authentication middleware
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  // Check if user has admin role (accept both 'admin' and 'administrator' for backwards compatibility)
  const userRole = (req.user as any).role;
  if (userRole !== 'admin' && userRole !== 'administrator') {
    return res.status(403).json({ message: 'Accès interdit : rôle administrateur requis' });
  }

  next();
}

/**
 * Middleware to ensure user is authenticated
 * Checks if req.user exists from passport authentication
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  
  next();
}
