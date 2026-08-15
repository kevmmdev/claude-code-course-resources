import { betterAuth } from 'better-auth';
import { getDb } from './db';

export const auth = betterAuth({
  database: getDb(),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

export async function getSession() {
  const { headers } = await import('next/headers');
  return auth.api.getSession({ headers: await headers() });
}
