export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'hp-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  },
};
