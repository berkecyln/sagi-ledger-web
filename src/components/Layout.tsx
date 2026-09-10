/**
 * Layout
 *
 * App shell around every page.
 * On phones the whole page scrolls, on desktop it fills the screen and pages scroll inside.
 *
 */

import { Outlet } from 'react-router-dom';
import Header from './Header';
import MonthBar from './MonthBar';
import CumulativeFooter from './CumulativeFooter';
import ErrorBanner from './ErrorBanner';
import UnsavedGuard from './UnsavedGuard';

export default function Layout() {
  return (
    <div className="min-h-dvh flex flex-col bg-page md:h-dvh md:overflow-hidden">
      <Header />
      <MonthBar />
      <main className="flex-1 p-3 md:p-6 flex flex-col md:overflow-hidden md:min-h-0">
        <Outlet />
      </main>
      <CumulativeFooter />
      <ErrorBanner />
      <UnsavedGuard />
    </div>
  );
}
