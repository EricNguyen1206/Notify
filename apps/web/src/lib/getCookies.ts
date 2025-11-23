import { cookies } from 'next/headers';

/**
 * Server-side helper to read the access token from httpOnly cookies
 * Since httpOnly cookies cannot be accessed from client-side JavaScript,
 * this must be called from Next.js server components or server actions
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value;
}
