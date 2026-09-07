/**
 * Unsaved work guard
 *
 * Warns before leaving the page while a write has not reached the server.
 *
 */

import { useEffect, useSyncExternalStore } from 'react';
import { pendingWrites, subscribePendingWrites } from '../api';
import { useStore } from '../store';

export default function UnsavedGuard() {
  const pending = useSyncExternalStore(subscribePendingWrites, pendingWrites, () => 0);

  // A bulk write briefly drops to zero between rows, the flag covers the gaps
  const applying = useStore((s) => s.applying !== null);
  const saving = applying || pending > 0;

  useEffect(() => {
    if (!saving) return;

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [saving]);

  return null;
}
