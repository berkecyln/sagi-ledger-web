import { Outlet } from 'react-router-dom';
import Header from './Header';
import MonthBar from './MonthBar';
import CumulativeFooter from './CumulativeFooter';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Header />
      <MonthBar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
      <CumulativeFooter />
    </div>
  );
}
