import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { scryptSync, timingSafeEqual } from 'crypto';

export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'hp-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session;
}

const SALT = 'hp-berkah-rizkyzaneva-2025';
const CORRECT_USERNAME = 'rizkyzaneva';
const PASSWORD_HASH = scryptSync('2mperbulan', SALT, 64);

export function verifyCredentials(username: string, password: string): boolean {
  if (username !== CORRECT_USERNAME) return false;
  try {
    const hash = scryptSync(password, SALT, 64);
    return timingSafeEqual(PASSWORD_HASH, hash);
  } catch {
    return false;
  }
}
