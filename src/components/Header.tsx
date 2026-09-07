import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { DatabaseBackup, LogOut } from 'lucide-react';
import { hasLegacyBlob, logout } from '../api';
import ImportPrompt from './ImportPrompt';
import ThemeToggle from './ThemeToggle';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1 rounded text-sm font-medium transition-colors ${
    isActive
      ? 'bg-accent/15 text-accent'
      : 'text-ink-muted hover:bg-hover hover:text-ink'
  }`;

export default function Header() {
  const [importing, setImporting] = useState(false);
  const hasLegacyData = hasLegacyBlob();

  return (
    <header className="bg-card border-b border-stroke px-6 py-3 flex items-center justify-between">
      <span className="font-semibold text-accent text-lg tracking-tight">Sagi</span>
      <nav className="flex items-center gap-1">
        <NavLink to="/" end className={navLinkClass}>Dashboard</NavLink>
        <NavLink to="/analytics" className={navLinkClass}>Analytics</NavLink>
        <NavLink to="/ledger" className={navLinkClass}>Ledger</NavLink>
        <NavLink to="/template" className={navLinkClass}>Template</NavLink>
        <div className="w-px h-4 bg-stroke mx-1" />
        {hasLegacyData && (
          <button
            onClick={() => setImporting(true)}
            className="p-1.5 rounded text-accent hover:bg-hover transition-colors"
            aria-label="Import my old data"
            title="Import my old data"
          >
            <DatabaseBackup size={16} />
          </button>
        )}
        <ThemeToggle />
        <button
          onClick={logout}
          className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-hover transition-colors"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </nav>
      {importing && <ImportPrompt onClose={() => setImporting(false)} />}
    </header>
  );
}
