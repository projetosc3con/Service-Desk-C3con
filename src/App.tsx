import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { HomePage } from './pages/public/HomePage';
import { PublicTicketPage } from './pages/public/PublicTicketPage';
import { TicketSuccessPage } from './pages/public/TicketSuccessPage';
import { LoginPage } from './pages/auth/LoginPage';
import { TicketQueuePage } from './pages/app/TicketQueuePage';
import { TicketDetailPage } from './pages/app/TicketDetailPage';
import { KanbanPage } from './pages/app/KanbanPage';
import { ApplicationsAdminPage } from './pages/app/ApplicationsAdminPage';
import { TeamAdminPage } from './pages/app/TeamAdminPage';
import { SlaAdminPage } from './pages/app/SlaAdminPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/novo-chamado" element={<PublicTicketPage />} />
          <Route path="/abrir-chamado" element={<Navigate to="/novo-chamado" replace />} />
          <Route path="/chamado-enviado/:protocol" element={<TicketSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Internal App Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/fila" replace />} />
            <Route path="fila" element={<TicketQueuePage />} />
            <Route path="chamados/:id" element={<TicketDetailPage />} />
            <Route path="kanban" element={<KanbanPage />} />

            {/* Admin-only Routes */}
            <Route
              path="sla"
              element={
                <ProtectedRoute requireAdmin>
                  <SlaAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="aplicacoes"
              element={
                <ProtectedRoute requireAdmin>
                  <ApplicationsAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="equipe"
              element={
                <ProtectedRoute requireAdmin>
                  <TeamAdminPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
