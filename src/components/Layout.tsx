import { Outlet } from 'react-router-dom';
import Header from './Header';
import MonthBar from './MonthBar';
import CumulativeFooter from './CumulativeFooter';

export default function Layout() {
  return (
    <div className="h-screen flex flex-col bg-page overflow-hidden">
      <Header />
      <MonthBar />
      <main className="flex-1 p-6 overflow-hidden flex flex-col min-h-0">
        <Outlet />
      </main>
      <CumulativeFooter />
    </div>
  );
}
