import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { scryptSync, timingSafeEqual } from 'crypto';
import { type SessionData, sessionOptions } from './session-config';

export type { SessionData };
export { sessionOptions };

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
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
