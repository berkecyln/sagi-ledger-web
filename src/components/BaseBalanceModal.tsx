import { useState } from "react";
import { X, Save, Plus, Undo2 } from "lucide-react";
import { useStore } from "../store";
import { getNextColor } from "../utils/colors";
import { isAccountInUse, parseEuro, toEuroInput } from "../utils/aggregations";

interface Props {
  onClose: () => void;
}

export default function BaseBalanceModal({ onClose }: Props) {
  const accountColors = useStore((state) => state.accountColors);
  const baseAccountBalances = useStore((state) => state.baseAccountBalances);
  const setBaseAccountBalance = useStore((state) => state.setBaseAccountBalance);
  const setAccountColor = useStore((state) => state.setAccountColor);
  const deleteAccount = useStore((state) => state.deleteAccount);
  const months = useStore((state) => state.months);
  const template = useStore((state) => state.template);

  const accounts = Object.keys(accountColors).sort();

  const [balances, setBalances] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const acc of accounts) {
      initial[acc] =
        baseAccountBalances[acc] !== undefined
          ? toEuroInput(baseAccountBalances[acc])
          : "";
    }
    return initial;
  });

  const [newAccounts, setNewAccounts] = useState<Array<{ id: number; name: string; amount: string }>>([]);
  const [nextId, setNextId] = useState(1);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  function handleAddNewRow() {
    setNewAccounts([...newAccounts, { id: nextId, name: "", amount: "" }]);
    setNextId(nextId + 1);
  }

  function handleRemoveNewRow(id: number) {
    setNewAccounts(newAccounts.filter((acc) => acc.id !== id));
  }

  // Mark or unmark an account for removal on save
  function handleToggleRemove(account: string) {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(account)) next.delete(account);
      else next.add(account);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Save existing accounts
    for (const [account, value] of Object.entries(balances)) {
      if (removed.has(account)) continue;
      const cents = parseEuro(value);
      if (cents !== null) {
        setBaseAccountBalance(account, cents);
      } else if (value.trim() === "") {
        setBaseAccountBalance(account, 0); // Default to 0 if cleared
      }
    }

    // Remove marked accounts
    for (const account of removed) {
      deleteAccount(account);
    }

    // Save newly added accounts
    for (const acc of newAccounts) {
      const name = acc.name.trim();
      if (!name) continue;

      setBaseAccountBalance(name, parseEuro(acc.amount) ?? 0);

      if (!accountColors[name]) {
        setAccountColor(name, getNextColor(accountColors));
      }
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-card rounded-lg w-full max-w-sm border border-stroke shadow-lg">
        <div className="px-5 py-4 rounded-t-lg border-b border-stroke bg-page">
          <h2 className="font-semibold text-base text-ink">
            Adjust Saving Base Amounts
          </h2>
        </div>

        <form autoComplete="off" onSubmit={handleSubmit} className="px-5 py-4 flex flex-col max-h-[85vh]">
          <p className="text-xs text-ink-muted mb-4 flex-shrink-0">
            Set an initial starting balance for your accounts. This will be
            added to the calculated cumulative totals.
          </p>

          <div className="space-y-3 overflow-y-auto pr-1 pb-2 flex-grow">
            {accounts.length === 0 && newAccounts.length === 0 ? (
              <p className="text-sm text-ink-muted italic">
                No accounts exist yet. Click below to add one.
              </p>
            ) : (
              accounts.map((account) => {
                const inUse = isAccountInUse(account, months, template);
                const isRemoved = removed.has(account);
                return (
                <div
                  key={account}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: accountColors[account] || "#ccc",
                      }}
                    />
                    <span
                      className={`font-medium text-sm truncate ${isRemoved ? "line-through opacity-50" : ""}`}
                      style={{ color: accountColors[account] || "var(--ink)" }}
                    >
                      {account}
                    </span>
                  </div>
                  <div className="flex-shrink-0 relative w-24">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">
                      €
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={balances[account] || ""}
                      disabled={isRemoved}
                      onChange={(e) =>
                        setBalances({ ...balances, [account]: e.target.value })
                      }
                      className="w-full disabled:line-through disabled:opacity-50 bg-background border border-stroke rounded pl-6 pr-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent/50"
                      placeholder="0,00"
                    />
                  </div>
                  {/* Remove account, or undo the removal */}
                  <button
                    type="button"
                    disabled={inUse}
                    onClick={() => handleToggleRemove(account)}
                    className={
                      inUse
                        ? "text-ink-ghost cursor-not-allowed"
                        : "text-ink-muted hover:text-danger transition-colors"
                    }
                    aria-label={isRemoved ? `Keep ${account}` : `Remove ${account}`}
                    title={
                      inUse
                        ? "Still used by transactions"
                        : isRemoved
                          ? "Keep account"
                          : "Remove account"
                    }
                  >
                    {isRemoved ? <Undo2 size={16} /> : <X size={16} />}
                  </button>
                </div>
                );
              })
            )}

            {newAccounts.map((acc, index) => (
              <div key={acc.id} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    autoComplete="off"
                    value={acc.name}
                    onChange={(e) => {
                      const updated = [...newAccounts];
                      updated[index].name = e.target.value;
                      setNewAccounts(updated);
                    }}
                    className="w-full bg-background border border-stroke rounded px-3 py-1.5 text-sm text-ink placeholder:text-ink-ghost focus:outline-none focus:ring-1 focus:ring-accent/50"
                    placeholder="New account name"
                    autoFocus
                  />
                </div>
                <div className="flex-shrink-0 relative w-24">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">
                    €
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={acc.amount}
                    onChange={(e) => {
                      const updated = [...newAccounts];
                      updated[index].amount = e.target.value;
                      setNewAccounts(updated);
                    }}
                    className="w-full bg-background border border-stroke rounded pl-6 pr-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent/50"
                    placeholder="0,00"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveNewRow(acc.id)}
                  className="text-ink-muted hover:text-danger transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleAddNewRow}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink font-medium transition-colors"
            >
              <Plus size={16} /> Add New Account
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-6 mt-2 border-t border-stroke flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded border border-stroke text-ink hover:bg-page transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded font-medium bg-accent text-page hover:opacity-80 transition-opacity"
            >
              <Save size={16} /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
