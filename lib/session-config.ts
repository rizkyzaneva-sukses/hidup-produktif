export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is required in production');
}

export const sessionOptions = {
  password: sessionSecret || 'dev-secret-dev-secret-dev-secret-32char',
  cookieName: 'hp-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  },
};
