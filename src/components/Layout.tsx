import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setConfirmLogoutOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-paper-100">
      <Sidebar
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onLogout={() => setConfirmLogoutOpen(true)}
        role={user?.role ?? 'member'}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-ink-900/10 sticky top-0 z-20">
          <button
            type="button"
            aria-label="Toggle navigation menu"
            data-testid="hamburger-menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden flex flex-col gap-1.5 p-2 -ml-2"
          >
            <span className="w-5 h-0.5 bg-ink-900 block" />
            <span className="w-5 h-0.5 bg-ink-900 block" />
            <span className="w-5 h-0.5 bg-ink-900 block" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3" data-testid="topbar-user">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-ink-900" data-testid="topbar-user-name">
                {user?.name}
              </div>
              <div className="text-xs text-ink-600 capitalize" data-testid="topbar-user-role">
                {user?.role}
              </div>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ backgroundColor: user?.avatarColor }}
              aria-hidden="true"
            >
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6" data-testid="page-content">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogoutOpen}
        title="Log out of LibraryHub?"
        message="You'll need to sign in again to access the dashboard."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        danger
        testId="confirm-logout-dialog"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
    </div>
  );
}
