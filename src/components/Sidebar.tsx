import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  to: string;
  testId: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', testId: 'nav-dashboard', icon: '◱' },
  { label: 'Books', to: '/books', testId: 'nav-books', icon: '▤' },
  { label: 'Members', to: '/members', testId: 'nav-members', icon: '◉' },
  { label: 'Issue Book', to: '/issue-book', testId: 'nav-issue-book', icon: '↷' },
  { label: 'Return Books', to: '/return-books', testId: 'nav-return-books', icon: '↶' },
  { label: 'Overdue Books', to: '/overdue-books', testId: 'nav-overdue-books', icon: '⚑' },
  { label: 'Issue History', to: '/issue-history', testId: 'nav-issue-history', icon: '☰' },
  { label: 'Categories', to: '/categories', testId: 'nav-categories', icon: '▣' },
  { label: 'Profile', to: '/profile', testId: 'nav-profile', icon: '◍' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onNavigate: () => void;
  onLogout: () => void;
}

export default function Sidebar({ mobileOpen, onNavigate, onLogout }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-ink-950/50 z-30 lg:hidden"
          data-testid="sidebar-scrim"
          onClick={onNavigate}
        />
      )}
      <aside
        data-testid="sidebar"
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-ink-950 text-paper-50 flex flex-col z-40 transform transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div className="stamp text-amber-glow border-amber-glow/50">LH</div>
          <span className="font-display font-bold text-lg tracking-tight" data-testid="app-logo">
            LibraryHub
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto thin-scroll py-3" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testId}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-3 my-0.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'text-paper-200/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span aria-hidden="true" className="w-5 text-center">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            data-testid="logout-button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-paper-200/80 hover:bg-white/10 hover:text-white"
          >
            <span aria-hidden="true" className="w-5 text-center">
              ⎋
            </span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
