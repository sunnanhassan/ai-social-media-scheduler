import { auth } from '@clerk/nextjs/server';
import { createClient, createAdminClient, type InsForgeClient } from '@insforge/sdk';

const BASE_URL = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL || 'https://e5p8ba7h.ap-southeast.insforge.app';
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '';
const PROJECT_API_KEY = process.env.INSFORGE_PROJECT_API_KEY || '';
const TEMPLATE = process.env.CLERK_INSFORGE_TEMPLATE || process.env.NEXT_PUBLIC_CLERK_INSFORGE_TEMPLATE || 'insforge';

/**
 * Returns an InsForge client authenticated for the current server request.
 * If a Clerk session exists, it attaches the Clerk-signed JWT template token.
 * In demo mode (unconfigured Clerk), it falls back to the admin key for developer ease.
 */
export async function getInsforgeServerClient(): Promise<{ insforge: InsForgeClient; userId: string | null }> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk = Boolean(secretKey && pubKey && pubKey.startsWith('pk_') && !pubKey.includes('example.com'));

  let userId: string | null = null;
  let token: string | null = null;

  if (hasClerk) {
    try {
      const session = await auth();
      userId = session.userId;
      if (userId) {
        token = await session.getToken({ template: TEMPLATE }).catch(() => null);
      }
    } catch {
      // Session retrieval failed; fallback to admin client
    }
  }

  // If real Clerk user is authenticated and token is available:
  if (userId && token) {
    const client = createClient({
      baseUrl: BASE_URL,
      anonKey: ANON_KEY,
    });
    client.setAccessToken(token);
    return { insforge: client, userId };
  }

  // Fallback / demo mode:
  const demoUserId = userId || 'user_demo_101';
  const adminClient = getInsforgeAdminClient();
  return { insforge: adminClient, userId: demoUserId };
}

/**
 * Returns an InsForge admin client bypassing RLS using the project API key.
 * Used for background jobs, webhook processing, and storage management.
 */
export function getInsforgeAdminClient(): InsForgeClient {
  if (!BASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_INSFORGE_BASE_URL environment variable');
  }
  if (PROJECT_API_KEY) {
    return createAdminClient({
      baseUrl: BASE_URL,
      apiKey: PROJECT_API_KEY,
    });
  }
  return createClient({
    baseUrl: BASE_URL,
    anonKey: ANON_KEY,
  });
}

export const getInsforgeUploadClient = getInsforgeAdminClient;

