import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || typeof (user as { id?: unknown }).id !== 'string') {
    return null;
  }

  return {
    id: (user as { id: string }).id,
    name: user.name,
    email: user.email,
  };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}
