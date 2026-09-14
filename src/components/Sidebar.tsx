import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';
import { isAdminUser } from '../features/procedures/rbac';
import { apiFetch, readJsonResponse } from '../lib/api';

const workspaceNavItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Procedures', to: '/procedures' },
  { label: 'Support', to: '/chat' },
  { label: 'Profile', to: '/profile' },
  { label: 'Settings', to: '/settings' },
];

const adminNavItems = [
  { label: 'Admin Dashboard', to: '/admin/dashboard' },
  { label: 'User Management', to: '/admin/users' },
  { label: 'Procedure Management', to: '/admin/procedures' },
  { label: 'Chat Logs', to: '/admin/chat-logs' },
];

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isAdminUser(user);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [sidebarLoading, setSidebarLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderNavLink = (item: { label: string; to: string }) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        `block rounded-3xl px-4 py-3 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-slate-800 text-white shadow-sm'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      {item.label}
    </NavLink>
  );

  useEffect(() => {
    const loadPendingCount = async () => {
      if (!isAdmin) {
        return;
      }

      setSidebarLoading(true);
      try {
        const response = await apiFetch('/api/procedures/pending-count/');
        const data = await readJsonResponse<{ pending_count: number }>(response);
        setPendingCount(data.pending_count || 0);
      } catch {
        setPendingCount(0);
      } finally {
        setSidebarLoading(false);
      }
    };

    loadPendingCount();
  }, [isAdmin]);

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col bg-slate-950 text-slate-100 shadow-lg xl:flex">
      <div className="flex h-20 items-center px-6 border-b border-slate-800">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Onda</p>
          <h1 className="mt-1 text-2xl font-semibold">{isAdmin ? 'Admin Panel' : 'Workspace'}</h1>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <nav className="space-y-1">{workspaceNavItems.map(renderNavLink)}</nav>

        {isAdmin && (
          <div className="mt-8 border-t border-slate-800 pt-6">
            <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
            <nav className="space-y-1">
              {adminNavItems.map((item) => (
                <div key={item.to} className="relative">
                  {renderNavLink(item)}
                  {item.to === '/admin/procedures' && pendingCount > 0 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-rose-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                      {sidebarLoading ? '...' : pendingCount}
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-slate-800 p-5">
        <div className="mb-4 text-sm text-slate-500">Signed in as</div>
        <div className="mb-1 text-base font-semibold text-white">{user?.username || 'Unknown user'}</div>
        <div className="mb-4 text-sm text-slate-500">{isAdmin ? 'Administrator' : 'Standard user'}</div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-3xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
