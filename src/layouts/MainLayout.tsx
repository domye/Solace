import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from '@/components/common';
import { ProfileWidget } from '@/components/widget';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 max-w-[var(--page-width)] mx-auto w-full px-0 md:px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[17.5rem_auto] gap-4">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <ProfileWidget />
          </aside>

          {/* Main */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>

        {/* Mobile Footer */}
        <div className="block lg:hidden mt-4">
          <Footer />
        </div>
      </div>

      {/* Desktop Footer */}
      <div className="hidden lg:block max-w-[var(--page-width)] mx-auto w-full px-4">
        <Footer />
      </div>
    </div>
  );
}