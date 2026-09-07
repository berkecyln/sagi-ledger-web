import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { logout } from '../api';
import ThemeToggle from './ThemeToggle';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1 rounded text-sm font-medium transition-colors ${
    isActive
      ? 'bg-accent/15 text-accent'
      : 'text-ink-muted hover:bg-hover hover:text-ink'
  }`;

export default function Header() {
  return (
    <header className="bg-card border-b border-stroke px-6 py-3 flex items-center justify-between">
      <span className="font-semibold text-accent text-lg tracking-tight">Sagi</span>
      <nav className="flex items-center gap-1">
        <NavLink to="/" end className={navLinkClass}>Dashboard</NavLink>
        <NavLink to="/analytics" className={navLinkClass}>Analytics</NavLink>
        <NavLink to="/ledger" className={navLinkClass}>Ledger</NavLink>
        <NavLink to="/template" className={navLinkClass}>Template</NavLink>
        <div className="w-px h-4 bg-stroke mx-1" />
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
    </header>
  );
}
