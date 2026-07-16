import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth.tsx';
import Landing from './pages/Landing.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import FAQ from './pages/FAQ.tsx';
import Onboarding from './pages/Onboarding.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Entries from './pages/Entries.tsx';
import Accounts from './pages/Accounts.tsx';
import Entities from './pages/Entities.tsx';
import Settings from './pages/Settings.tsx';
import Finances from './pages/Finances.tsx';
import FinancesPyg from './pages/FinancesPyg.tsx';
import FinancesBalance from './pages/FinancesBalance.tsx';
import FinancesApuntes from './pages/FinancesApuntes.tsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/entries" element={<Entries />} />
          <Route path="/entries/new" element={<Entries />} />
          <Route path="/finances" element={<Finances />} />
          <Route path="/finances/pyg" element={<FinancesPyg />} />
          <Route path="/finances/balance" element={<FinancesBalance />} />
          <Route path="/finances/apuntes" element={<FinancesApuntes />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/entities" element={<Entities />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
