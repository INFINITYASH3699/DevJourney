import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { SessionUser } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
);

const TOKEN_EXPIRY = '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload.user as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token?.value) {
      return null;
    }

    return verifyToken(token.value);
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser): Promise<void> {
  const token = await createToken(user);
  const cookieStore = await cookies();

  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function updateUserActivity(userId: string): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActive: true, streak: true },
    });

    if (!user) return;

    const lastActive = new Date(user.lastActive);
    lastActive.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak = user.streak;

    if (diffDays === 1) {
      // Consecutive day - increment streak
      newStreak += 1;
    } else if (diffDays > 1) {
      // Streak broken
      newStreak = 1;
    }
    // diffDays === 0 means same day, keep streak

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActive: new Date(),
        streak: newStreak,
      },
    });
  } catch (error) {
    console.error('Failed to update user activity:', error);
  }
}