import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { database } from './lib/db';

export type Role = 'student' | 'teacher';
const login = z.object({ email: z.string().trim().email().max(254), password: z.string().min(8).max(72) });
type Actor = { id: string; role: Role };

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  providers: [Credentials({
    credentials: { email: { type: 'email' }, password: { type: 'password' } },
    async authorize(input) {
      const parsed = login.safeParse(input);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;
      const db = await database();
      const [user] = await db.query<{ id: string; email: string; name: string; role: Role; password_hash: string }>(
        'SELECT * FROM study_users WHERE email=$1', [email.toLowerCase()]);
      const valid = await compare(password, user?.password_hash ?? '$2b$12$HbA1zu2OdT5nhiHF/aHv1.Ccp7bFLMyqMbZEATXfAiDMuEeqhDjqW');
      return valid && user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null;
    }
  })],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as typeof user & { role: Role }).role;
      return token;
    },
    session({ session, token }) {
      Object.assign(session.user, { id: token.sub, role: token.role });
      return session;
    }
  }
});

export async function actor(): Promise<Actor | null> {
  const session = await auth();
  const user = session?.user as ({ id?: string; role?: Role } | undefined);
  return user?.id && user.role ? { id: user.id, role: user.role } : null;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}
