'use client';

import { useEffect } from 'react';
import { initializeAuth } from '@/stores/auth-store';

/**
 * Hydrates auth state from localStorage on mount.
 * The Zustand store update triggers re-render automatically.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeAuth();
  }, []);

  return <>{children}</>;
}
