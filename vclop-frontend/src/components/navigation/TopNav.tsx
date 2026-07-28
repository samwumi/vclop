import { Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationPanel } from './NotificationPanel';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header className="h-[60px] flex-shrink-0 flex items-center justify-between px-4 bg-white border-b border-gray-200 z-30">
      {/* Left: hamburger */}
      <button
        onClick={onMenuClick}
        className="btn-icon btn-ghost w-9 h-9"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5 text-gray-500" />
      </button>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <NotificationPanel />
        <div className="w-px h-5 bg-gray-200" />
        <UserMenu />
      </div>
    </header>
  );
}
