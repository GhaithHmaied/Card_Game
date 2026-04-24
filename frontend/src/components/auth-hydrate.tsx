'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Ensures zustand `persist` has read localStorage after the app mounts (Next.js SSR
 * otherwise serves a shell where the client store has not rehydrated yet).
 */
export function AuthHydrate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);
  return <>{children}</>;
}
