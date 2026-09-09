import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Inbox,
  Kanban,
  Layers,
  Users,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

export const AppLayout: React.FC = () => {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/app/fila',
      label: 'Fila de Solicitações',
      icon: Inbox,
    },
    {
      to: '/app/kanban',
      label: 'Kanban Pessoal',
      icon: Kanban,
    },
  ];

  const adminNavItems = [
    {
      to: '/app/aplicacoes',
      label: 'Aplicações',
      icon: Layers,
    },
    {
      to: '/app/equipe',
      label: 'Equipe & Papéis',
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <header className="md:hidden bg-c3con-dark-900 text-white px-4 py-3 flex items-center justify-between border-b border-c3con-dark-800 sticky top-0 z-30">
        <Link to="/app/fila" className="flex items-center gap-2.5">
          <img src="/LOGO-A.png" alt="C3con" className="h-8 w-auto object-contain bg-white/5 rounded p-1" />
          <span className="font-bold text-base tracking-wide text-white">Service Desk</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-c3con-dark-800"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar for Desktop & Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-c3con-dark-900 text-slate-300 flex flex-col border-r border-c3con-dark-800 transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:min-h-screen',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 max-md:-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-c3con-dark-800 flex items-center gap-3">
          <img
            src="/LOGO-A.png"
            alt="C3con Soluções"
            className="h-20 w-auto object-contain bg-white rounded-lg p-1.5 shadow-sm"
          />
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">C3con</h1>
            <p className="text-[11px] font-medium text-c3con-gold-400 uppercase tracking-wider">Service Desk</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Atendimento
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-c3con-gold-500 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-c3con-dark-800 hover:text-white'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {isAdmin && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-c3con-gold-400">
                  Administração
                </p>
                <ShieldCheck className="w-3.5 h-3.5 text-c3con-gold-400" />
              </div>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-c3con-gold-500 text-white shadow-sm'
                            : 'text-slate-300 hover:bg-c3con-dark-800 hover:text-white'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}

          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Canal Externo
            </p>
            <a
              href="/novo-chamado"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-c3con-dark-800 hover:text-white transition-colors"
            >
              <span>Abrir Novo Chamado</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* User Profile & Signout Footer */}
        <div className="p-3 border-t border-c3con-dark-800 bg-c3con-dark-950/40">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-c3con-gold-600 to-c3con-gold-400 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Usuário'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {profile?.role && (
                  <Badge
                    className={cn(
                      'text-[10px] px-1.5 py-0',
                      profile.role === 'admin'
                        ? 'bg-c3con-gold-400/20 text-c3con-gold-300 border-c3con-gold-500/30'
                        : 'bg-slate-700/50 text-slate-300'
                    )}
                  >
                    {profile.role === 'admin' ? (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Admin
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5" /> Agente
                      </span>
                    )}
                  </Badge>
                )}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sair da conta"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-c3con-dark-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden"
        />
      )}
    </div>
  );
};
