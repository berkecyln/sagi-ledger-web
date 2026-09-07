/**
 * Auth gate
 *
 * Renders the app when a session exists, the sign in screen when it does not.
 *
 */

import { useEffect, useState, type ReactNode } from 'react';
import { currentUser, onAuthChange, type SessionUser } from '../api';
import AuthScreen from '../pages/AuthScreen';

export default function AuthGate({ children }: { children: ReactNode }) {
  // The SDK restores a saved session before the first render
  const [user, setUser] = useState<SessionUser | null>(() => currentUser());

  // Follow sign in, sign out and token refresh
  useEffect(() => onAuthChange(setUser), []);

  if (!user) return <AuthScreen />;
  return <>{children}</>;
}
