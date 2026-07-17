import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth.tsx';
import ModeNamespaceGuard from './components/routing/ModeNamespaceGuard.tsx';
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
import ProDashboard from './pages/pro/ProDashboard.tsx';
import ProEntries from './pages/pro/ProEntries.tsx';
import ProEntriesManual from './pages/pro/ProEntriesManual.tsx';
import ProAccounts from './pages/pro/ProAccounts.tsx';
import ProEntities from './pages/pro/ProEntities.tsx';
import ProSettings from './pages/pro/ProSettings.tsx';
import ProFinances from './pages/pro/ProFinances.tsx';
import ProFinancesPyg from './pages/pro/ProFinancesPyg.tsx';
import ProFinancesBalance from './pages/pro/ProFinancesBalance.tsx';
import ProFinancesApuntes from './pages/pro/ProFinancesApuntes.tsx';

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

          <Route element={<ModeNamespaceGuard />}>
            {/* Legacy unprefixed routes (pre-Sprint-07) — redirected to /hogar/* or /pro/* by mode */}
            <Route path="/dashboard" element={null} />
            <Route path="/entries" element={null} />
            <Route path="/entries/new" element={null} />
            <Route path="/finances" element={null} />
            <Route path="/finances/pyg" element={null} />
            <Route path="/finances/balance" element={null} />
            <Route path="/finances/apuntes" element={null} />
            <Route path="/accounts" element={null} />
            <Route path="/entities" element={null} />
            <Route path="/settings" element={null} />

            {/* Hogar namespace (QuickAdd) — see specs/foundation/modos-hogar-pro.md */}
            <Route path="/hogar/dashboard" element={<Dashboard />} />
            <Route path="/hogar/entries" element={<Entries />} />
            <Route path="/hogar/entries/new" element={<Entries />} />
            <Route path="/hogar/finances" element={<Finances />} />
            <Route path="/hogar/finances/pyg" element={<FinancesPyg />} />
            <Route path="/hogar/finances/balance" element={<FinancesBalance />} />
            <Route path="/hogar/finances/apuntes" element={<FinancesApuntes />} />
            <Route path="/hogar/accounts" element={<Accounts />} />
            <Route path="/hogar/entities" element={<Entities />} />
            <Route path="/hogar/settings" element={<Settings />} />

            {/* PRO namespace (EntryBuilder) — shells for T009; EntryBuilder/tree/finances land in T013+ */}
            <Route path="/pro/dashboard" element={<ProDashboard />} />
            <Route path="/pro/entries" element={<ProEntries />} />
            <Route path="/pro/entries/manual" element={<ProEntriesManual />} />
            <Route path="/pro/entries/new" element={<ProEntries />} />
            <Route path="/pro/finances" element={<ProFinances />} />
            <Route path="/pro/finances/pyg" element={<ProFinancesPyg />} />
            <Route path="/pro/finances/balance" element={<ProFinancesBalance />} />
            <Route path="/pro/finances/apuntes" element={<ProFinancesApuntes />} />
            <Route path="/pro/accounts" element={<ProAccounts />} />
            <Route path="/pro/entities" element={<ProEntities />} />
            <Route path="/pro/settings" element={<ProSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
