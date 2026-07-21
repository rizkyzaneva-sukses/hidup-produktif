export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
}

export const sessionOptions = {
  get password() {
    const secret = process.env.SESSION_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    return secret || 'dev-secret-dev-secret-dev-secret-32char';
  },
  cookieName: 'hp-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  },
};
