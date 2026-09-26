'use client';

import { AuthChangeEvent, createClient, type InsForgeClient } from '@insforge/sdk';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppAuth } from './auth/auth-context';

const TOKEN_REFRESH_MS = 50_000; // Clerk template tokens expire in 60s by default

/**
 * Hook to access the authenticated InsForge client in Next.js components.
 * Automatically rotates Clerk JWT template tokens and handles user switching.
 */
export function useInsforgeClient(): { client: InsForgeClient; isReady: boolean } {
  const { getToken, isSignedIn, userId } = useAppAuth();
  const [isReady, setIsReady] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);

  const client = useMemo(
    () =>
      createClient({
        baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL || 'https://e5p8ba7h.ap-southeast.insforge.app',
        anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '',
      }),
    []
  );

  useEffect(() => {
    if (!isSignedIn || !userId) {
      client.setAccessToken(null);
      currentUserIdRef.current = null;
      setIsReady(false);
      return;
    }

    if (currentUserIdRef.current !== null && currentUserIdRef.current !== userId) {
      client.setAccessToken(null);
      setIsReady(false);
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const templateName = process.env.NEXT_PUBLIC_CLERK_INSFORGE_TEMPLATE || 'insforge';
        const token = await getToken?.({ template: templateName });
        if (cancelled) return;
        if (!token) {
          // If no token from Clerk template (e.g. demo mode), client is ready with anonKey
          currentUserIdRef.current = userId;
          setIsReady(true);
          return;
        }
        const event =
          currentUserIdRef.current === userId
            ? AuthChangeEvent.TOKEN_REFRESHED
            : AuthChangeEvent.SIGNED_IN;
        client.setAccessToken(token, event);
        currentUserIdRef.current = userId;
        setIsReady(true);
      } catch (err) {
        if (cancelled) return;
        client.setAccessToken(null);
        currentUserIdRef.current = null;
        setIsReady(false);
        console.error('Failed to refresh Clerk token for InsForge client:', err);
      }
    };

    void refresh();
    const id = setInterval(() => void refresh(), TOKEN_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [client, getToken, isSignedIn, userId]);

  return { client, isReady };
}

export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL || 'https://e5p8ba7h.ap-southeast.insforge.app',
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '',
});
