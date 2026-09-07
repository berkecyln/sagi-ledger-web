/**
 * Sign in and sign up screen
 *
 * Shown by AuthGate whenever there is no session.
 *
 */

import { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { login, signup } from '../api';
import ThemeToggle from '../components/ThemeToggle';

const MIN_USERNAME = 3;
const MIN_PASSWORD = 8;

const inputClass =
  'w-full bg-subtle border border-stroke rounded px-3 py-2 text-sm text-ink placeholder:text-ink-ghost focus:outline-none focus:border-accent';
const labelClass = 'block text-xs font-medium text-ink-muted mb-1';

// Password input
function PasswordField({
  id, label, value, autoComplete, placeholder, onChange,
}: {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  // Visbility toggle
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={id} type={visible ? 'text' : 'password'} required
          autoComplete={autoComplete} placeholder={placeholder}
          value={value} onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-9`}
        />
        {/* Toggle visibility */}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-muted hover:text-ink transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function AuthScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Validate the request before sending it to the server
  function validate(): string {
    if (username.trim().length < MIN_USERNAME) return `Username needs at least ${MIN_USERNAME} characters.`;
    if (password.length < MIN_PASSWORD) return `Password needs at least ${MIN_PASSWORD} characters.`;
    if (isSignup && password !== confirm) return 'Passwords do not match.';
    if (isSignup && !inviteCode.trim()) return 'An invite code is required.';
    return '';
  }

  // Sign in or create the account
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    setError('');
    try {
      if (isSignup) {
        await signup(username.trim(), password, inviteCode.trim());
      } else {
        await login(username.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  // Swap between the two modes and clear the form
  function toggleMode() {
    setIsSignup((s) => !s);
    setPassword('');
    setConfirm('');
    setInviteCode('');
    setError('');
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="font-semibold text-accent text-2xl tracking-tight">Sagi</span>
        </div>

        <div className="bg-card rounded-lg border border-stroke shadow-lg">
          <div className="px-5 py-4 rounded-t-lg border-b border-stroke bg-page">
            <h1 className="font-semibold text-base text-ink">
              {isSignup ? 'Create account' : 'Sign in'}
            </h1>
          </div>

          <form autoComplete="off" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div>
              <label htmlFor="username" className={labelClass}>Username</label>
              <input
                id="username" type="text" autoComplete="username" required
                value={username} onChange={(e) => setUsername(e.target.value)}
                className={inputClass} placeholder="e.g. gunnleif"
              />
            </div>

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={`At least ${MIN_PASSWORD} characters`}
            />

            {isSignup && (
              <PasswordField
                id="confirm"
                label="Confirm password"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
              />
            )}

            {isSignup && (
              <div>
                <label htmlFor="inviteCode" className={labelClass}>Invite code</label>
                <input
                  id="inviteCode" type="text" autoComplete="off" required
                  value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                  className={inputClass} placeholder="Ask the person who runs this"
                />
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded font-medium bg-accent text-page hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {isSignup ? <UserPlus size={16} /> : <LogIn size={16} />}
              {busy ? 'Working...' : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="px-5 pb-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-ink-muted hover:text-ink transition-colors"
            >
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
