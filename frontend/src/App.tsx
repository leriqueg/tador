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
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/entities" element={<Entities />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
