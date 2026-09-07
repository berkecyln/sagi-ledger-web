/**
 * Import prompt
 *
 * Offers the one time move of the pre-server ledger onto the backend.
 *
 */

import { useMemo, useState } from 'react';
import { CheckCircle2, Download, Loader2, X } from 'lucide-react';
import {
  clearLegacyBlob,
  describeError,
  downloadLegacyBackup,
  loadAll,
  planImport,
  readLegacyBlob,
  runImport,
  type ImportResult,
} from '../api';
import { useStore } from '../store';

type Phase = 'idle' | 'running' | 'done' | 'error';

export default function ImportPrompt({ onClose }: { onClose: () => void }) {
  const blob = useMemo(() => readLegacyBlob(), []);
  const plan = useMemo(() => (blob ? planImport(blob) : null), [blob]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState('');

  if (!blob || !plan) return null;

  // Import, confirm the server agrees, save a copy, then clear the browser
  async function handleImport() {
    if (!blob || !plan) return;
    setPhase('running');
    setMessage('');
    try {
      const imported = await runImport(blob, (done, total) => setProgress({ done, total }));
      const server = await loadAll();

      const onServer = Object.values(server.months).flat().length;
      if (onServer < plan.transactions) {
        throw new Error(
          `Only ${onServer} of ${plan.transactions} transactions reached the server. Nothing was cleared.`,
        );
      }

      useStore.getState().hydrate(server);
      downloadLegacyBackup(blob);
      clearLegacyBlob();
      setResult(imported);
      setPhase('done');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : describeError(error));
      setPhase('error');
    }
  }

  const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-card rounded-lg w-full max-w-md border border-stroke shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 rounded-t-lg border-b border-stroke bg-page">
          <h2 className="font-semibold text-base text-ink">Import your old data</h2>
          {phase !== 'running' && (
            <button onClick={onClose} className="hover:opacity-60 transition-opacity text-ink-muted" aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-5 py-4 space-y-4">
          {phase === 'idle' && (
            <>
              <p className="text-sm text-ink-muted">
                This browser still holds a ledger saved before Sagi used a server.
              </p>
              <ul className="text-sm text-ink space-y-1">
                <li>{plan.transactions} transactions</li>
                <li>{plan.templateItems} template items</li>
                <li>{plan.accounts.length} accounts ({plan.accounts.join(', ')})</li>
                <li>{plan.descriptions} description labels</li>
              </ul>
              <p className="text-xs text-ink-faint">
                A copy is downloaded before this browser's copy is cleared.
              </p>
            </>
          )}

          {phase === 'running' && (
            <>
              <div className="flex items-center gap-2 text-sm text-ink">
                <Loader2 size={16} className="animate-spin text-accent" />
                Importing {progress.done} of {progress.total}
              </div>
              <div className="h-1.5 bg-subtle rounded overflow-hidden">
                <div className="h-full bg-accent transition-all duration-200" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-ink-faint">
                Writes are paced to stay under the server limit. Leave this open.
              </p>
            </>
          )}

          {phase === 'done' && result && (
            <>
              <div className="flex items-center gap-2 text-sm text-income">
                <CheckCircle2 size={16} />
                Import complete
              </div>
              <ul className="text-sm text-ink space-y-1">
                <li>{result.transactions} transactions written</li>
                <li>{result.templateItems} template items, {result.accounts} accounts, {result.descriptions} labels</li>
                {result.skipped > 0 && <li className="text-ink-muted">{result.skipped} already there, skipped</li>}
              </ul>
              <p className="flex items-center gap-1.5 text-xs text-ink-faint">
                <Download size={13} /> A copy was saved to your downloads, and this browser's copy was cleared.
              </p>
            </>
          )}

          {phase === 'error' && (
            <p className="text-sm text-danger">{message}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 pb-4">
          {phase === 'idle' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded border border-stroke text-ink hover:bg-page transition-colors"
              >
                Not now
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 text-sm rounded font-medium bg-accent text-page hover:opacity-80 transition-opacity"
              >
                Import {plan.total} records
              </button>
            </>
          )}
          {phase === 'error' && (
            <button
              onClick={handleImport}
              className="px-4 py-2 text-sm rounded font-medium bg-accent text-page hover:opacity-80 transition-opacity"
            >
              Try again
            </button>
          )}
          {phase === 'done' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded font-medium bg-accent text-page hover:opacity-80 transition-opacity"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
