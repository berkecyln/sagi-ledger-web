/**
 * Write error banner
 *
 * Shown when a change could not be saved and was rolled back.
 *
 */

import { AlertTriangle, X } from 'lucide-react';
import { useStore } from '../store';

export default function ErrorBanner() {
  const writeError = useStore((s) => s.writeError);
  const clearWriteError = useStore((s) => s.clearWriteError);

  if (!writeError) return null;

  return (
    <div className="fixed bottom-24 md:bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
      <div className="flex items-start gap-2 bg-card border border-danger rounded-lg shadow-lg px-4 py-3">
        <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-ink">
          <p className="font-medium text-danger">Not saved</p>
          <p className="text-ink-muted">{writeError}</p>
        </div>
        <button
          type="button"
          onClick={clearWriteError}
          className="flex-shrink-0 text-ink-muted hover:text-ink transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
