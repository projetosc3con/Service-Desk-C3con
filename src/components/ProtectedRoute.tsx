import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-c3con-gold-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Carregando permissões...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in, but not active staff
  if (!isStaff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Acesso Pendente ou Inativo</h2>
          <p className="text-sm text-slate-600 mb-6">
            Sua conta de colaborador ({user.email}) foi criada, mas ainda está pendente de ativação por um administrador.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="text-sm text-c3con-gold-600 font-medium hover:underline"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  // Requires admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/app/fila" replace />;
  }

  return <>{children}</>;
};
