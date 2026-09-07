import { Menu, Search } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationPanel } from './NotificationPanel';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header 
      className="h-[72px] md:h-[72px] flex-shrink-0 flex items-center justify-between px-4 md:px-6 bg-white z-30 border-b"
      style={{ borderColor: 'var(--border-light)' }}
    >
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        {/* Premium Hamburger Menu Button - Mobile Only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden touch-target flex items-center justify-center w-10 h-10 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
          style={{ borderRadius: '12px' }}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 icon-premium-static" />
        </button>

        {/* Mobile Logo - Show on mobile when sidebar is closed */}
        <div className="flex lg:hidden items-center gap-2">
          <img src="/logo.svg" alt="VC" className="w-8 h-8" />
          <span className="text-sm font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}>
            Vertical Capital
          </span>
        </div>

        {/* Desktop Search Bar */}
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
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Search Button */}
        <button
          className="md:hidden touch-target flex items-center justify-center w-10 h-10 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
          style={{ borderRadius: '12px' }}
          aria-label="Search"
        >
          <Search className="w-5 h-5 icon-premium-static" />
        </button>
        
        <NotificationPanel />
        <div className="hidden md:block w-px h-6" style={{ backgroundColor: 'var(--border-light)' }} />
        <UserMenu />
      </div>
    </header>
  );
}
