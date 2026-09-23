import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    uid: string;
    email: string;
    name?: string;
  };
}

export const defaultUser = {
  id: 'usr_novaquant',
  uid: 'usr_novaquant',
  email: 'novaquant2026@gmail.com',
  name: 'NovaQuant Manager',
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const user = await getOrCreateUser(
        decodedToken.uid,
        decodedToken.email || `${decodedToken.uid}@user.novaquant.io`,
        decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Trader'),
        decodedToken.picture
      );
      req.user = {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email,
      };
      return next();
    } catch (error) {
      console.warn('Firebase ID token verification failed; checking fallback:', error);
    }
  }

  // Fallback to active user header if present or default institutional account
  const activeUid = customUserId || defaultUser.uid;
  try {
    const dbUser = await getOrCreateUser(
      activeUid,
      activeUid === defaultUser.uid ? defaultUser.email : `${activeUid}@novaquant.io`,
      activeUid === defaultUser.uid ? defaultUser.name : `Trader ${activeUid.slice(0, 6)}`
    );
    req.user = {
      id: dbUser.uid,
      uid: dbUser.uid,
      email: dbUser.email,
      name: dbUser.displayName || dbUser.email,
    };
  } catch {
    req.user = defaultUser;
  }
  next();
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no Bearer token, check if optional auth user is assigned
    if (req.user) {
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const user = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || `${decodedToken.uid}@user.novaquant.io`,
      decodedToken.name,
      decodedToken.picture
    );
    req.user = {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email,
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
