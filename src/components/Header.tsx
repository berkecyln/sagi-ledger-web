/**
 * Header
 *
 * Logo, page links and account actions.
 * On phones the links are icons and Analytics is hidden.
 *
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChartPie, DatabaseBackup, House, LayoutTemplate, LogOut, ReceiptText, type LucideIcon } from 'lucide-react';
import { logout } from '../api';
import ImportPrompt from './ImportPrompt';
import ThemeToggle from './ThemeToggle';
import { useStore } from '../store';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  desktopOnly?: boolean;
}

// Page links, words on desktop and icons on phones
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: House, end: true },
  { to: '/analytics', label: 'Analytics', icon: ChartPie, desktopOnly: true },
  { to: '/ledger', label: 'Ledger', icon: ReceiptText },
  { to: '/template', label: 'Template', icon: LayoutTemplate },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center p-2 md:px-3 md:py-1 rounded text-sm font-medium transition-colors ${
    isActive
      ? 'bg-accent/15 text-accent'
      : 'text-ink-muted hover:bg-hover hover:text-ink'
  }`;

export default function Header() {
  const [importing, setImporting] = useState(false);
  const hasLegacyData = useStore((s) => s.hasLegacy);

  return (
    <header className="bg-card border-b border-stroke px-4 md:px-6 py-3 flex items-center justify-between">
      <span className="font-semibold text-accent text-lg tracking-tight">Sagi</span>
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, desktopOnly }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            aria-label={label}
            className={(state) => `${navLinkClass(state)}${desktopOnly ? ' max-md:hidden' : ''}`}
          >
            <Icon size={18} className="md:hidden" />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
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
