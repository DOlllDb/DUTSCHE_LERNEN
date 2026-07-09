import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/AuthContext.js';
import { LangProvider } from './state/LangContext.js';
import { ProgressProvider } from './state/ProgressContext.js';
import { LoginPage } from './routes/LoginPage.js';
import { RegisterPage } from './routes/RegisterPage.js';
import { AppShell } from './components/AppShell/AppShell.js';

function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') return <div style={{ padding: 40 }}>Loading…</div>;
  if (status === 'anonymous') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthenticatedApp() {
  return (
    <ProgressProvider>
      <AppShell />
    </ProgressProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AuthenticatedApp />
                </RequireAuth>
              }
            />
          </Routes>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
