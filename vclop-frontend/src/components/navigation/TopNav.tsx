import { Menu, Search } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationPanel } from './NotificationPanel';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header 
      className="h-[72px] flex-shrink-0 flex items-center justify-between px-6 bg-white z-30 border-b"
      style={{ borderColor: 'var(--border-light)' }}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Monzo-style hamburger button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-10 h-10 hover:bg-gray-50 transition-colors duration-150"
          style={{ borderRadius: '12px' }}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>

        {/* Monzo-style Clean Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search customers, loans..."
              className="form-input pl-11 text-[15px]"
            />
          </div>
        </div>
      </div>

      {/* Right: Clean actions */}
      <div className="flex items-center gap-3">
        <NotificationPanel />
        <div className="w-px h-6" style={{ backgroundColor: 'var(--border-light)' }} />
        <UserMenu />
      </div>
    </header>
  );
}
