import { Menu, Search } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationPanel } from './NotificationPanel';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header className="h-[72px] flex-shrink-0 flex items-center justify-between px-6 bg-white/95 backdrop-blur-2xl border-b border-gray-200/60 z-30 shadow-sm relative">
      {/* Premium gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex items-center gap-4 flex-1">
        {/* Premium hamburger button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/60 hover:bg-white hover:border-gray-300 hover:shadow-md transition-all duration-300 group"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
        </button>

        {/* Premium Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers, loans, applications..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/60 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 hover:border-gray-300 hover:shadow-md transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Right: Premium actions */}
      <div className="relative z-10 flex items-center gap-3">
        <NotificationPanel />
        <div className="w-px h-6 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
        <UserMenu />
      </div>
    </header>
  );
}
