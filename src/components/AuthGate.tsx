/**
 * Auth gate
 *
 * Renders the app when a session exists, the sign in screen when it does not,
 * and loads the signed in user's data before the app is shown.
 *
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  currentUser,
  describeError,
  isEmpty,
  loadAll,
  onAuthChange,
  hasLegacyBlob,
  resetAccountCache,
  type SessionUser,
} from '../api';
import { useStore } from '../store';
import AuthScreen from '../pages/AuthScreen';
import ImportPrompt from './ImportPrompt';

// Full screen spinner shown while the first fetch runs
function Loading() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-accent" />
    </div>
  );
}

// Shown when the fetch fails, with a way to try again
function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="bg-card rounded-lg border border-stroke shadow-lg p-6 max-w-sm w-full text-center">
        <p className="text-sm text-danger mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded font-medium bg-accent text-page hover:opacity-80 transition-opacity"
        >
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  // The SDK restores a saved session before the first render
  const [user, setUser] = useState<SessionUser | null>(() => currentUser());
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const offerImport = useStore((s) => s.offerImport);

  // Follow sign in, sign out and token refresh
  useEffect(() => onAuthChange(setUser), []);

  // Fetch everything belonging to the signed in user
  const load = useCallback(async () => {
    const { startLoading, hydrate, failLoading } = useStore.getState();
    startLoading();
    try {
      const server = await loadAll();
      hydrate(server);
      // Nothing on the server yet, but this browser still holds the old ledger
      const legacy = hasLegacyBlob();
      useStore.getState().setHasLegacy(legacy);
      useStore.getState().setOfferImport(isEmpty(server) && legacy);
    } catch (err) {
      failLoading(describeError(err));
    }
  }, []);

  useEffect(() => {
    if (user) {
      load();
      return;
    }
    // Drop the previous user's data on sign out
    useStore.getState().reset();
    resetAccountCache();
  }, [user, load]);

  if (!user) return <AuthScreen />;
  if (status === 'error') return <LoadError message={error ?? ''} onRetry={load} />;
  if (status === 'loading') return <Loading />;

  return (
    <>
      {children}
      {offerImport && (
        <ImportPrompt onClose={() => useStore.getState().setOfferImport(false)} />
      )}
    </>
  );
}
