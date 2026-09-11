import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';

export function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Premium Mobile sidebar overlay backdrop with gradient */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gradient-to-br from-gray-900/60 via-blue-900/40 to-gray-900/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Premium Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content with premium styling */}
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-[280px]">
        <TopNav onMenuClick={() => setMobileSidebarOpen((p) => !p)} />
        
        {/* Premium Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
