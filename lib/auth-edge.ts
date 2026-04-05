import { jwtVerify } from 'jose';
import { SessionUser } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
);

export async function verifyTokenEdge(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload.user as SessionUser;
  } catch {
    return null;
  }
}