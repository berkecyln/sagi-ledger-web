import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Ledger from './pages/Ledger';
import TemplateManager from './pages/TemplateManager';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="template" element={<TemplateManager />} />
      </Route>
    </Routes>
  );
}
