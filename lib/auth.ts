import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'Admin' | 'Borrower';
  name: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function getTokenFromRequest(req: NextRequest): JWTPayload | null {
  try {
    const authHeader = req.headers.get('authorization');
    const cookieToken = req.cookies.get('token')?.value;
    
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : cookieToken;

    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest, role?: 'Admin' | 'Borrower'): JWTPayload {
  const user = getTokenFromRequest(req);
  if (!user) throw new Error('Unauthorized');
  if (role && user.role !== role) throw new Error('Forbidden');
  return user;
}
