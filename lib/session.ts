import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { scryptSync, timingSafeEqual } from 'crypto';
import { type SessionData, sessionOptions } from './session-config';
import { prisma } from './prisma';

export type { SessionData };
export { sessionOptions };

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

const SALT = 'hp-berkah-2025';

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  if (!username || !password) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { passwordHash: true },
    });

    if (!user) return false;

    const hash = scryptSync(password, SALT, 64);
    const expected = Buffer.from(user.passwordHash, 'hex');
    return timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const hash = scryptSync(password, SALT, 64);
  return hash.toString('hex');
}
