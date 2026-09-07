/**
 * Theme toggle
 *
 * Switches between light and dark, stored in localStorage as sagi-theme.
 *
 */

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Read the saved theme and apply it to the document
function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('sagi-theme') === 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('sagi-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark] as const;
}

export default function ThemeToggle() {
  const [dark, setDark] = useDarkMode();

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-hover transition-colors"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
